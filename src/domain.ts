import { z } from "zod"

export const evidenceSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(160),
  sourceUrl: z.string().url(),
  revision: z.string().max(80).optional(),
  kind: z.enum(["datasheet", "standard", "test"]),
  official: z.boolean(),
})

export const requirementSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().min(1).max(240),
  value: z.string().max(500).optional(),
  required: z.boolean(),
  status: z.enum(["verified", "unverified", "blocked"]),
  evidenceIds: z.array(z.string()).max(20).default([]),
})

export const componentSchema = z.object({
  reference: z.string().regex(/^[A-Z]+[0-9]+$/),
  mpn: z.string().min(1).max(120),
  manufacturer: z.string().min(1).max(120),
  value: z.string().max(80).optional(),
  footprint: z.string().min(1).max(80),
  status: z.enum(["candidate", "verified"]).default("verified"),
  evidenceIds: z.array(z.string()).min(1).max(10),
})

export const placementSchema = z.object({
  reference: z.string(),
  x: z.number().min(-100).max(100),
  y: z.number().min(-100).max(100),
  rotation: z.number().min(0).max(359),
})

export const boardSpecSchema = z.object({
  template: z.literal("power-indicator"),
  widthMm: z.number().min(10).max(100),
  heightMm: z.number().min(10).max(100),
  layers: z.literal(2),
  resistanceOhms: z.number().int().min(100).max(100_000),
  placements: z.array(placementSchema).min(2).max(20),
})

export const snapshotSchema = z.object({
  requirements: z.array(requirementSchema).max(100),
  architecture: z.array(z.string().min(1).max(240)).max(30),
  components: z.array(componentSchema).max(100),
  evidence: z.array(evidenceSchema).max(100),
  constraints: z.array(z.string().min(1).max(500)).max(100).default([]),
  validationPlan: z.array(z.string().min(1).max(500)).max(30).default([]),
  boardSpec: boardSpecSchema.optional(),
  unresolvedRisks: z.array(z.string().min(1).max(500)).max(50),
})

export const validationSchema = z.object({
  status: z.enum(["not-run", "blocked", "passed"]),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  checkedAt: z.string().datetime().optional(),
})

export const revisionSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  summary: z.string().min(1).max(240),
  createdAt: z.string().datetime(),
  snapshot: snapshotSchema,
  validation: validationSchema,
})

export const boardProjectSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  currentRevisionId: z.string(),
  revisions: z.array(revisionSchema).min(1).max(30),
})

export type DesignSnapshot = z.infer<typeof snapshotSchema>
export type Revision = z.infer<typeof revisionSchema>
export type BoardProject = z.infer<typeof boardProjectSchema>
export type Validation = z.infer<typeof validationSchema>

const changeOperationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("resize-board"), widthMm: z.number(), heightMm: z.number() }),
  z.object({
    type: z.literal("move-component"),
    reference: z.string(),
    x: z.number(),
    y: z.number(),
  }),
  z.object({ type: z.literal("change-resistance"), resistanceOhms: z.number().int() }),
])

export const changeSchema = z.object({
  id: z.string(),
  baseRevisionId: z.string(),
  request: z.string().min(1).max(500),
  summary: z.string(),
  evidenceIds: z.array(z.string()),
  operation: changeOperationSchema,
})

export type DesignChange = z.infer<typeof changeSchema>

export const indicatorEvidence = [
  {
    id: "ev-led-datasheet",
    title: "Lite-On LTST-C170KGKT official datasheet",
    sourceUrl: "https://optoelectronics.liteon.com/upload/download/DS22-2000-073/LTST-C170KGKT.pdf",
    revision: "DS22-2000-073",
    kind: "datasheet" as const,
    official: true,
  },
  {
    id: "ev-resistor-datasheet",
    title: "Bourns CR series official datasheet",
    sourceUrl: "https://www.bourns.com/docs/product-datasheets/cr.pdf",
    kind: "datasheet" as const,
    official: true,
  },
  {
    id: "ev-connector-product",
    title: "Samtec TSW series official product page",
    sourceUrl: "https://www.samtec.com/products/tsw",
    kind: "datasheet" as const,
    official: true,
  },
]

export const indicatorSnapshot: DesignSnapshot = {
  requirements: [
    {
      id: "req-indicate-power",
      label: "Illuminate a green LED when power is present",
      value: "5 V nominal demonstration input",
      required: true,
      status: "verified",
      evidenceIds: ["ev-led-datasheet", "ev-resistor-datasheet"],
    },
  ],
  architecture: ["VCC → current-limiting resistor → green LED → GND"],
  components: [
    {
      reference: "R1",
      mpn: "CR0805-FX-1001ELF",
      manufacturer: "Bourns",
      value: "1 kΩ",
      footprint: "0805",
      status: "verified",
      evidenceIds: ["ev-resistor-datasheet"],
    },
    {
      reference: "D1",
      mpn: "LTST-C170KGKT",
      manufacturer: "Lite-On",
      value: "Green LED",
      footprint: "0805",
      status: "verified",
      evidenceIds: ["ev-led-datasheet"],
    },
    {
      reference: "J1",
      mpn: "TSW-102-07-G-S",
      manufacturer: "Samtec",
      value: "2-pin power input",
      footprint: "pinrow2, 2.54 mm pitch",
      status: "verified",
      evidenceIds: ["ev-connector-product"],
    },
  ],
  evidence: indicatorEvidence,
  constraints: [],
  validationPlan: [],
  boardSpec: {
    template: "power-indicator",
    widthMm: 25,
    heightMm: 15,
    layers: 2,
    resistanceOhms: 1000,
    placements: [
      { reference: "R1", x: -4, y: 0, rotation: 0 },
      { reference: "D1", x: 4, y: 0, rotation: 0 },
      { reference: "J1", x: -9, y: 0, rotation: 90 },
    ],
  },
  unresolvedRisks: [],
}

const captureQuestions = [
  ["camera-model", "Exact camera model and firmware"],
  ["apple-device", "Exact iPhone or iPad model"],
  ["os-version", "Exact OS version"],
  ["transport", "Wired or wireless transport"],
  ["video-mode", "Required resolution and frame rate"],
  ["charging", "Whether simultaneous charging is required"],
] as const

export const captureBridgeSnapshot: DesignSnapshot = {
  requirements: captureQuestions.map(([id, label]) => {
    const known: Record<
      string,
      Pick<DesignSnapshot["requirements"][number], "value" | "status">
    > = {
      "apple-device": {
        value: "USB-C iPad is documented; candidate iPhone Air still requires physical UVC proof",
        status: "unverified",
      },
      "os-version": {
        value: "Candidate iOS 26.6; UVC discovery not physically tested",
        status: "unverified",
      },
      transport: {
        value: "Candidate USB 3 UVC; requires exact-host physical proof",
        status: "unverified",
      },
      "video-mode": { value: "1080p30 YUY2; 720p60 fallback", status: "verified" },
      charging: {
        value: "No phone charging or backfeed; external regulated 5 V",
        status: "verified",
      },
    }
    return {
      id: `req-${id}`,
      label,
      required: true,
      status: known[id]?.status ?? ("blocked" as const),
      value: known[id]?.value,
      evidenceIds: id === "apple-device" ? ["ev-apple-external-camera"] : [],
    }
  }),
  architecture: [
    "Clean non-HDCP HDMI → TC358743XBG → four-lane MIPI CSI-2 → CYUSB3065-BZXC",
    "CYUSB3065 UVC output → HD3SS3220 USB-C UFP/mux → exact Apple host (unverified)",
    "External 5 V → input protection → unresolved 3.3 V, 2.5 V, 1.8 V, and 1.2 V rails",
    "PocketRoar native source handle → existing native compositor/encoder; no frames cross JavaScript",
  ],
  components: [
    {
      reference: "U1",
      mpn: "TC358743XBG(EL,NOK",
      manufacturer: "Toshiba",
      value: "HDMI 1.4 to four-lane MIPI CSI-2",
      footprint: "P-TFBGA64-0606-0.65-001",
      status: "candidate",
      evidenceIds: ["ev-toshiba-tc358743"],
    },
    {
      reference: "U2",
      mpn: "CYUSB3065-BZXC",
      manufacturer: "Infineon",
      value: "EZ-USB CX3 MIPI CSI-2 to USB 3 UVC bridge",
      footprint: "PG-LFBGA-121",
      status: "candidate",
      evidenceIds: ["ev-infineon-cx3", "ev-infineon-cx3-trm"],
    },
    {
      reference: "U3",
      mpn: "HD3SS3220",
      manufacturer: "Texas Instruments",
      value: "USB-C UFP controller and SuperSpeed mux",
      footprint: "RNH (WQFN-30)",
      status: "candidate",
      evidenceIds: ["ev-ti-hd3ss3220"],
    },
  ],
  evidence: [
    {
      id: "ev-apple-external-camera",
      title: "Apple AVCaptureDevice external camera documentation",
      sourceUrl:
        "https://developer.apple.com/documentation/avfoundation/avcapturedevice/devicetype-swift.struct/external",
      kind: "standard",
      official: true,
    },
    {
      id: "ev-toshiba-tc358743",
      title: "Toshiba TC358743XBG official datasheet",
      sourceUrl:
        "https://toshiba.semicon-storage.com/info/docget.jsp?did=35655&prodName=TC358743XBG",
      revision: "Rev. 2.20, 2026-05-11",
      kind: "datasheet",
      official: true,
    },
    {
      id: "ev-infineon-cx3",
      title: "Infineon CYUSB3065-BZXC product page",
      sourceUrl: "https://www.infineon.com/part/CYUSB3065-BZXC",
      kind: "datasheet",
      official: true,
    },
    {
      id: "ev-infineon-cx3-trm",
      title: "Infineon EZ-USB CX3 technical reference manual",
      sourceUrl:
        "https://www.infineon.com/dgdl/Infineon-EZ-USB_CX3_Technical_Reference_Manual-AdditionalTechnicalInformation-v03_00-EN.pdf?fileId=8ac78c8c7d0d8da4017d0f908b877d50",
      revision: "Rev. *K",
      kind: "datasheet",
      official: true,
    },
    {
      id: "ev-ti-hd3ss3220",
      title: "Texas Instruments HD3SS3220 product page",
      sourceUrl: "https://www.ti.com/product/HD3SS3220",
      revision: "Rev. E, 2025-07-18",
      kind: "datasheet",
      official: true,
    },
    {
      id: "ev-usb-uvc",
      title: "USB-IF Video Class 1.5 document set",
      sourceUrl: "https://www.usb.org/document-library/video-class-v15-document-set",
      kind: "standard",
      official: true,
    },
  ],
  constraints: [
    "Candidate eight-layer stack: signal / ground / signal / power / power / signal / ground / signal; manufacturer must approve the final stackup.",
    "Route USB SuperSpeed at 90 Ω differential and MIPI CSI-2 at 100 Ω ±10%; use the fabricator's field-solver geometry.",
    "Keep MIPI intra-pair mismatch under 0.5 mm, inter-lane mismatch under 1.5 mm, and each lane under 100 mm.",
    "Do not add probe stubs to HDMI, MIPI, or USB SuperSpeed pairs; expose only low-speed and rail test points.",
    "Use external regulated 5 V with current limit, reverse/backfeed protection, rail measurement links, and maximum-load power budgeting.",
  ],
  validationPlan: [
    "No-board gate: prove a known UVC device is discovered and renders on the exact Apple device, OS, cable, and orientation.",
    "Two-board proof: validate HDMI-to-CSI hardware with a CX3 reference design on macOS, then the exact Apple host.",
    "Resolve every rail, pin, clock, reset, strap, EDID device, connector, protection part, footprint, and firmware boot path; run ERC.",
    "Review impedance, return paths, connector launches, pair matching, thermal plan, and power integrity with a qualified hardware engineer; run DRC.",
    "Bring up rails independently, then HDMI lock, CSI counters, UVC enumeration, pattern-generator media, camera media, reconnect, and five-hour soak.",
    "Feed native frames through PocketRoar's existing source-handle boundary and prove preview, encode, remote ingest, recovery, and bounded memory.",
  ],
  unresolvedRisks: [
    "The exact camera model and clean-HDMI timing are unknown.",
    "Apple's public documentation establishes UVC external cameras on iPad, not iPhone; exact-host discovery is unverified.",
    "Power tree, clocks, EDID storage, connectors, protection, passives, pin mapping, footprints, firmware, thermal behavior, and signal integrity are unresolved.",
    "USB VID/PID rights and HDMI adopter/licensing obligations must be resolved before distribution.",
    "No integrated board may be exported, quoted, or described as fabrication-ready until every validation gate passes.",
  ],
}

const encoder = new TextEncoder()

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}

export async function sha256(value: string | Uint8Array): Promise<string> {
  const bytes = typeof value === "string" ? encoder.encode(value) : value
  const digest = await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function createProject(
  id: string,
  name: string,
  snapshot: DesignSnapshot,
): Promise<BoardProject> {
  const revision = await createRevision(null, "Initial reference design", snapshot)
  return boardProjectSchema.parse({
    schemaVersion: 1,
    id,
    name,
    currentRevisionId: revision.id,
    revisions: [revision],
  })
}

async function createRevision(
  parentId: string | null,
  summary: string,
  snapshot: DesignSnapshot,
): Promise<Revision> {
  const parsed = snapshotSchema.parse(snapshot)
  const id = (await sha256(stableStringify({ parentId, summary, snapshot: parsed }))).slice(0, 16)
  return {
    id,
    parentId,
    summary,
    createdAt: new Date().toISOString(),
    snapshot: structuredClone(parsed),
    validation: { status: "not-run", errors: [], warnings: [] },
  }
}

export function currentRevision(project: BoardProject): Revision {
  const revision = project.revisions.find(({ id }) => id === project.currentRevisionId)
  if (!revision) throw new Error("Current revision is missing")
  return revision
}

export function validateSnapshot(snapshot: DesignSnapshot): Validation {
  const errors: string[] = []
  const warnings: string[] = []
  if (!snapshot.boardSpec) errors.push("No compilable board specification exists.")
  for (const requirement of snapshot.requirements) {
    if (requirement.required && requirement.status !== "verified") {
      errors.push(`Required input is ${requirement.status}: ${requirement.label}`)
    }
  }
  for (const component of snapshot.components) {
    if (component.status !== "verified") errors.push(`${component.reference} is a candidate part.`)
    const officialEvidence = component.evidenceIds.some((id) =>
      snapshot.evidence.some((item) => item.id === id && item.official),
    )
    if (!officialEvidence) errors.push(`${component.reference} has no official component evidence.`)
  }
  if (snapshot.unresolvedRisks.length) {
    errors.push(...snapshot.unresolvedRisks.map((risk) => `Unresolved risk: ${risk}`))
  }
  if (!snapshot.components.length) warnings.push("No exact components have been selected.")
  return {
    status: errors.length ? "blocked" : "passed",
    errors,
    warnings,
    checkedAt: new Date().toISOString(),
  }
}

export async function previewChange(
  project: BoardProject,
  revisionId: string,
  request: string,
): Promise<DesignChange> {
  const revision = project.revisions.find(({ id }) => id === revisionId)
  if (!revision) throw new Error("Revision not found")
  const normalized = request.toLowerCase()
  let operation: z.infer<typeof changeOperationSchema>
  let summary: string
  const numbers = request.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
  if (normalized.includes("resiz") && numbers.length >= 2) {
    operation = { type: "resize-board", widthMm: numbers[0], heightMm: numbers[1] }
    summary = `Resize board to ${numbers[0]} × ${numbers[1]} mm`
  } else if ((normalized.includes("resistor") || normalized.includes("resistance")) && numbers[0]) {
    operation = { type: "change-resistance", resistanceOhms: Math.round(numbers[0]) }
    summary = `Change current-limiting resistance to ${Math.round(numbers[0])} Ω`
  } else if (normalized.includes("move") && numbers.length >= 2) {
    const reference = request.match(/\b[A-Z]+\d+\b/)?.[0] ?? "D1"
    const x = numbers[numbers.length - 2]
    const y = numbers[numbers.length - 1]
    operation = { type: "move-component", reference, x, y }
    summary = `Move ${reference} to (${x}, ${y}) mm`
  } else {
    throw new Error("Request a board resize, resistance change, or component move.")
  }
  const parsedOperation = changeOperationSchema.parse(operation)
  const id = (await sha256(stableStringify({ revisionId, parsedOperation }))).slice(0, 16)
  return {
    id,
    baseRevisionId: revisionId,
    request,
    summary,
    evidenceIds: revision.snapshot.evidence.map(({ id: evidenceId }) => evidenceId),
    operation: parsedOperation,
  }
}

export async function applyChange(
  project: BoardProject,
  change: DesignChange,
): Promise<BoardProject> {
  const parsed = changeSchema.parse(change)
  if (project.currentRevisionId !== parsed.baseRevisionId) {
    throw new Error("Change is stale; preview it again from the current revision.")
  }
  const snapshot = structuredClone(currentRevision(project).snapshot)
  if (!snapshot.boardSpec) throw new Error("The revision has no board to change.")
  switch (parsed.operation.type) {
    case "resize-board":
      snapshot.boardSpec.widthMm = parsed.operation.widthMm
      snapshot.boardSpec.heightMm = parsed.operation.heightMm
      break
    case "change-resistance":
      snapshot.boardSpec.resistanceOhms = parsed.operation.resistanceOhms
      {
        const resistor = snapshot.components.find(({ reference }) => reference === "R1")
        if (!resistor) throw new Error("Current-limiting resistor R1 is missing.")
        resistor.value = `${parsed.operation.resistanceOhms} Ω`
      }
      break
    case "move-component": {
      const operation = parsed.operation
      const placement = snapshot.boardSpec.placements.find(
        ({ reference }) => reference === operation.reference,
      )
      if (!placement) throw new Error(`Component ${operation.reference} is not placed.`)
      placement.x = operation.x
      placement.y = operation.y
      break
    }
  }
  const revision = await createRevision(project.currentRevisionId, parsed.summary, snapshot)
  return boardProjectSchema.parse({
    ...project,
    currentRevisionId: revision.id,
    revisions: [...project.revisions, revision].slice(-30),
  })
}

export function withValidation(project: BoardProject, validation: Validation): BoardProject {
  return {
    ...project,
    revisions: project.revisions.map((revision) =>
      revision.id === project.currentRevisionId ? { ...revision, validation } : revision,
    ),
  }
}

export function importProject(source: string): BoardProject {
  return boardProjectSchema.parse(JSON.parse(source))
}
