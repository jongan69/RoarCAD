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
import { createElement, type ReactElement } from "react"
import type {
  BoardComponent,
  BoardGraph,
  BoardProject,
  DesignSnapshot,
  Readiness,
  Validation,
} from "./domain"
import {
  boardGraphSchema,
  currentRevision,
  sha256,
  stableStringify,
  validateSnapshot,
} from "./domain"

export type CircuitElement = Record<string, unknown>
export type ArtifactClass = "engineering" | "fabrication"

export type PreparedExport = {
  revisionId: string
  manifestHash: string
  manifest: {
    schemaVersion: 2
    revisionId: string
    generatedAt: string
    artifactClass: ArtifactClass
    readiness: Readiness
    files: Array<{ name: string; sha256: string; bytes: number }>
  }
  files: Record<string, Uint8Array>
  bundle: Blob
  validation: Validation
}

const encode = (value: string) => new TextEncoder().encode(value)

function footprintValue(component: BoardComponent): string | ReactElement {
  const footprint = component.footprint
  if (footprint.source === "pad-map") {
    return createElement(
      "footprint",
      null,
      ...footprint.pads.map((pad, index) => {
        const common = {
          key: `${component.reference}-pad-${index}`,
          pcbX: pad.x,
          pcbY: pad.y,
          portHints: pad.portHints,
        }
        if (pad.type === "pcb_plated_hole") {
          if (pad.shape === "pill") {
            return createElement("platedhole", {
              ...common,
              shape: "pill",
              holeWidth: pad.holeWidth,
              holeHeight: pad.holeHeight,
              outerWidth: pad.outerWidth,
              outerHeight: pad.outerHeight,
            })
          }
          return createElement("platedhole", {
            ...common,
            shape: pad.shape === "rect" ? "circular_hole_with_rect_pad" : "circle",
            holeDiameter: pad.holeDiameter,
            ...(pad.shape === "rect"
              ? { rectPadWidth: pad.outerDiameter, rectPadHeight: pad.outerDiameter }
              : { outerDiameter: pad.outerDiameter }),
          })
        }
        return createElement("smtpad", {
          ...common,
          layer: pad.layer,
          shape: pad.shape,
          ...(pad.shape === "circle"
            ? { radius: Math.min(pad.width, pad.height) / 2 }
            : { width: pad.width, height: pad.height }),
        })
      }),
    )
  }
  if (footprint.source === "kicad-library") return `kicad:${footprint.identifier}`
  if (footprint.source === "jlcpcb") return `jlcpcb:${footprint.identifier}`
  return footprint.identifier
}

function componentElement(component: BoardComponent): ReactElement {
  const common = {
    name: component.reference,
    footprint: footprintValue(component),
    manufacturerPartNumber: component.mpn,
    pcbX: component.placement.x,
    pcbY: component.placement.y,
    pcbRotation: component.placement.rotation,
    pcbSide: component.placement.side,
    doNotPlace: component.doNotPlace,
  }
  const pinLabels = Object.fromEntries(
    component.pins.map(({ number, label }) => [`pin${number}`, label]),
  )
  switch (component.kind) {
    case "resistor":
      return createElement("resistor", { ...common, resistance: component.value ?? "1k" })
    case "capacitor":
      return createElement("capacitor", { ...common, capacitance: component.value ?? "100nF" })
    case "inductor":
      return createElement("inductor", { ...common, inductance: component.value ?? "1uH" })
    case "diode":
      return createElement("diode", common)
    case "led":
      return createElement("led", { ...common, color: component.value ?? "green" })
    case "transistor":
      return createElement("transistor", { ...common, type: "bjt" })
    case "mosfet":
      return createElement("mosfet", { ...common, channelType: "n", mosfetMode: "enhancement" })
    case "fuse":
      return createElement("fuse", { ...common, currentRating: component.value ?? "1A" })
    case "crystal":
      return createElement("crystal", {
        ...common,
        frequency: component.value ?? "27MHz",
        loadCapacitance: "10pF",
        pinVariant: component.pins.length >= 4 ? "four_pin" : "two_pin",
      })
    case "connector":
      return createElement("connector", { ...common, pinCount: component.pins.length, pinLabels })
    case "switch":
      return createElement("switch", { ...common, type: "spst" })
    case "testpoint":
      return createElement("testpoint", {
        ...common,
        footprint: undefined,
        footprintVariant: "pad",
      })
    case "chip":
      return createElement("chip", { ...common, pinLabels })
  }
}

function graphChildren(graph: BoardGraph) {
  const children: ReactElement[] = graph.components.map(componentElement)
  const netClasses = new Map(graph.netClasses.map((netClass) => [netClass.name, netClass]))
  for (const net of graph.nets) {
    const netClass = netClasses.get(net.className)
    for (let index = 1; index < net.members.length; index += 1) {
      children.push(
        createElement("trace", {
          name: index === 1 ? net.name : `${net.name}_${index}`,
          from: net.members[0],
          to: net.members[index],
          thickness: netClass?.traceWidthMm,
          maxViaCount: 4,
          pcbPath: index === 1 ? net.pcbPath : undefined,
          pcbPathRelativeTo: index === 1 && net.pcbPath ? net.members[0] : undefined,
        }),
      )
    }
  }
  // ponytail: retain pair constraints in BoardGraph/readiness warnings until the
  // installed tscircuit differential-pair router settles deterministically.
  for (const pour of graph.pours) {
    children.push(
      createElement("copperpour", {
        name: pour.id,
        layer: pour.layer,
        connectsTo: `net.${pour.net}`,
        clearance: pour.clearanceMm,
        outline: pour.outline.length ? pour.outline : undefined,
      }),
    )
  }
  for (const hole of graph.holes) {
    children.push(
      createElement("hole", {
        name: hole.id,
        diameter: hole.diameterMm,
        pcbX: hole.x,
        pcbY: hole.y,
      }),
    )
  }
  for (const keepout of graph.keepouts) {
    children.push(
      createElement("keepout", {
        name: keepout.id,
        shape: "rect",
        pcbX: keepout.x,
        pcbY: keepout.y,
        width: keepout.widthMm,
        height: keepout.heightMm,
        layers: keepout.layers,
      }),
    )
  }
  return children
}

export async function compileBoardGraph(input: BoardGraph): Promise<CircuitElement[]> {
  const graph = boardGraphSchema.parse(input)
  const outline = graph.board.outline
  const boardProps = {
    material: graph.board.material,
    layers: graph.board.layers,
    thickness: graph.board.thicknessMm,
    solderMaskColor: graph.board.solderMaskColor,
    allowBlindAndBuriedVias: graph.board.allowBlindAndBuriedVias,
    isViaInPadAllowed: graph.board.isViaInPadAllowed,
    doubleSidedAssembly: graph.board.doubleSidedAssembly,
    ...(outline.shape === "rectangle"
      ? { width: outline.widthMm, height: outline.heightMm }
      : { outline: outline.points }),
  }
  const circuit = new Circuit()
  circuit.add(
    createElement("board" as never, boardProps as never, ...graphChildren(graph)) as never,
  )
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson() as CircuitElement[]
}

export async function compileSnapshot(snapshot: DesignSnapshot): Promise<CircuitElement[]> {
  if (!snapshot.design) throw new Error("This requirements package has no compilable BoardGraph.")
  return compileBoardGraph(snapshot.design)
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
  const checkErrors = labels.filter((_, index) =>
    String(issues[index]?.type ?? "").includes("error"),
  )
  const checkWarnings = labels.filter((label) => !checkErrors.includes(label))
  const fabricationErrors = domain.readiness === "fabrication-ready" ? checkErrors : []
  return {
    status: fabricationErrors.length ? "blocked" : "passed",
    readiness: fabricationErrors.length ? "blocked" : domain.readiness,
    errors: fabricationErrors,
    warnings: [
      ...domain.warnings,
      ...checkWarnings,
      ...(domain.readiness === "engineering" ? checkErrors : []),
    ],
    checkedAt: new Date().toISOString(),
  }
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

function bomCsv(snapshot: DesignSnapshot): string {
  return [
    "Designator,Manufacturer,MPN,Value,Footprint,ReviewStatus",
    ...(snapshot.design?.components ?? []).map((component) =>
      [
        component.reference,
        component.manufacturer,
        component.mpn,
        component.value ?? "",
        component.footprint.identifier,
        component.reviewStatus,
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\n")
}

function normalizeFabricationTimestamp(contents: string, createdAt: string): string {
  return contents
    .replaceAll(/CreationDate,[^*\r\n]+/g, `CreationDate,${createdAt}`)
    .replaceAll(/date \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, `date ${createdAt}`)
}

function digitalVerificationMarkdown(
  snapshot: DesignSnapshot,
  validation: Validation,
  circuitJson: CircuitElement[],
): string {
  const pending = snapshot.validationPlan.map((item) => `- [ ] ${item}`).join("\n")
  return `# RoarCAD digital verification

Revision checks are reproducible engineering evidence, not physical certification.

| Analysis | Result | Evidence |
| --- | --- | --- |
| BoardGraph schema and reference integrity | ${validation.status === "blocked" ? "blocked" : "pass"} | Validated input graph |
| tscircuit compile and design checks | ${validation.status} | ${circuitJson.length} Circuit JSON elements; ${validation.errors.length} blockers; ${validation.warnings.length} warnings |
| Analog/power SPICE | not run | Exact vendor models and extracted load network are not attached to this revision |
| HDMI / MIPI / USB signal integrity | not run | Approved stackup, routed channels, package models, and S-parameters are required |
| Firmware, EDID, UVC, and host compatibility | not run | Requires firmware plus physical source and host hardware |

## Remaining validation plan

${pending || "- [ ] No physical validation plan was supplied."}

Readiness: **${validation.readiness}**. Fabrication and ordering require a fabrication-ready revision.
`
}

export async function prepareExport(
  project: BoardProject,
  artifactClass: ArtifactClass = "engineering",
  onProgress: (stage: string) => void = () => undefined,
): Promise<PreparedExport> {
  const revision = currentRevision(project)
  if (
    artifactClass === "fabrication" &&
    validateSnapshot(revision.snapshot).readiness !== "fabrication-ready"
  ) {
    throw new Error("Fabrication export blocked: the design is not fabrication-ready.")
  }
  onProgress("Compiling the current revision…")
  const circuitJson = await compileSnapshot(revision.snapshot)
  onProgress("Running design checks…")
  const validation = {
    ...(await validateCircuit(revision.snapshot, circuitJson)),
    checkedAt: revision.createdAt,
  }
  if (validation.status !== "passed")
    throw new Error(`Export blocked: ${validation.errors.join(" ")}`)

  onProgress("Generating manufacturing layers…")
  const gerberLayers = stringifyGerberCommandLayers(
    convertSoupToGerberCommands(circuitJson as never),
  ) as Record<string, string>
  const gerberZip = new JSZip()
  const deterministicZipDate = new Date("1980-01-01T00:00:00.000Z")
  for (const [name, contents] of Object.entries(gerberLayers))
    gerberZip.file(name, normalizeFabricationTimestamp(contents, revision.createdAt), {
      date: deterministicZipDate,
    })
  for (const [name, isPlated] of [
    ["plated.drl", true],
    ["unplated.drl", false],
  ] as const) {
    const commands = convertSoupToExcellonDrillCommands({
      circuitJson: circuitJson as never,
      is_plated: isPlated,
    })
    gerberZip.file(
      name,
      normalizeFabricationTimestamp(stringifyExcellonDrill(commands), revision.createdAt),
      { date: deterministicZipDate },
    )
  }

  const exportedProject = {
    ...project,
    revisions: project.revisions.map((item) =>
      item.id === revision.id ? { ...item, validation } : item,
    ),
  }
  const files: Record<string, Uint8Array> = {
    "gerbers.zip": await gerberZip.generateAsync({ type: "uint8array" }),
    "bom.csv": encode(bomCsv(revision.snapshot)),
    "placement.csv": encode(convertCircuitJsonToPickAndPlaceCsv(circuitJson as never)),
    "validation.json": encode(JSON.stringify(validation, null, 2)),
    "validation.md": encode(
      `# RoarCAD validation\n\nStatus: **${validation.status}**\n\nReadiness: **${validation.readiness}**\n\nRevision: \`${revision.id}\`\n`,
    ),
    "digital-verification.md": encode(
      digitalVerificationMarkdown(revision.snapshot, validation, circuitJson),
    ),
    "circuit.json": encode(JSON.stringify(circuitJson, null, 2)),
    "project.roarcad.json": encode(JSON.stringify(exportedProject, null, 2)),
  }
  if (artifactClass === "engineering") {
    files["ENGINEERING_ONLY.md"] = encode(
      "# Engineering candidate only\n\nThis package is not fabrication-ready and must not be quoted, ordered, or treated as electrically validated.\n",
    )
  }
  onProgress("Hashing the artifact manifest…")
  const manifest = {
    schemaVersion: 2 as const,
    revisionId: revision.id,
    generatedAt: revision.createdAt,
    artifactClass,
    readiness: validation.readiness,
    files: await Promise.all(
      Object.entries(files).map(async ([name, bytes]) => ({
        name,
        sha256: await sha256(bytes),
        bytes: bytes.byteLength,
      })),
    ),
  }
  const manifestHash = await sha256(stableStringify(manifest))
  files["manifest.json"] = encode(JSON.stringify({ ...manifest, manifestHash }, null, 2))
  const bundleZip = new JSZip()
  for (const [name, bytes] of Object.entries(files)) bundleZip.file(name, bytes)
  onProgress("Packaging the download bundle…")
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
