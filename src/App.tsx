import { PCBViewer } from "@tscircuit/pcb-viewer"
import { SchematicViewer } from "@tscircuit/schematic-viewer"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  applyChange,
  type BoardProject,
  captureBridgeSnapshot,
  createProject,
  currentRevision,
  type DesignChange,
  importProject,
  indicatorSnapshot,
  previewChange,
  validateSnapshot,
  withValidation,
} from "./domain"
import { compileSnapshot, downloadBlob, type PreparedExport, prepareExport } from "./eda"
import { type QuoteResult, requestJlcQuote } from "./manufacturing"
import { registerWebMcpTools } from "./webmcp"

const STORAGE_KEY = "roarcad-project-v1"

function saveProject(project: BoardProject): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
}

function downloadText(value: string, filename: string): void {
  downloadBlob(new Blob([value], { type: "application/json" }), filename)
}

export default function App() {
  const [project, setProject] = useState<BoardProject | null>(null)
  const projectRef = useRef<BoardProject | null>(null)
  const [circuitJson, setCircuitJson] = useState<Record<string, unknown>[]>([])
  const [view, setView] = useState<"pcb" | "schematic">("pcb")
  const [request, setRequest] = useState("Move D1 to 3, 2")
  const [change, setChange] = useState<DesignChange | null>(null)
  const changeRef = useRef<DesignChange | null>(null)
  const [prepared, setPrepared] = useState<PreparedExport | null>(null)
  const [quote, setQuote] = useState<QuoteResult | null>(null)
  const [notice, setNotice] = useState("Loading reference design…")
  const [mode, setMode] = useState<"bare-pcb" | "pcba">("bare-pcb")

  useEffect(() => {
    const load = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        setProject(
          stored
            ? importProject(stored)
            : await createProject("indicator", "Power indicator", indicatorSnapshot),
        )
      } catch {
        setProject(await createProject("indicator", "Power indicator", indicatorSnapshot))
      }
    }
    void load()
  }, [])

  useEffect(() => {
    projectRef.current = project
    if (!project) return
    saveProject(project)
  }, [project])

  const compileKey = project ? `${project.id}:${project.currentRevisionId}` : ""
  const activeSnapshot = project ? currentRevision(project).snapshot : null

  useEffect(() => {
    if (!compileKey || !activeSnapshot) return
    setPrepared(null)
    setQuote(null)
    if (!activeSnapshot.boardSpec) {
      setCircuitJson([])
      setNotice("Requirements are blocked; no board was compiled.")
      return
    }
    compileSnapshot(activeSnapshot)
      .then((json) => {
        setCircuitJson(json)
        setNotice("Circuit JSON compiled. Validate before export.")
      })
      .catch((error) => setNotice(error instanceof Error ? error.message : "Compilation failed."))
  }, [compileKey, activeSnapshot])

  const requireProject = useCallback(() => {
    if (!projectRef.current) throw new Error("Project is not loaded.")
    return projectRef.current
  }, [])

  const actions = useMemo(
    () => ({
      draft: async (requirements: string) => {
        const capture = /camera|capture|pocketroar|iphone|ipad/i.test(requirements)
        const next = await createProject(
          capture ? "pocketroar-capture" : "indicator",
          capture ? "PocketRoar Capture Bridge" : "Power indicator",
          capture ? captureBridgeSnapshot : indicatorSnapshot,
        )
        setProject(next)
        return {
          revisionId: next.currentRevisionId,
          status: validateSnapshot(currentRevision(next).snapshot).status,
          message: capture
            ? "Draft blocked until the transport questionnaire and physical validation gates are complete."
            : "Known-safe indicator reference drafted.",
        }
      },
      inspect: async (revisionId: string, query: string) => {
        const current = requireProject().revisions.find(({ id }) => id === revisionId)
        if (!current) throw new Error("Revision not found.")
        return { query, revision: current, fabricationClaim: false }
      },
      preview: async (revisionId: string, requestedChange: string) => {
        const next = await previewChange(requireProject(), revisionId, requestedChange)
        changeRef.current = next
        setChange(next)
        setNotice("Change previewed. The design has not been modified.")
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
        setNotice("Approved change applied as a new immutable revision.")
        return { revisionId: next.currentRevisionId, parentId: revisionId }
      },
      prepare: async (revisionId: string, targets: string[]) => {
        const current = requireProject()
        if (current.currentRevisionId !== revisionId)
          throw new Error("Only the current revision can export.")
        const result = await prepareExport(current)
        setPrepared(result)
        setProject(withValidation(current, result.validation))
        setNotice("Artifacts are prepared. A human must click Download package.")
        return {
          revisionId,
          targets,
          manifestHash: result.manifestHash,
          humanDownloadRequired: true,
        }
      },
    }),
    [requireProject],
  )

  useEffect(() => registerWebMcpTools(actions), [actions])

  if (!project) return <main className="loading">Preparing RoarCAD…</main>
  const revision = currentRevision(project)
  const domainValidation = validateSnapshot(revision.snapshot)
  const validation =
    revision.validation.status !== "not-run" || domainValidation.status === "blocked"
      ? revision.validation.status === "not-run"
        ? domainValidation
        : revision.validation
      : { ...domainValidation, status: "not-run" as const, checkedAt: undefined }

  const selectReference = async (reference: "indicator" | "capture") => {
    const next = await createProject(
      reference,
      reference === "indicator" ? "Power indicator" : "PocketRoar Capture Bridge",
      reference === "indicator" ? indicatorSnapshot : captureBridgeSnapshot,
    )
    setChange(null)
    changeRef.current = null
    setProject(next)
  }

  const preview = async () =>
    actions.preview(revision.id, request).catch((error) => setNotice(String(error)))
  const apply = async () =>
    change && actions.apply(revision.id, change.id).catch((error) => setNotice(String(error)))
  const validateAndPrepare = async () =>
    actions
      .prepare(revision.id, ["gerber", "bom", "placement", "validation"])
      .catch((error) => setNotice(String(error)))
  const quoteJlc = async () => {
    if (!prepared) return
    try {
      setQuote(
        await requestJlcQuote(
          {
            mode,
            quantity: 5,
            layers: 2,
            thicknessMm: 1.6,
            finish: "ENIG",
            manifestHash: prepared.manifestHash,
            bundleBytes: prepared.bundle.size,
          },
          prepared.bundle,
        ),
      )
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Quote request failed.")
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
                if (file) setProject(importProject(await file.text()))
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
          PocketRoar capture brief
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
          {revision.snapshot.components.length > 0 && (
            <>
              <h2>Selected parts</h2>
              <div className="requirements-list">
                {revision.snapshot.components.map((component) => (
                  <article key={component.reference}>
                    <span className={`dot ${component.status}`} title={component.status} />
                    <div>
                      <strong>
                        {component.reference} · {component.mpn}
                      </strong>
                      <small>
                        {component.manufacturer} · {component.footprint} · {component.status}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
          {revision.snapshot.constraints.length > 0 && (
            <>
              <h2>Board constraints</h2>
              <ol>
                {revision.snapshot.constraints.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ol>
            </>
          )}
          {revision.snapshot.validationPlan.length > 0 && (
            <>
              <h2>Validation ladder</h2>
              <ol>
                {revision.snapshot.validationPlan.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </>
          )}
          <h2>Official evidence</h2>
          {revision.snapshot.evidence.length ? (
            revision.snapshot.evidence.map((item) => (
              <a key={item.id} href={item.sourceUrl} target="_blank" rel="noreferrer">
                {item.title}
                <span>↗</span>
              </a>
            ))
          ) : (
            <p className="empty">No evidence attached. External files are untrusted data.</p>
          )}
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
                <PCBViewer circuitJson={circuitJson as never} allowEditing={false} />
              ) : (
                <SchematicViewer circuitJson={circuitJson as never} />
              )
            ) : (
              <div className="blocked-canvas">
                <span>Draft blocked</span>
                <p>
                  Resolve the transport questionnaire and physical validation ladder before creating
                  an integrated board.
                </p>
              </div>
            )}
          </div>
          <div className="change-bar">
            <label htmlFor="change-request">Preview a bounded change</label>
            <div>
              <input
                id="change-request"
                value={request}
                onChange={(event) => setRequest(event.target.value)}
              />
              <button type="button" onClick={() => void preview()}>
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
              <p>No files or design state changed yet.</p>
              <button className="primary" type="button" onClick={() => void apply()}>
                Approve & apply
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
              {validation.errors.length} blockers · {validation.warnings.length} warnings
            </span>
          </div>
          {validation.errors.slice(0, 5).map((error) => (
            <p className="issue" key={error}>
              {error}
            </p>
          ))}
          <button
            className="primary full"
            disabled={!revision.snapshot.boardSpec}
            type="button"
            onClick={() => void validateAndPrepare()}
          >
            Validate & prepare exports
          </button>
          {prepared && (
            <section className="manufacture">
              <h2>Manufacture handoff</h2>
              <p>
                Validated package <code>{prepared.manifestHash.slice(0, 12)}…</code>
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
                  Assembled PCBA
                </label>
              </fieldset>
              <dl>
                <div>
                  <dt>Quantity</dt>
                  <dd>5</dd>
                </div>
                <div>
                  <dt>Stackup</dt>
                  <dd>2 layer · 1.6 mm</dd>
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
                  downloadBlob(prepared.bundle, `${project.id}-${prepared.revisionId}.zip`)
                }
              >
                Download package
              </button>
              <button className="full" type="button" onClick={() => void quoteJlc()}>
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
