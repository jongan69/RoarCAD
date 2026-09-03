import { PCBViewer } from "@tscircuit/pcb-viewer"
import { SchematicViewer } from "@tscircuit/schematic-viewer"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  adoptCheckpoint,
  type Checkpoint,
  checkpointFile,
  checkpointUrl,
  compareCheckpoint,
  createCheckpoint,
  forkCheckpoint,
  MAX_CHECKPOINT_BYTES,
  parseCheckpointFile,
  watchCheckpointLocation,
} from "./checkpoints"
import {
  applyChange,
  applyHumanReview,
  type BoardGraph,
  type BoardProject,
  boardGraphSchema,
  captureBridgeSnapshot,
  createDraftSnapshot,
  createProject,
  currentRevision,
  type DesignChange,
  importProject,
  indicatorSnapshot,
  previewChange,
  sanitizeAgentOperations,
  validateSnapshot,
  withValidation,
} from "./domain"
import { type ArtifactClass, downloadBlob, type PreparedExport } from "./eda"
import { compileInBackground, prepareInBackground } from "./eda-background"
import { componentDefinition } from "./explanations"
import { inspectProject } from "./inspection"
import {
  type QuoteResult,
  requestJlcQuote,
  requestMacroFabQuote,
  requestMacroFabStatus,
} from "./manufacturing"
import { environmentMonitorGraph, environmentMonitorRequirements } from "./samples"
import { chooseStartupProject, loadStoredProject, saveStoredProject } from "./storage"
import { type InspectFocus, registerWebMcpTools } from "./webmcp"

function downloadText(value: string, filename: string): void {
  downloadBlob(new Blob([value], { type: "application/json" }), filename)
}

type ViewerMove = {
  edit_event_type?: string
  pcb_component_id?: string
  new_center?: { x: number; y: number }
}

export default function App() {
  const [project, setProject] = useState<BoardProject | null>(null)
  const projectRef = useRef<BoardProject | null>(null)
  const [circuitJson, setCircuitJson] = useState<Record<string, unknown>[]>([])
  const [compiling, setCompiling] = useState(false)
  const compilingRef = useRef(false)
  const [view, setView] = useState<"pcb" | "schematic">("pcb")
  const [change, setChange] = useState<DesignChange | null>(null)
  const changeRef = useRef<DesignChange | null>(null)
  const [prepared, setPrepared] = useState<PreparedExport | null>(null)
  const [exporting, setExporting] = useState(false)
  const exportControllerRef = useRef<AbortController | null>(null)
  const [quote, setQuote] = useState<QuoteResult | null>(null)
  const [quoteBusy, setQuoteBusy] = useState(false)
  const [macroFabConfirmed, setMacroFabConfirmed] = useState(false)
  const [notice, setNotice] = useState("Loading reference design…")
  const [mode, setMode] = useState<"bare-pcb" | "pcba">("bare-pcb")
  const [artifactClass, setArtifactClass] = useState<ArtifactClass>("fabrication")
  const [moveReference, setMoveReference] = useState("D1")
  const [moveX, setMoveX] = useState(3)
  const [moveY, setMoveY] = useState(2)
  const [editEvents, setEditEvents] = useState<unknown[]>([])
  const [canvasEditing, setCanvasEditing] = useState(false)
  const [graphText, setGraphText] = useState("")
  const [checkpointNote, setCheckpointNote] = useState("")
  const [sharedCheckpoint, setSharedCheckpoint] = useState<{ key: string; url: string } | null>(
    null,
  )
  const [incomingCheckpoint, setIncomingCheckpoint] = useState<Checkpoint | null>(null)
  const incomingCheckpointRef = useRef<Checkpoint | null>(null)

  const [checkpointLoading, setCheckpointLoading] = useState(false)
  const checkpointLoadingRef = useRef(false)
  const [backupPreparedKey, setBackupPreparedKey] = useState<string | null>(null)
  const lastViewerMoveRef = useRef("")

  useEffect(() => {
    const load = async () => {
      try {
        const [stored, starter, bundledPocketRoar] = await Promise.all([
          loadStoredProject(),
          createProject("indicator", "Power indicator", indicatorSnapshot),
          createProject("capture", "PocketRoar UVC Bridge Study", captureBridgeSnapshot),
        ])
        setProject(chooseStartupProject(stored, starter, bundledPocketRoar))
      } catch {
        setProject(await createProject("indicator", "Power indicator", indicatorSnapshot))
      }
    }
    void load()
  }, [])

  useEffect(
    () =>
      watchCheckpointLocation(
        window,
        (checkpoint, error) => {
          incomingCheckpointRef.current = checkpoint
          setIncomingCheckpoint(checkpoint)
          if (error) setNotice(error)
          else if (checkpoint) setNotice("Shared checkpoint loaded for read-only review.")
        },
        (pending) => {
          checkpointLoadingRef.current = pending
          setCheckpointLoading(pending)
          if (pending) setNotice("Verifying checkpoint integrity…")
        },
      ),
    [],
  )

  useEffect(() => {
    projectRef.current = project
    if (project)
      void saveStoredProject(project).catch(() => setNotice("Project persistence failed."))
  }, [project])

  useEffect(() => {
    incomingCheckpointRef.current = incomingCheckpoint
    setBackupPreparedKey(null)
  }, [incomingCheckpoint])

  const requireProject = useCallback(() => {
    if (!projectRef.current) throw new Error("Project is not loaded.")
    return projectRef.current
  }, [])

  const requireWritableWorkspace = useCallback(() => {
    if (checkpointLoadingRef.current || incomingCheckpointRef.current) {
      throw new Error("Dismiss, continue, or adopt the incoming checkpoint before changing state.")
    }
  }, [])

  const actions = useMemo(
    () => ({
      draft: async (requirements: string, design?: BoardGraph) => {
        requireWritableWorkspace()
        const next = await createProject(
          design ? "custom-board" : "requirements-draft",
          design ? "Custom PCB board" : "Blocked requirements draft",
          createDraftSnapshot(requirements, design),
        )
        setProject(next)
        const validation = validateSnapshot(currentRevision(next).snapshot)
        return {
          revisionId: next.currentRevisionId,
          status: validation.status,
          readiness: validation.readiness,
          message: design
            ? "Custom BoardGraph drafted. Evidence and footprints remain unreviewed until a human approves them in the page."
            : "Draft blocked until a structured BoardGraph is supplied.",
        }
      },
      inspect: async (revisionId: string, focus: InspectFocus, ids?: string[], cursor?: number) =>
        inspectProject(requireProject(), revisionId, focus, ids, cursor),
      preview: async (
        revisionId: string,
        request: string,
        operations: Parameters<typeof previewChange>[3],
      ) => {
        requireWritableWorkspace()
        const next = await previewChange(
          requireProject(),
          revisionId,
          request,
          sanitizeAgentOperations(operations),
        )
        changeRef.current = next
        setChange(next)
        setNotice("Change previewed. The stored design has not been modified.")
        return next
      },
      prepare: async (revisionId: string, targets: string[], requestedClass: ArtifactClass) => {
        requireWritableWorkspace()
        if (compilingRef.current)
          throw new Error("The board is still compiling. Try export when it finishes.")
        if (exportControllerRef.current) throw new Error("An export is already being prepared.")
        const current = requireProject()
        if (current.currentRevisionId !== revisionId)
          throw new Error("Only the current revision can export.")
        const controller = new AbortController()
        exportControllerRef.current = controller
        setExporting(true)
        let result: PreparedExport
        try {
          result = await prepareInBackground(current, requestedClass, setNotice, controller.signal)
          requireWritableWorkspace()
          if (projectRef.current !== current)
            throw new Error("The project changed. Prepare the current revision again.")
        } finally {
          if (exportControllerRef.current === controller) exportControllerRef.current = null
          setExporting(false)
        }
        setPrepared(result)
        setProject(withValidation(current, result.validation))
        setNotice(
          `${requestedClass === "engineering" ? "Engineering" : "Fabrication"} artifacts are prepared. A human must click Download.`,
        )
        return {
          revisionId,
          targets,
          artifactClass: requestedClass,
          readiness: result.validation.readiness,
          manifestHash: result.manifestHash,
          humanDownloadRequired: true,
        }
      },
    }),
    [requireProject, requireWritableWorkspace],
  )

  useEffect(() => registerWebMcpTools(actions), [actions])

  const compileKey = project ? `${project.id}:${project.currentRevisionId}` : ""
  const checkpointShareKey = `${compileKey}:${checkpointNote}`

  useEffect(() => {
    const current = projectRef.current
    if (!compileKey || !current) return
    const snapshot = currentRevision(current).snapshot
    setCircuitJson([])
    setPrepared(null)
    setQuote(null)
    setEditEvents([])
    setCanvasEditing(false)
    lastViewerMoveRef.current = ""
    if (!snapshot.design) {
      compilingRef.current = false
      setCompiling(false)
      setCircuitJson([])
      setNotice("Requirements are blocked; no BoardGraph was compiled.")
      return
    }
    const controller = new AbortController()
    compilingRef.current = true
    setCompiling(true)
    setNotice("Compiling the current revision in the background…")
    compileInBackground(snapshot, controller.signal)
      .then((json) => {
        if (controller.signal.aborted) return
        setCircuitJson(json)
        setNotice("BoardGraph compiled to Circuit JSON. Validate before export.")
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setNotice(error instanceof Error ? error.message : "Compilation failed.")
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          compilingRef.current = false
          setCompiling(false)
        }
      })
    return () => {
      controller.abort()
      exportControllerRef.current?.abort()
    }
  }, [compileKey])

  if (!project) return <main className="loading">Preparing RoarCAD…</main>
  const revision = currentRevision(project)
  const checkpointReadOnly = checkpointLoading || Boolean(incomingCheckpoint)
  const domainValidation = validateSnapshot(revision.snapshot)
  const validation =
    revision.validation.status === "not-run" ? domainValidation : revision.validation
  const design = revision.snapshot.design
  const validationLabel =
    validation.status === "blocked"
      ? "blocked"
      : validation.readiness === "fabrication-ready"
        ? "passed"
        : "engineering review"
  const validationClass =
    validation.status === "blocked"
      ? "blocked"
      : validation.readiness === "fabrication-ready"
        ? "passed"
        : "engineering"

  const selectMoveTarget = (reference: string, graph = design) => {
    setMoveReference(reference)
    const placement = graph?.components.find(
      (component) => component.reference === reference,
    )?.placement
    if (!placement) return
    setMoveX(placement.x)
    setMoveY(placement.y)
  }

  const selectReference = async (reference: "indicator" | "capture") => {
    const next = await createProject(
      reference,
      reference === "indicator" ? "Power indicator" : "PocketRoar UVC Bridge Study",
      reference === "indicator" ? indicatorSnapshot : captureBridgeSnapshot,
    )
    setArtifactClass(reference === "indicator" ? "fabrication" : "engineering")
    selectMoveTarget(reference === "indicator" ? "D1" : "U1", currentRevision(next).snapshot.design)
    setChange(null)
    changeRef.current = null
    setProject(next)
  }

  const previewMove = async (reference = moveReference, x = moveX, y = moveY) => {
    const component = design?.components.find((item) => item.reference === reference)
    if (!component) return setNotice(`Component ${reference} does not exist.`)
    return actions
      .preview(revision.id, `Move ${reference} to ${x}, ${y}`, [
        {
          type: "move-component" as const,
          reference,
          x,
          y,
          rotation: component.placement.rotation,
          side: component.placement.side,
        },
      ])
      .catch((error) => setNotice(String(error)))
  }

  const handleViewerEdits = (events: unknown[]) => {
    if (!canvasEditing) return
    setEditEvents(events)
    const move = [...events]
      .reverse()
      .find(
        (event): event is ViewerMove =>
          typeof event === "object" &&
          event !== null &&
          (event as ViewerMove).edit_event_type === "edit_pcb_component_location",
      )
    if (!move?.pcb_component_id || !move.new_center) return
    const pcbComponent = circuitJson.find(
      (item) => item.type === "pcb_component" && item.pcb_component_id === move.pcb_component_id,
    )
    const source = circuitJson.find(
      (item) =>
        item.type === "source_component" &&
        item.source_component_id === pcbComponent?.source_component_id,
    )
    const reference = typeof source?.name === "string" ? source.name : undefined
    if (!reference) return
    const moveKey = `${revision.id}:${reference}:${move.new_center.x}:${move.new_center.y}`
    if (lastViewerMoveRef.current === moveKey) return
    lastViewerMoveRef.current = moveKey
    setMoveReference(reference)
    setMoveX(move.new_center.x)
    setMoveY(move.new_center.y)
    void previewMove(reference, move.new_center.x, move.new_center.y)
  }

  const apply = async () => {
    const pending = changeRef.current
    if (!pending || pending.id !== change?.id || pending.baseRevisionId !== revision.id) {
      setNotice("The referenced preview is missing or does not match this revision.")
      return
    }
    try {
      const next = await applyChange(project, pending)
      setProject(next)
      changeRef.current = null
      setChange(null)
      setEditEvents([])
      setNotice("Human-approved change applied as a new immutable revision.")
    } catch (error) {
      setNotice(String(error))
    }
  }

  const validateAndPrepare = () => {
    setMacroFabConfirmed(false)
    return actions
      .prepare(
        revision.id,
        ["circuit-json", "gerber", "bom", "placement", "validation", "project", "manifest"],
        artifactClass,
      )
      .catch((error) => setNotice(String(error)))
  }

  const quoteJlc = async () => {
    if (prepared?.manifest.artifactClass !== "fabrication" || !design) return
    try {
      setQuote(
        await requestJlcQuote(project, {
          mode,
          quantity: 5,
          layers: design.board.layers,
          thicknessMm: design.board.thicknessMm as 0.8 | 1 | 1.2 | 1.6 | 2,
          finish: "ENIG",
        }),
      )
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Quote request failed.")
    }
  }

  const pollMacroFab = async (quoteToken: string) => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 5_000))
      const result = await requestMacroFabStatus(quoteToken)
      setQuote(result)
      if (result.state !== "processing") return
    }
    setNotice("MacroFab is still processing. Use Retry status without uploading again.")
  }

  const quoteMacroFab = async () => {
    if (prepared?.manifest.artifactClass !== "fabrication" || !design || !macroFabConfirmed) return
    setQuoteBusy(true)
    try {
      const result = await requestMacroFabQuote(project, {
        mode,
        quantity: 5,
        layers: design.board.layers,
        thicknessMm: design.board.thicknessMm as 0.8 | 1 | 1.2 | 1.6 | 2,
        finish: "ENIG",
      })
      setQuote(result)
      if (result.state === "processing" && result.quoteToken) {
        await pollMacroFab(result.quoteToken)
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "MacroFab quote request failed.")
    } finally {
      setQuoteBusy(false)
    }
  }

  const retryMacroFabStatus = async () => {
    if (!quote?.quoteToken) return
    setQuoteBusy(true)
    try {
      await pollMacroFab(quote.quoteToken)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "MacroFab status request failed.")
    } finally {
      setQuoteBusy(false)
    }
  }

  const review = async (target: Parameters<typeof applyHumanReview>[1]) => {
    try {
      setProject(await applyHumanReview(project, target))
      setNotice("Human review recorded as a new immutable revision.")
    } catch (error) {
      setNotice(String(error))
    }
  }

  const incomingComparison = incomingCheckpoint
    ? compareCheckpoint(project, incomingCheckpoint)
    : null
  const incomingChanges = incomingComparison
    ? Object.entries(incomingComparison.changes).flatMap(([group, items]) =>
        items.map((item) => `${group}: ${item}`),
      )
    : []

  const buildOutgoingCheckpoint = async () => {
    return createCheckpoint(project, checkpointNote)
  }

  const shareCheckpoint = async () => {
    try {
      const checkpoint = await buildOutgoingCheckpoint()
      const url = await checkpointUrl(
        checkpoint,
        `${location.origin}${location.pathname}${location.search}`,
      )
      setSharedCheckpoint({ key: checkpointShareKey, url })
      try {
        await navigator.clipboard.writeText(url)
        setNotice("Immutable checkpoint link copied. Anyone with the link can read the design.")
      } catch {
        setNotice("Checkpoint link prepared below. Copy it manually or download the file.")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkpoint sharing failed."
      setNotice(`${message} Use Download checkpoint for the JSON fallback.`)
    }
  }

  const downloadCheckpoint = async () => {
    try {
      const checkpoint = await buildOutgoingCheckpoint()
      downloadText(
        checkpointFile(checkpoint),
        `${project.id}-${checkpoint.head.id}.roarcad-checkpoint.json`,
      )
      setNotice("Checkpoint file downloaded.")
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Checkpoint download failed.")
    }
  }

  const clearIncomingCheckpoint = () => {
    setIncomingCheckpoint(null)
    history.replaceState(null, "", `${location.pathname}${location.search}`)
  }

  const incomingBackupKey = incomingCheckpoint
    ? `${project.id}:${revision.id}:${incomingCheckpoint.head.id}`
    : null

  const downloadLocalBackup = () => {
    if (!incomingBackupKey) return
    downloadText(
      JSON.stringify(project, null, 2),
      `${project.id}-${revision.id}-backup.roarcad.json`,
    )
    setBackupPreparedKey(incomingBackupKey)
    setNotice("Local backup downloaded. Confirm it is saved, then continue the checkpoint.")
  }

  const continueCheckpoint = async () => {
    if (!incomingCheckpoint) return
    if (backupPreparedKey !== incomingBackupKey) {
      setNotice("Download the current local project backup before continuing.")
      return
    }
    try {
      const fork = await forkCheckpoint(incomingCheckpoint)
      setProject(fork)
      setChange(null)
      changeRef.current = null
      clearIncomingCheckpoint()
      setNotice("Checkpoint continued as a local fork after the explicit backup step.")
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Checkpoint fork failed.")
    }
  }

  const adoptIncomingCheckpoint = async () => {
    if (!incomingCheckpoint) return
    try {
      const adopted = await adoptCheckpoint(project, incomingCheckpoint)
      setProject(adopted)
      setChange(null)
      changeRef.current = null
      clearIncomingCheckpoint()
      setNotice("Checkpoint adopted after human review as a new immutable revision.")
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Checkpoint adoption failed.")
    }
  }

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="mark">RC</span>
          <div>
            <strong>RoarCAD</strong>
            <small>agent-visible PCB workbench</small>
          </div>
        </div>
        <div className="header-actions">
          <a className="button" href="/guides/safe-ai-pcb-design/">
            Learn
          </a>
          <span className={document.modelContext ? "status good" : "status neutral"}>
            {document.modelContext ? "WebMCP ready" : "Manual mode"}
          </span>
          <button
            type="button"
            onClick={() =>
              downloadText(JSON.stringify(project, null, 2), `${project.id}.roarcad.json`)
            }
          >
            Export project
          </button>
          <label className="button" aria-disabled={checkpointReadOnly}>
            Import project
            <input
              className="visually-hidden"
              type="file"
              disabled={checkpointReadOnly}
              accept=".json,.roarcad.json"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                try {
                  setProject(await importProject(await file.text()))
                } catch (error) {
                  setNotice(error instanceof Error ? error.message : "Invalid project file.")
                }
              }}
            />
          </label>
        </div>
      </header>

      <section className="reference-switch" aria-label="Reference project">
        <button
          className={project.id === "indicator" ? "active" : ""}
          type="button"
          disabled={checkpointReadOnly}
          onClick={() => void selectReference("indicator")}
        >
          Indicator vertical slice
        </button>
        <button
          className={project.id === "capture" ? "active" : ""}
          type="button"
          disabled={checkpointReadOnly}
          onClick={() => void selectReference("capture")}
        >
          PocketRoar engineering study
        </button>
        <span>{notice}</span>
      </section>

      <section className="collaboration panel" aria-labelledby="checkpoint-heading">
        <div className="collaboration-copy">
          <p className="eyebrow">Team handoff</p>
          <h2 id="checkpoint-heading">Immutable checkpoints</h2>
          <p>
            Share one revision, let a coauthor continue it, then review the returned diff before
            adopting it. Links contain the design and grant read access to anyone who has them.
          </p>
        </div>
        <div className="checkpoint-controls">
          <input
            aria-label="Checkpoint handoff note"
            maxLength={500}
            placeholder="Optional handoff note"
            value={checkpointNote}
            disabled={checkpointReadOnly}
            onChange={(event) => setCheckpointNote(event.target.value)}
          />
          <button
            type="button"
            disabled={checkpointReadOnly}
            onClick={() => void shareCheckpoint()}
          >
            Copy checkpoint link
          </button>
          <button
            type="button"
            disabled={checkpointReadOnly}
            onClick={() => void downloadCheckpoint()}
          >
            Download checkpoint
          </button>
          <label className="button" aria-disabled={checkpointReadOnly}>
            Import checkpoint
            <input
              className="visually-hidden"
              type="file"
              disabled={checkpointReadOnly}
              accept=".json,.roarcad-checkpoint.json"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                try {
                  if (file.size > MAX_CHECKPOINT_BYTES) {
                    throw new Error("Checkpoint file is too large.")
                  }
                  setIncomingCheckpoint(await parseCheckpointFile(await file.text()))
                  setNotice("Checkpoint file loaded for read-only review.")
                } catch (error) {
                  setNotice(error instanceof Error ? error.message : "Invalid checkpoint file.")
                } finally {
                  event.target.value = ""
                }
              }}
            />
          </label>
        </div>
        {sharedCheckpoint?.key === checkpointShareKey && (
          <details className="checkpoint-link">
            <summary>Checkpoint link ready</summary>
            <textarea readOnly aria-label="Prepared checkpoint link" value={sharedCheckpoint.url} />
          </details>
        )}
        {incomingCheckpoint && incomingComparison && (
          <article className="checkpoint-review" aria-live="polite">
            <div>
              <p className="eyebrow">Incoming checkpoint</p>
              <strong>{incomingCheckpoint.projectName}</strong>
              <code>{incomingCheckpoint.head.id}</code>
              {incomingCheckpoint.note && <p>{incomingCheckpoint.note}</p>}
            </div>
            <dl>
              <div>
                <dt>Relationship</dt>
                <dd>{incomingComparison.relation}</dd>
              </div>
              <div>
                <dt>Common ancestor</dt>
                <dd>{incomingComparison.commonAncestorId ?? "none"}</dd>
              </div>
              <div>
                <dt>Readiness</dt>
                <dd>
                  sender {incomingComparison.senderReadiness} → local adoption{" "}
                  {incomingComparison.adoptionReadiness}
                </dd>
              </div>
            </dl>
            <div className="checkpoint-diff">
              <strong>Semantic diff</strong>
              {incomingChanges.length ? (
                <ul>
                  {incomingChanges.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No semantic changes from the local head.</p>
              )}
            </div>
            <p className="checkpoint-warning">
              Integrity detects changed bytes, not sender identity. Incoming approvals are reset to
              unreviewed, and divergent PCB state is never auto-merged.
            </p>
            <div className="checkpoint-actions">
              <button type="button" onClick={downloadLocalBackup}>
                Download local backup
              </button>
              <button
                type="button"
                disabled={backupPreparedKey !== incomingBackupKey}
                onClick={() => void continueCheckpoint()}
              >
                Continue as local fork
              </button>
              <button
                className="primary"
                disabled={
                  incomingComparison.relation === "unrelated" ||
                  incomingComparison.relation === "same" ||
                  incomingComparison.relation === "incoming-behind"
                }
                type="button"
                onClick={() => void adoptIncomingCheckpoint()}
              >
                Adopt as new revision
              </button>
              <button type="button" onClick={clearIncomingCheckpoint}>
                Dismiss
              </button>
            </div>
          </article>
        )}
      </section>

      <section className="workspace" inert={checkpointReadOnly ? true : undefined}>
        <aside className="panel requirements">
          <div className="panel-heading">
            <span>01</span>
            <h1>{project.name}</h1>
          </div>
          <p className="eyebrow">Requirements & evidence</p>
          <div className="readiness-banner" data-readiness={validation.readiness}>
            <strong>{validation.readiness}</strong>
            <span>
              {design
                ? `${design.board.layers} layers · ${design.components.length} parts · ${design.nets.length} nets`
                : "No board graph"}
            </span>
          </div>
          <details className="plain-language-guide">
            <summary>New to circuit boards? Start here</summary>
            <p>
              The schematic explains which parts are electrically connected. The PCB view shows
              where those physical parts and copper paths sit on the manufactured board.
            </p>
            <dl>
              <div>
                <dt>Part</dt>
                <dd>A physical item such as a resistor, connector, or chip.</dd>
              </div>
              <div>
                <dt>Connection</dt>
                <dd>A named electrical path between part pins. Engineers call it a net.</dd>
              </div>
              <div>
                <dt>Footprint</dt>
                <dd>The exact pad pattern and space used to solder a part onto the board.</dd>
              </div>
              <div>
                <dt>Engineering</dt>
                <dd>
                  Reviewable, but still blocked from manufacturing until its open risks close.
                </dd>
              </div>
            </dl>
          </details>
          <div className="requirements-list">
            {revision.snapshot.requirements.map((item) => (
              <article key={item.id}>
                <span className={`dot ${item.status}`} title={item.status} />
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.value ?? "Answer required"}</small>
                  {item.status !== "verified" && (
                    <button
                      type="button"
                      className="mini"
                      onClick={() => void review({ requirementId: item.id })}
                    >
                      Confirm requirement
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          <h2>How it works</h2>
          <ol>
            {revision.snapshot.architecture.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          {design && (
            <>
              <h2>Parts</h2>
              <div className="requirements-list">
                {design.components.map((component) => (
                  <article key={component.reference}>
                    <span
                      className={`dot ${component.reviewStatus === "reviewed" && component.footprint.reviewed ? "verified" : "candidate"}`}
                    />
                    <div>
                      <strong>
                        {component.reference} · {component.mpn}
                      </strong>
                      <small>{componentDefinition(component.kind)}</small>
                      <small>
                        Technical: {component.kind} · {component.footprint.source}:
                        {component.footprint.identifier}
                      </small>
                      {(component.reviewStatus !== "reviewed" || !component.footprint.reviewed) && (
                        <button
                          type="button"
                          className="mini"
                          onClick={() =>
                            void review({
                              componentReference: component.reference,
                              footprintReference: component.reference,
                            })
                          }
                        >
                          Review part + footprint
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              <h2>Connections & constraints</h2>
              <ol>
                {design.nets.map((net) => (
                  <li key={net.name}>
                    <strong>{net.name}</strong> · {net.className} · {net.members.join(" ↔ ")}
                  </li>
                ))}
              </ol>
            </>
          )}
          <h2>Evidence: why we trust it</h2>
          {revision.snapshot.evidence.length ? (
            revision.snapshot.evidence.map((item) => (
              <div className="evidence-row" key={item.id}>
                <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                  {item.title} ↗
                </a>
                {!item.reviewed && (
                  <button
                    type="button"
                    className="mini"
                    onClick={() => void review({ evidenceId: item.id })}
                  >
                    Mark reviewed
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="empty">No evidence attached. External files are untrusted data.</p>
          )}
          <details className="graph-editor">
            <summary>Manual custom BoardGraph</summary>
            <p>
              Paste a validated BoardGraph JSON object. It enters as unreviewed engineering data.
            </p>
            <textarea
              value={graphText}
              onChange={(event) => setGraphText(event.target.value)}
              placeholder='{"board": …, "components": …, "nets": …}'
            />
            <button
              type="button"
              onClick={() => {
                setGraphText(JSON.stringify(environmentMonitorGraph, null, 2))
                setNotice(environmentMonitorRequirements)
              }}
            >
              Load environmental monitor sample
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  void actions.draft(
                    "Manual custom board",
                    boardGraphSchema.parse(JSON.parse(graphText)),
                  )
                } catch (error) {
                  setNotice(error instanceof Error ? error.message : "Invalid BoardGraph JSON.")
                }
              }}
            >
              Draft custom board
            </button>
          </details>
        </aside>

        <section className="panel canvas-panel">
          <div className="canvas-toolbar">
            <div>
              <button
                className={view === "pcb" ? "active" : ""}
                type="button"
                onClick={() => setView("pcb")}
              >
                PCB
              </button>
              <button
                className={view === "schematic" ? "active" : ""}
                type="button"
                onClick={() => setView("schematic")}
              >
                Schematic
              </button>
              {view === "pcb" && (
                <button
                  type="button"
                  aria-pressed={canvasEditing}
                  className={canvasEditing ? "editing" : ""}
                  onClick={() => {
                    setCanvasEditing((enabled) => !enabled)
                    setEditEvents([])
                    lastViewerMoveRef.current = ""
                  }}
                >
                  {canvasEditing ? "Finish moving parts" : "Move parts on the board"}
                </button>
              )}
            </div>
            <code>{revision.id}</code>
          </div>
          <div className="viewer">
            {circuitJson.length ? (
              <>
                <div className={view === "pcb" ? "viewer-surface" : "viewer-surface hidden"}>
                  <PCBViewer
                    circuitJson={circuitJson as never}
                    allowEditing={canvasEditing}
                    editEvents={editEvents as never}
                    onEditEventsChanged={handleViewerEdits as never}
                  />
                </div>
                {view === "schematic" && (
                  <div className="viewer-surface">
                    <SchematicViewer circuitJson={circuitJson as never} />
                  </div>
                )}
              </>
            ) : (
              <div className="blocked-canvas">
                <span>
                  {compiling ? "Compiling board…" : design ? "Board unavailable" : "Draft blocked"}
                </span>
                <p>
                  {compiling
                    ? "You can keep reviewing the design while it is processed."
                    : design
                      ? "See the status above. Reload or select a reference to retry."
                      : "Supply a complete BoardGraph to compile a board."}
                </p>
              </div>
            )}
          </div>
          <div className="change-bar">
            <label htmlFor="move-reference">Preview component placement</label>
            <div>
              <select
                id="move-reference"
                value={moveReference}
                onChange={(event) => selectMoveTarget(event.target.value)}
              >
                {design?.components.map((component) => (
                  <option key={component.reference}>{component.reference}</option>
                ))}
              </select>
              <input
                aria-label="X position"
                type="number"
                value={moveX}
                onChange={(event) => setMoveX(Number(event.target.value))}
              />
              <input
                aria-label="Y position"
                type="number"
                value={moveY}
                onChange={(event) => setMoveY(Number(event.target.value))}
              />
              <button type="button" onClick={() => void previewMove()}>
                Preview
              </button>
            </div>
            <small>
              Canvas placement is {canvasEditing ? "unlocked" : "locked"}. Typed previews remain
              available at all times.
            </small>
          </div>
        </section>

        <aside className="panel inspector">
          <p className="eyebrow">Diff & validation</p>
          {change ? (
            <article className="diff">
              <small>Pending · base {change.baseRevisionId}</small>
              <strong>{change.summary}</strong>
              <p>
                {change.readinessBefore} → {change.readinessAfter}. Stored state is unchanged.
              </p>
              <button className="primary" type="button" onClick={() => void apply()}>
                Approve & apply
              </button>
              <button
                type="button"
                onClick={() => {
                  setChange(null)
                  changeRef.current = null
                  setEditEvents([])
                }}
              >
                Discard
              </button>
            </article>
          ) : (
            <p className="empty">
              No pending change. Every change must be previewed before it can be applied.
            </p>
          )}
          <h2>Design checks</h2>
          <div className={`validation ${validationClass}`}>
            <strong>{validationLabel}</strong>
            <span>
              {validation.readiness} · {validation.errors.length} blockers ·{" "}
              {validation.warnings.length} warnings
            </span>
          </div>
          {[...validation.errors, ...validation.warnings].slice(0, 8).map((issue) => (
            <p className="issue" key={issue}>
              {issue}
            </p>
          ))}
          <fieldset>
            <legend>Artifact class</legend>
            <label>
              <input
                type="radio"
                checked={artifactClass === "engineering"}
                onChange={() => setArtifactClass("engineering")}
              />{" "}
              Engineering
            </label>
            <label>
              <input
                type="radio"
                checked={artifactClass === "fabrication"}
                onChange={() => setArtifactClass("fabrication")}
              />{" "}
              Fabrication
            </label>
          </fieldset>
          <button
            className="primary full"
            disabled={!design || compiling || exporting}
            type="button"
            onClick={() => void validateAndPrepare()}
          >
            {exporting ? "Preparing exports…" : "Validate & prepare exports"}
          </button>
          {exporting && (
            <button type="button" onClick={() => exportControllerRef.current?.abort()}>
              Cancel export
            </button>
          )}
          {prepared && (
            <section className="manufacture">
              <h2>
                {prepared.manifest.artifactClass === "engineering"
                  ? "Engineering package"
                  : "Manufacture handoff"}
              </h2>
              <p>
                <code>{prepared.manifestHash.slice(0, 12)}…</code> · {prepared.validation.readiness}
              </p>
              <fieldset>
                <legend>Build type</legend>
                <label>
                  <input
                    type="radio"
                    checked={mode === "bare-pcb"}
                    onChange={() => setMode("bare-pcb")}
                  />{" "}
                  Bare PCB
                </label>
                <label>
                  <input type="radio" checked={mode === "pcba"} onChange={() => setMode("pcba")} />{" "}
                  PCBA
                </label>
              </fieldset>
              <dl>
                <div>
                  <dt>Quantity</dt>
                  <dd>5</dd>
                </div>
                <div>
                  <dt>Stackup</dt>
                  <dd>
                    {design?.board.layers} layer · {design?.board.thicknessMm} mm
                  </dd>
                </div>
                <div>
                  <dt>Finish</dt>
                  <dd>ENIG</dd>
                </div>
              </dl>
              <button
                className="primary full"
                type="button"
                onClick={() =>
                  downloadBlob(
                    prepared.bundle,
                    `${project.id}-${prepared.revisionId}-${prepared.manifest.artifactClass}.zip`,
                  )
                }
              >
                Download package
              </button>
              <label className="manufacturing-confirmation">
                <input
                  type="checkbox"
                  checked={macroFabConfirmed}
                  onChange={(event) => setMacroFabConfirmed(event.target.checked)}
                />
                I understand that RoarCAD will share this revision’s Gerber and drill files with
                MacroFab to request a quote.
              </label>
              <button
                className="full"
                disabled={
                  quoteBusy ||
                  !macroFabConfirmed ||
                  mode !== "bare-pcb" ||
                  prepared.manifest.artifactClass !== "fabrication" ||
                  prepared.validation.readiness !== "fabrication-ready"
                }
                type="button"
                onClick={() => void quoteMacroFab()}
              >
                {quoteBusy ? "Checking MacroFab…" : "Request live MacroFab quote"}
              </button>
              <button className="full" type="button" onClick={() => void quoteJlc()}>
                Use JLCPCB manual upload
              </button>
            </section>
          )}
          {quote && (
            <div className="quote">
              <strong>
                {quote.provider} · {quote.state}
              </strong>
              {quote.price && (
                <p>
                  Provider total: {quote.price.amount} {quote.price.currency}
                </p>
              )}
              {quote.leadTime && <p>Lead time: {quote.leadTime}</p>}
              {quote.quotedAt && <p>Quoted: {new Date(quote.quotedAt).toLocaleString()}</p>}
              {quote.manifestHash && (
                <p>
                  Manifest: <code>{quote.manifestHash.slice(0, 12)}…</code>
                </p>
              )}
              {!quote.shipping && <p>Shipping: unavailable</p>}
              {!quote.tax && <p>Tax: unavailable</p>}
              {quote.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
              {quote.provider === "MacroFab" &&
                quote.state === "processing" &&
                quote.quoteToken && (
                  <button
                    disabled={quoteBusy}
                    type="button"
                    onClick={() => void retryMacroFabStatus()}
                  >
                    Retry status without uploading again
                  </button>
                )}
              <a href={quote.fallbackUrl} target="_blank" rel="noreferrer">
                Open {quote.provider} ↗
              </a>
            </div>
          )}
        </aside>
      </section>

      <section className="history panel">
        <div>
          <p className="eyebrow">Immutable revision history</p>
          <strong>
            {project.revisions.length} revision{project.revisions.length === 1 ? "" : "s"}
          </strong>
        </div>
        <ol>
          {[...project.revisions].reverse().map((item) => (
            <li key={item.id}>
              <code>{item.id}</code>
              <span>{item.summary}</span>
              <time>
                {new Date(item.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </li>
          ))}
        </ol>
      </section>
      <footer className="resource-footer">
        <strong>Understand before you manufacture.</strong>
        <nav aria-label="RoarCAD resources">
          <a href="/guides/safe-ai-pcb-design/">Safety guide</a>
          <a href="/compare/flux-quilter/">Product comparison</a>
          <a href="/alternatives/flux-ai-pcb/">Flux alternatives</a>
          <a href="/open-source-ai-pcb/">Free workflow</a>
          <a href="/case-studies/pocketroar/">PocketRoar</a>
          <a href="/evidence/">Evidence</a>
          <a href="https://github.com/jongan69/RoarCAD">Source</a>
        </nav>
      </footer>
    </main>
  )
}
