import type { BoardProject, DesignSnapshot } from "./domain"
import type { ArtifactClass, CircuitElement, PreparedExport } from "./eda"
import type { EdaTask } from "./eda.worker"

function runTask<T>(
  task: EdaTask,
  signal: AbortSignal,
  progress: (stage: string) => void = () => undefined,
): Promise<T> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted()
    const worker = new Worker(new URL("./eda.worker.ts", import.meta.url), { type: "module" })
    const finish = (outcome: { result: T } | { error: Error }) => {
      clearTimeout(timeout)
      signal.removeEventListener("abort", abort)
      worker.terminate()
      if ("error" in outcome) reject(outcome.error)
      else resolve(outcome.result)
    }
    const abort = () =>
      finish({ error: new DOMException("Board processing canceled.", "AbortError") })
    const timeout = setTimeout(
      () =>
        finish({ error: new Error("Board processing timed out. Try a smaller design or retry.") }),
      180_000,
    )
    signal.addEventListener("abort", abort, { once: true })
    worker.onmessage = ({
      data,
    }: MessageEvent<
      | { kind: "progress"; stage: string }
      | { kind: "error"; message: string }
      | { kind: "result"; result: T }
    >) => {
      if (data.kind === "progress") progress(data.stage)
      else if (data.kind === "error") finish({ error: new Error(data.message) })
      else finish({ result: data.result })
    }
    worker.onerror = () =>
      finish({ error: new Error("Background board processing failed. Reload and retry.") })
    worker.onmessageerror = () =>
      finish({ error: new Error("Unable to read the board processing result.") })
    try {
      worker.postMessage(task)
    } catch (error) {
      finish({
        error: error instanceof Error ? error : new Error("Unable to start board processing."),
      })
    }
  })
}

export const compileInBackground = (snapshot: DesignSnapshot, signal: AbortSignal) =>
  runTask<CircuitElement[]>({ kind: "compile", snapshot }, signal)

export const prepareInBackground = (
  project: BoardProject,
  artifactClass: ArtifactClass,
  progress: (stage: string) => void,
  signal: AbortSignal,
) => runTask<PreparedExport>({ kind: "export", project, artifactClass }, signal, progress)
