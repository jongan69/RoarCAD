import type { BoardProject, DesignSnapshot } from "./domain"
import { type ArtifactClass, compileSnapshot, prepareExport } from "./eda"

export type EdaTask =
  | { kind: "compile"; snapshot: DesignSnapshot }
  | { kind: "export"; project: BoardProject; artifactClass: ArtifactClass }

self.onmessage = async ({ data }: MessageEvent<EdaTask>) => {
  try {
    const result =
      data.kind === "compile"
        ? await compileSnapshot(data.snapshot)
        : await prepareExport(data.project, data.artifactClass, (stage) =>
            self.postMessage({ kind: "progress", stage }),
          )
    self.postMessage({ kind: "result", result })
  } catch (error) {
    self.postMessage({
      kind: "error",
      message: error instanceof Error ? error.message : "Board processing failed.",
    })
  }
}
