import { z } from "zod"
import type { QuoteResult } from "../../../src/manufacturing.js"
import { readRequestJson, requestErrorResponse } from "../jlcpcb/shared.js"
import {
  acceptedMacroFabFiles,
  errorsResponseSchema,
  importStatusResponseSchema,
  ingestionAcceptResponseSchema,
  issueMacroFabToken,
  MACROFAB_FALLBACK_URL,
  macroFabApiKey,
  macroFabContract,
  macroFabErrorResponse,
  macroFabFilesProcessed,
  macroFabRequest,
  parseMacroFabQuote,
  processedFilesResponseSchema,
  quotePath,
  verifyMacroFabToken,
  workflowResponseSchema,
} from "./shared.js"

const statusRequestSchema = z.object({ quoteToken: z.string().min(80).max(8_000) })

const result = (
  state: "processing" | "rejected",
  manifestHash: string,
  warnings: string[],
  quoteToken?: string,
  expiresAt?: string,
): QuoteResult => ({
  configured: true,
  provider: "MacroFab",
  state,
  quoteToken,
  expiresAt,
  retryAfterMs: state === "processing" ? 5_000 : undefined,
  substitutions: [],
  warnings,
  fallbackUrl: MACROFAB_FALLBACK_URL,
  manifestHash,
})

export async function POST(request: Request): Promise<Response> {
  try {
    const { quoteToken } = statusRequestSchema.parse(await readRequestJson(request, 10_000))
    const apiKey = macroFabApiKey()
    if (!apiKey)
      return Response.json({ error: "MacroFab credentials are not configured." }, { status: 503 })
    const payload = await verifyMacroFabToken(quoteToken, apiKey)
    const base = `/api/v3/pcb/${encodeURIComponent(payload.pcbId)}/${payload.pcbVersion}`
    const workflowBase = `${base}/ingestion/workflow/${encodeURIComponent(payload.workflowId)}`

    if (!payload.importRunId) {
      const workflow = await macroFabContract(
        await macroFabRequest(workflowBase, apiKey),
        workflowResponseSchema,
        "file processing",
      )
      if (
        workflow.current_stage === "failed" ||
        workflow.failure_reason ||
        workflow.errors?.length
      ) {
        return Response.json(
          result("rejected", payload.manifestHash, [
            workflow.failure_reason || "MacroFab could not process the uploaded files.",
          ]),
        )
      }
      if (workflow.process_percentage < 100 || workflow.current_stage !== "awaiting_resolution") {
        return Response.json(
          result(
            "processing",
            payload.manifestHash,
            ["MacroFab is processing the uploaded fabrication files."],
            quoteToken,
            payload.expiresAt,
          ),
          { status: 202 },
        )
      }
      let acceptedFiles: ReturnType<typeof acceptedMacroFabFiles>
      try {
        acceptedFiles = acceptedMacroFabFiles(workflow)
      } catch (error) {
        return Response.json(
          result("rejected", payload.manifestHash, [
            error instanceof Error ? error.message : "MacroFab did not recognize the files.",
          ]),
        )
      }
      const accepted = await macroFabContract(
        await macroFabRequest(`${workflowBase}/accept`, apiKey, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            accepted_files: acceptedFiles,
            replace_pcb_files: true,
            specifications: {
              layer_count: payload.layers,
              outer_copper_weight: payload.copperWeightOz.toFixed(2),
              soldermask_color: payload.solderMaskColor,
              silkscreen_color: payload.silkscreenColor,
              surface_finish: "enig",
              thickness: 1.6,
              impedance_control: payload.impedanceControl ? 1 : 0,
              manufacturing: payload.manufacturing,
            },
          }),
        }),
        ingestionAcceptResponseSchema,
        "file import",
      )
      const nextToken = await issueMacroFabToken(
        {
          pcbId: payload.pcbId,
          pcbVersion: payload.pcbVersion,
          revisionId: payload.revisionId,
          manifestHash: payload.manifestHash,
          quantity: payload.quantity,
          layers: payload.layers,
          impedanceControl: payload.impedanceControl,
          copperWeightOz: payload.copperWeightOz,
          solderMaskColor: payload.solderMaskColor,
          silkscreenColor: payload.silkscreenColor,
          manufacturing: payload.manufacturing,
          workflowId: payload.workflowId,
          importRunId: accepted.run_id,
        },
        apiKey,
      )
      return Response.json(
        result(
          "processing",
          payload.manifestHash,
          ["MacroFab recognized the layers and is importing the reviewed files."],
          nextToken,
          (await verifyMacroFabToken(nextToken, apiKey)).expiresAt,
        ),
        { status: 202 },
      )
    }

    const importUrl = `${workflowBase}/import?${new URLSearchParams({ run_id: payload.importRunId })}`
    const importStatus = await macroFabContract(
      await macroFabRequest(importUrl, apiKey),
      importStatusResponseSchema,
      "file import status",
    )
    if (importStatus.current_stage === "failed" || importStatus.failure_reason) {
      return Response.json(
        result("rejected", payload.manifestHash, [
          importStatus.failure_reason || "MacroFab rejected the file import.",
        ]),
      )
    }
    if (importStatus.current_stage !== "completed") {
      return Response.json(
        result(
          "processing",
          payload.manifestHash,
          ["MacroFab is importing the reviewed fabrication files."],
          quoteToken,
          payload.expiresAt,
        ),
        { status: 202 },
      )
    }

    const providerErrors = await macroFabContract(
      await macroFabRequest(`${base}/errors`, apiKey),
      errorsResponseSchema,
      "file errors",
    )
    if (providerErrors.errors.length) {
      return Response.json(
        result(
          "rejected",
          payload.manifestHash,
          providerErrors.errors.map(({ message }) => message || "MacroFab reported a file error."),
        ),
      )
    }
    const files = await macroFabContract(
      await macroFabRequest(`${base}/files`, apiKey),
      processedFilesResponseSchema,
      "processed files",
    )
    if (!macroFabFilesProcessed(files)) {
      return Response.json(
        result(
          "processing",
          payload.manifestHash,
          ["MacroFab is still preparing the imported fabrication files."],
          quoteToken,
          payload.expiresAt,
        ),
        { status: 202 },
      )
    }
    const response = await macroFabRequest(quotePath(payload), apiKey)
    if (response.status === 404) {
      return Response.json(
        result(
          "processing",
          payload.manifestHash,
          ["MacroFab is still preparing the quote."],
          quoteToken,
          payload.expiresAt,
        ),
        { status: 202 },
      )
    }
    if (!response.ok) throw new Error(`MacroFab quote request failed (HTTP ${response.status}).`)
    return Response.json(parseMacroFabQuote(await response.json(), payload))
  } catch (error) {
    return error instanceof Error && error.message.startsWith("MacroFab")
      ? macroFabErrorResponse(error)
      : requestErrorResponse(error)
  }
}

export default { fetch: POST }
