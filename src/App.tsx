import { PCBViewer } from "@tscircuit/pcb-viewer"
import { SchematicViewer } from "@tscircuit/schematic-viewer"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import {
  type ArtifactClass,
  compileSnapshot,
  downloadBlob,
  type PreparedExport,
  prepareExport,
} from "./eda"
import { type QuoteResult, requestJlcQuote } from "./manufacturing"
import { loadStoredProject, saveStoredProject } from "./storage"
import { registerWebMcpTools } from "./webmcp"

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
  const [view, setView] = useState<"pcb" | "schematic">("pcb")
  const [change, setChange] = useState<DesignChange | null>(null)
  const changeRef = useRef<DesignChange | null>(null)
  const [prepared, setPrepared] = useState<PreparedExport | null>(null)
  const [quote, setQuote] = useState<QuoteResult | null>(null)
  const [notice, setNotice] = useState("Loading reference design…")
  const [mode, setMode] = useState<"bare-pcb" | "pcba">("bare-pcb")
  const [artifactClass, setArtifactClass] = useState<ArtifactClass>("fabrication")
  const [moveReference, setMoveReference] = useState("D1")
  const [moveX, setMoveX] = useState(3)
  const [moveY, setMoveY] = useState(2)
  const [editEvents, setEditEvents] = useState<unknown[]>([])
  const [graphText, setGraphText] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        setProject(
          (await loadStoredProject()) ??
            (await createProject("indicator", "Power indicator", indicatorSnapshot)),
        )
      } catch {
        setProject(await createProject("indicator", "Power indicator", indicatorSnapshot))
      }
    }
    void load()
  }, [])

  useEffect(() => {
    projectRef.current = project
    if (project)
      void saveStoredProject(project).catch(() => setNotice("Project persistence failed."))
  }, [project])

  const requireProject = useCallback(() => {
    if (!projectRef.current) throw new Error("Project is not loaded.")
    return projectRef.current
  }, [])

  const actions = useMemo(
    () => ({
      draft: async (requirements: string, design?: BoardGraph) => {
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
      inspect: async (revisionId: string, query: string) => {
        const revision = requireProject().revisions.find(({ id }) => id === revisionId)
        if (!revision) throw new Error("Revision not found.")
        const validation = validateSnapshot(revision.snapshot)
        return {
          query,
          revision,
          readiness: validation.readiness,
          validation,
          fabricationClaim: validation.readiness === "fabrication-ready",
        }
      },
      preview: async (
        revisionId: string,
        request: string,
        operations: Parameters<typeof previewChange>[3],
      ) => {
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
      apply: async (revisionId: string, changeId: string) => {
        const pending = changeRef.current
        if (!pending || pending.id !== changeId || pending.baseRevisionId !== revisionId) {
          throw new Error("The referenced preview is missing or does not match this revision.")
        }
        const next = await applyChange(requireProject(), pending)
        setProject(next)
        changeRef.current = null
        setChange(null)
        setEditEvents([])
        setNotice("Approved change applied as a new immutable revision.")
        return { revisionId: next.currentRevisionId, parentId: revisionId }
      },
      prepare: async (revisionId: string, targets: string[], requestedClass: ArtifactClass) => {
        const current = requireProject()
        if (current.currentRevisionId !== revisionId)
          throw new Error("Only the current revision can export.")
        const result = await prepareExport(current, requestedClass, setNotice)
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
    [requireProject],
  )

  useEffect(() => registerWebMcpTools(actions), [actions])

  const compileKey = project ? `${project.id}:${project.currentRevisionId}` : ""
  const activeSnapshot = project ? currentRevision(project).snapshot : null

  useEffect(() => {
    if (!compileKey || !activeSnapshot) return
    setPrepared(null)
    setQuote(null)
    setEditEvents([])
    if (!activeSnapshot.design) {
      setCircuitJson([])
      setNotice("Requirements are blocked; no BoardGraph was compiled.")
      return
    }
    compileSnapshot(activeSnapshot)
      .then((json) => {
        setCircuitJson(json)
        setNotice("BoardGraph compiled to Circuit JSON. Validate before export.")
      })
      .catch((error) => setNotice(error instanceof Error ? error.message : "Compilation failed."))
  }, [compileKey, activeSnapshot])

  if (!project) return <main className="loading">Preparing RoarCAD…</main>
  const revision = currentRevision(project)
  const domainValidation = validateSnapshot(revision.snapshot)
  const validation =
    revision.validation.status === "not-run" ? domainValidation : revision.validation
  const design = revision.snapshot.design

  const selectReference = async (reference: "indicator" | "capture") => {
    const next = await createProject(
      reference,
      reference === "indicator" ? "Power indicator" : "PocketRoar Capture Bridge",
      reference === "indicator" ? indicatorSnapshot : captureBridgeSnapshot,
    )
    setArtifactClass(reference === "indicator" ? "fabrication" : "engineering")
    setMoveReference(reference === "indicator" ? "D1" : "U1")
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
    if (reference) void previewMove(reference, move.new_center.x, move.new_center.y)
  }

  const apply = () =>
    change && actions.apply(revision.id, change.id).catch((error) => setNotice(String(error)))

  const validateAndPrepare = () =>
    actions
      .prepare(
        revision.id,
        ["circuit-json", "gerber", "bom", "placement", "validation", "project", "manifest"],
        artifactClass,
      )
      .catch((error) => setNotice(String(error)))

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

  const review = async (target: Parameters<typeof applyHumanReview>[1]) => {
    try {
      setProject(await applyHumanReview(project, target))
      setNotice("Human review recorded as a new immutable revision.")
    } catch (error) {
      setNotice(String(error))
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
          <label className="button">
            Import project
            <input
              className="visually-hidden"
              type="file"
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
          onClick={() => void selectReference("indicator")}
        >
          Indicator vertical slice
        </button>
        <button
          className={project.id === "capture" ? "active" : ""}
          type="button"
          onClick={() => void selectReference("capture")}
        >
          PocketRoar engineering example
        </button>
        <span>{notice}</span>
      </section>

      <section className="workspace">
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
          <div className="requirements-list">
            {revision.snapshot.requirements.map((item) => (
              <article key={item.id}>
                <span className={`dot ${item.status}`} title={item.status} />
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.value ?? "Answer required"}</small>
                </div>
              </article>
            ))}
          </div>
          <h2>Architecture</h2>
          <ol>
            {revision.snapshot.architecture.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          {design && (
            <>
              <h2>Components & footprints</h2>
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
                      <small>
                        {component.kind} · {component.footprint.source}:
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
              <h2>Nets & constraints</h2>
              <ol>
                {design.nets.map((net) => (
                  <li key={net.name}>
                    <strong>{net.name}</strong> · {net.className} · {net.members.join(" ↔ ")}
                  </li>
                ))}
              </ol>
            </>
          )}
          <h2>Evidence</h2>
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
            </div>
            <code>{revision.id}</code>
          </div>
          <div className="viewer">
            {circuitJson.length ? (
              view === "pcb" ? (
                <PCBViewer
                  circuitJson={circuitJson as never}
                  allowEditing
                  editEvents={editEvents as never}
                  onEditEventsChanged={handleViewerEdits as never}
                />
              ) : (
                <SchematicViewer circuitJson={circuitJson as never} />
              )
            ) : (
              <div className="blocked-canvas">
                <span>Draft blocked</span>
                <p>Supply a complete BoardGraph to compile a board.</p>
              </div>
            )}
          </div>
          <div className="change-bar">
            <label htmlFor="move-reference">Preview component placement</label>
            <div>
              <select
                id="move-reference"
                value={moveReference}
                onChange={(event) => setMoveReference(event.target.value)}
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
          <div className={`validation ${validation.status}`}>
            <strong>{validation.status}</strong>
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
            disabled={!design}
            type="button"
            onClick={() => void validateAndPrepare()}
          >
            Validate & prepare exports
          </button>
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
              <button
                className="full"
                disabled={
                  prepared.manifest.artifactClass !== "fabrication" ||
                  prepared.validation.readiness !== "fabrication-ready"
                }
                type="button"
                onClick={() => void quoteJlc()}
              >
                Request JLCPCB quote
              </button>
            </section>
          )}
          {quote && (
            <div className="quote">
              <strong>{quote.configured ? "Provider quote" : "Manual JLCPCB handoff"}</strong>
              {quote.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
              <a href={quote.fallbackUrl} target="_blank" rel="noreferrer">
                Continue to JLCPCB ↗
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
    </main>
  )
}
