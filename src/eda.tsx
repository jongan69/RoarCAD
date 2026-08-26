import { runAllChecks } from "@tscircuit/checks"
import { Circuit } from "@tscircuit/core"
import {
  convertSoupToExcellonDrillCommands,
  convertSoupToGerberCommands,
  stringifyExcellonDrill,
  stringifyGerberCommandLayers,
} from "circuit-json-to-gerber"
import { convertCircuitJsonToPickAndPlaceCsv } from "circuit-json-to-pnp-csv"
import JSZip from "jszip"
import type { BoardProject, DesignSnapshot, Validation } from "./domain"
import { currentRevision, sha256, stableStringify, validateSnapshot } from "./domain"

export type CircuitElement = Record<string, unknown>

export type PreparedExport = {
  revisionId: string
  manifestHash: string
  manifest: {
    schemaVersion: 1
    revisionId: string
    generatedAt: string
    files: Array<{ name: string; sha256: string; bytes: number }>
  }
  files: Record<string, Uint8Array>
  bundle: Blob
  validation: Validation
}

const encode = (value: string) => new TextEncoder().encode(value)

export async function compileSnapshot(snapshot: DesignSnapshot): Promise<CircuitElement[]> {
  const spec = snapshot.boardSpec
  if (!spec) throw new Error("This requirements package has no compilable board.")
  const placement = Object.fromEntries(spec.placements.map((item) => [item.reference, item]))
  const circuit = new Circuit()
  circuit.add(
    <board width={`${spec.widthMm}mm`} height={`${spec.heightMm}mm`}>
      <pinheader
        name="J1"
        pinCount={2}
        footprint="pinrow2"
        manufacturerPartNumber="TSW-102-07-G-S"
        pcbX={placement.J1?.x ?? -9}
        pcbY={placement.J1?.y ?? 0}
        pcbRotation={placement.J1?.rotation ?? 90}
        schX={-5}
      />
      <resistor
        name="R1"
        resistance={spec.resistanceOhms}
        footprint="0805"
        manufacturerPartNumber="CR0805-FX-1001ELF"
        pcbX={placement.R1?.x ?? -4}
        pcbY={placement.R1?.y ?? 0}
        schX={-2}
      />
      <led
        name="D1"
        color="green"
        footprint="0805"
        manufacturerPartNumber="LTST-C170KGKT"
        pcbX={placement.D1?.x ?? 4}
        pcbY={placement.D1?.y ?? 0}
        schX={2}
      />
      <trace from="J1.pin1" to="R1.pin1" />
      <trace from="R1.pin2" to="D1.pos" />
      <trace from="D1.neg" to="J1.pin2" />
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson() as CircuitElement[]
}

export async function validateCircuit(
  snapshot: DesignSnapshot,
  circuitJson?: CircuitElement[],
): Promise<Validation> {
  const domain = validateSnapshot(snapshot)
  if (domain.status === "blocked") return domain
  const json = circuitJson ?? (await compileSnapshot(snapshot))
  const issues = (await runAllChecks(json as never)) as Array<Record<string, unknown>>
  const labels = issues.map((issue) =>
    String(
      issue.message ??
        issue.error_type ??
        issue.warning_type ??
        issue.type ??
        "Unknown check issue",
    ),
  )
  const errors = labels.filter((_, index) => String(issues[index]?.type ?? "").includes("error"))
  const warnings = labels.filter((label) => !errors.includes(label))
  return {
    status: errors.length ? "blocked" : "passed",
    errors,
    warnings,
    checkedAt: new Date().toISOString(),
  }
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

function bomCsv(snapshot: DesignSnapshot): string {
  return [
    "Designator,Manufacturer,MPN,Value,Footprint",
    ...snapshot.components.map((component) =>
      [
        component.reference,
        component.manufacturer,
        component.mpn,
        component.value ?? "",
        component.footprint,
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\n")
}

export async function prepareExport(project: BoardProject): Promise<PreparedExport> {
  const revision = currentRevision(project)
  const circuitJson = await compileSnapshot(revision.snapshot)
  const validation = await validateCircuit(revision.snapshot, circuitJson)
  if (validation.status !== "passed") {
    throw new Error(`Export blocked: ${validation.errors.join(" ")}`)
  }

  const gerberLayers = stringifyGerberCommandLayers(
    convertSoupToGerberCommands(circuitJson as never),
  ) as Record<string, string>
  const gerberZip = new JSZip()
  for (const [name, contents] of Object.entries(gerberLayers)) gerberZip.file(name, contents)
  const drills = [
    ["plated.drl", true],
    ["unplated.drl", false],
  ] as const
  for (const [name, isPlated] of drills) {
    const commands = convertSoupToExcellonDrillCommands({
      circuitJson: circuitJson as never,
      is_plated: isPlated,
    })
    gerberZip.file(name, stringifyExcellonDrill(commands))
  }

  const validationJson = JSON.stringify(validation, null, 2)
  const files: Record<string, Uint8Array> = {
    "gerbers.zip": await gerberZip.generateAsync({ type: "uint8array" }),
    "bom.csv": encode(bomCsv(revision.snapshot)),
    "placement.csv": encode(convertCircuitJsonToPickAndPlaceCsv(circuitJson as never)),
    "validation.json": encode(validationJson),
    "validation.md": encode(
      `# RoarCAD validation\n\nStatus: **${validation.status}**\n\nRevision: \`${revision.id}\`\n`,
    ),
    "circuit.json": encode(JSON.stringify(circuitJson, null, 2)),
    "project.roarcad.json": encode(JSON.stringify(project, null, 2)),
  }
  const manifest = {
    schemaVersion: 1 as const,
    revisionId: revision.id,
    generatedAt: new Date().toISOString(),
    files: await Promise.all(
      Object.entries(files).map(async ([name, bytes]) => ({
        name,
        sha256: await sha256(bytes),
        bytes: bytes.byteLength,
      })),
    ),
  }
  const manifestText = stableStringify(manifest)
  const manifestHash = await sha256(manifestText)
  files["manifest.json"] = encode(JSON.stringify({ ...manifest, manifestHash }, null, 2))
  const bundleZip = new JSZip()
  for (const [name, bytes] of Object.entries(files)) bundleZip.file(name, bytes)
  return {
    revisionId: revision.id,
    manifestHash,
    manifest,
    files,
    bundle: await bundleZip.generateAsync({ type: "blob" }),
    validation,
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
