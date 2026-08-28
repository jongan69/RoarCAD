import { z } from "zod"

const refSchema = z.string().regex(/^[A-Z]+[0-9]+$/)
const coordinateSchema = z.number().min(-500).max(500)
const layersSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(4),
  z.literal(6),
  z.literal(8),
  z.literal(10),
])

export const evidenceSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(160),
  sourceUrl: z.string().url(),
  revision: z.string().max(80).optional(),
  kind: z.enum(["datasheet", "standard", "test"]),
  official: z.boolean(),
  reviewed: z.boolean().default(false),
})

export const requirementSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().min(1).max(240),
  value: z.string().max(500).optional(),
  required: z.boolean(),
  status: z.enum(["verified", "unverified", "blocked"]),
  evidenceIds: z.array(z.string()).max(20).default([]),
})

const placementSchema = z.object({
  x: coordinateSchema,
  y: coordinateSchema,
  rotation: z.number().min(0).max(359).default(0),
  side: z.enum(["top", "bottom"]).default("top"),
})

const smtPadSchema = z.object({
  type: z.literal("pcb_smtpad"),
  x: coordinateSchema,
  y: coordinateSchema,
  layer: z.enum(["top", "bottom"]).default("top"),
  shape: z.enum(["circle", "rect"]).default("rect"),
  width: z.number().positive().max(50),
  height: z.number().positive().max(50),
  portHints: z.array(z.string().min(1).max(80)).min(1).max(10),
})

const circularPlatedHolePadSchema = z.object({
  type: z.literal("pcb_plated_hole"),
  x: coordinateSchema,
  y: coordinateSchema,
  shape: z.enum(["circle", "rect"]).default("circle"),
  holeDiameter: z.number().positive().max(50),
  outerDiameter: z.number().positive().max(50),
  portHints: z.array(z.string().min(1).max(80)).min(1).max(10),
})

const pillPlatedHolePadSchema = z.object({
  type: z.literal("pcb_plated_hole"),
  x: coordinateSchema,
  y: coordinateSchema,
  shape: z.literal("pill"),
  holeWidth: z.number().positive().max(50),
  holeHeight: z.number().positive().max(50),
  outerWidth: z.number().positive().max(50),
  outerHeight: z.number().positive().max(50),
  portHints: z.array(z.string().min(1).max(80)).min(1).max(10),
})

export const footprintSchema = z
  .object({
    source: z.enum(["footprinter", "kicad-library", "jlcpcb", "pad-map"]),
    identifier: z.string().min(1).max(240),
    sha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    pads: z
      .array(z.union([smtPadSchema, circularPlatedHolePadSchema, pillPlatedHolePadSchema]))
      .max(512),
    reviewed: z.boolean().default(false),
  })
  .superRefine((footprint, context) => {
    if (footprint.source === "pad-map" && footprint.pads.length === 0) {
      context.addIssue({ code: "custom", message: "A pad-map footprint requires pads." })
    }
    if (footprint.source !== "pad-map" && footprint.pads.length > 0) {
      context.addIssue({ code: "custom", message: "Library footprints cannot include pad data." })
    }
  })

const pinSchema = z.object({
  number: z.string().min(1).max(40),
  label: z.string().min(1).max(80),
})

export const componentSchema = z.object({
  kind: z.enum([
    "resistor",
    "capacitor",
    "inductor",
    "diode",
    "led",
    "transistor",
    "mosfet",
    "fuse",
    "crystal",
    "connector",
    "switch",
    "testpoint",
    "chip",
  ]),
  reference: refSchema,
  mpn: z.string().min(1).max(120),
  manufacturer: z.string().min(1).max(120),
  value: z.string().max(80).optional(),
  pins: z.array(pinSchema).min(1).max(256),
  footprint: footprintSchema,
  placement: placementSchema,
  reviewStatus: z.enum(["candidate", "reviewed"]).default("candidate"),
  evidenceIds: z.array(z.string()).min(1).max(10),
  supplierPartIds: z.record(z.string(), z.string().max(120)).default({}),
  doNotPlace: z.boolean().default(false),
})

const outlineSchema = z.discriminatedUnion("shape", [
  z.object({
    shape: z.literal("rectangle"),
    widthMm: z.number().min(5).max(500),
    heightMm: z.number().min(5).max(500),
  }),
  z.object({
    shape: z.literal("polygon"),
    points: z
      .array(z.object({ x: coordinateSchema, y: coordinateSchema }))
      .min(3)
      .max(128),
  }),
])

export const boardSchema = z.object({
  outline: outlineSchema,
  layers: layersSchema,
  material: z.enum(["fr4", "fr1", "flex"]).default("fr4"),
  thicknessMm: z.number().min(0.2).max(8).default(1.6),
  solderMaskColor: z.enum(["green", "red", "blue", "purple", "black", "white", "yellow"]),
  allowBlindAndBuriedVias: z.boolean().default(false),
  isViaInPadAllowed: z.boolean().default(false),
  doubleSidedAssembly: z.boolean().default(false),
  stackup: z.array(z.string().min(1).max(80)).max(10).default([]),
})

const netClassSchema = z.object({
  name: z.string().min(1).max(80),
  traceWidthMm: z.number().positive().max(10),
  clearanceMm: z.number().nonnegative().max(10),
  targetImpedanceOhms: z.number().positive().max(1_000).optional(),
})

const netSchema = z.object({
  name: z.string().min(1).max(80),
  members: z.array(z.string().min(3).max(140)).min(2).max(200),
  className: z.string().min(1).max(80).default("default"),
  pcbPath: z
    .array(
      z.union([
        z.object({ x: coordinateSchema, y: coordinateSchema, via: z.literal(false).optional() }),
        z.object({
          x: coordinateSchema,
          y: coordinateSchema,
          via: z.literal(true),
          fromLayer: z.string().min(1).max(40).optional(),
          toLayer: z.string().min(1).max(40),
        }),
      ]),
    )
    .min(1)
    .max(100)
    .optional(),
})

const differentialPairSchema = z.object({
  name: z.string().min(1).max(80),
  positiveNet: z.string().min(1).max(80),
  negativeNet: z.string().min(1).max(80),
  targetImpedanceOhms: z.number().positive().max(1_000),
  maxSkewMm: z.number().nonnegative().max(100),
  traceGapMm: z.number().positive().max(10).optional(),
})

const pourSchema = z.object({
  id: z.string().min(1).max(80),
  layer: z.string().min(1).max(40),
  net: z.string().min(1).max(80),
  clearanceMm: z.number().nonnegative().max(10).default(0.2),
  outline: z
    .array(z.object({ x: coordinateSchema, y: coordinateSchema }))
    .max(128)
    .default([]),
})

const holeSchema = z.object({
  id: z.string().min(1).max(80),
  x: coordinateSchema,
  y: coordinateSchema,
  diameterMm: z.number().positive().max(100),
  plated: z.boolean().default(false),
})

const keepoutSchema = z.object({
  id: z.string().min(1).max(80),
  x: coordinateSchema,
  y: coordinateSchema,
  widthMm: z.number().positive().max(500),
  heightMm: z.number().positive().max(500),
  layers: z.array(z.string().min(1).max(40)).min(1).max(10),
})

export const boardGraphSchema = z
  .object({
    board: boardSchema,
    components: z.array(componentSchema).min(1).max(200),
    nets: z.array(netSchema).max(500),
    netClasses: z.array(netClassSchema).min(1).max(50),
    differentialPairs: z.array(differentialPairSchema).max(100).default([]),
    pours: z.array(pourSchema).max(50).default([]),
    holes: z.array(holeSchema).max(100).default([]),
    keepouts: z.array(keepoutSchema).max(100).default([]),
    routingHints: z.array(z.string().min(1).max(500)).max(200).default([]),
  })
  .superRefine((graph, context) => {
    const references = new Set<string>()
    const evidenceSelectors = new Set<string>()
    for (const component of graph.components) {
      if (references.has(component.reference)) {
        context.addIssue({ code: "custom", message: `Duplicate reference: ${component.reference}` })
      }
      references.add(component.reference)
      const pinNumbers = new Set<string>()
      const pinLabels = new Set<string>()
      for (const pin of component.pins) {
        if (pinNumbers.has(pin.number))
          context.addIssue({
            code: "custom",
            message: `Duplicate pin number on ${component.reference}: ${pin.number}`,
          })
        if (pinLabels.has(pin.label))
          context.addIssue({
            code: "custom",
            message: `Duplicate pin label on ${component.reference}: ${pin.label}`,
          })
        pinNumbers.add(pin.number)
        pinLabels.add(pin.label)
        evidenceSelectors.add(`${component.reference}.pin${pin.number}`)
        evidenceSelectors.add(`${component.reference}.${pin.label}`)
      }
      for (const pad of component.footprint.pads) {
        for (const hint of pad.portHints) {
          const normalized = hint.startsWith("pin") ? hint.slice(3) : hint
          if (!pinNumbers.has(normalized) && !pinLabels.has(hint))
            context.addIssue({
              code: "custom",
              message: `Footprint pad on ${component.reference} references unknown pin ${hint}.`,
            })
        }
      }
    }
    const classNames = new Set(graph.netClasses.map(({ name }) => name))
    const netNames = new Set<string>()
    for (const net of graph.nets) {
      if (netNames.has(net.name)) {
        context.addIssue({ code: "custom", message: `Duplicate net: ${net.name}` })
      }
      netNames.add(net.name)
      if (!classNames.has(net.className)) {
        context.addIssue({ code: "custom", message: `Unknown net class: ${net.className}` })
      }
      for (const member of net.members) {
        if (!evidenceSelectors.has(member)) {
          context.addIssue({ code: "custom", message: `Unknown pin selector: ${member}` })
        }
      }
    }
    for (const pair of graph.differentialPairs) {
      if (!netNames.has(pair.positiveNet) || !netNames.has(pair.negativeNet)) {
        context.addIssue({
          code: "custom",
          message: `Differential pair ${pair.name} references an unknown net.`,
        })
      }
    }
    for (const pour of graph.pours) {
      if (!netNames.has(pour.net)) {
        context.addIssue({ code: "custom", message: `Pour ${pour.id} references an unknown net.` })
      }
    }
  })

export const snapshotSchema = z.object({
  requirements: z.array(requirementSchema).max(100),
  architecture: z.array(z.string().min(1).max(240)).max(30),
  evidence: z.array(evidenceSchema).max(100),
  constraints: z.array(z.string().min(1).max(500)).max(100).default([]),
  validationPlan: z.array(z.string().min(1).max(500)).max(30).default([]),
  design: boardGraphSchema.optional(),
  unresolvedRisks: z.array(z.string().min(1).max(500)).max(50),
})

export const readinessSchema = z.enum(["blocked", "engineering", "fabrication-ready"])

export const validationSchema = z.object({
  status: z.enum(["not-run", "blocked", "passed"]),
  readiness: readinessSchema,
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
  schemaVersion: z.literal(2),
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  currentRevisionId: z.string(),
  revisions: z.array(revisionSchema).min(1).max(30),
  externalAncestorRevisionIds: z.array(z.string().min(1).max(80)).max(100).default([]),
})

export type Evidence = z.infer<typeof evidenceSchema>
export type BoardGraph = z.infer<typeof boardGraphSchema>
export type BoardComponent = z.infer<typeof componentSchema>
export type DesignSnapshot = z.infer<typeof snapshotSchema>
export type Revision = z.infer<typeof revisionSchema>
export type BoardProject = z.infer<typeof boardProjectSchema>
export type Validation = z.infer<typeof validationSchema>
export type Readiness = z.infer<typeof readinessSchema>

const agentEvidenceSchema = evidenceSchema.omit({ reviewed: true })
const componentOperationSchema = componentSchema
const riskSchema = z.string().min(1).max(500)

export const changeOperationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("set-board"), board: boardSchema }),
  z.object({ type: z.literal("upsert-component"), component: componentOperationSchema }),
  z.object({ type: z.literal("remove-component"), reference: refSchema }),
  z.object({ type: z.literal("move-component"), reference: refSchema, ...placementSchema.shape }),
  z.object({ type: z.literal("upsert-net"), net: netSchema }),
  z.object({ type: z.literal("remove-net"), name: z.string().min(1).max(80) }),
  z.object({ type: z.literal("upsert-differential-pair"), pair: differentialPairSchema }),
  z.object({ type: z.literal("remove-differential-pair"), name: z.string().min(1).max(80) }),
  z.object({ type: z.literal("upsert-pour"), pour: pourSchema }),
  z.object({ type: z.literal("remove-pour"), id: z.string().min(1).max(80) }),
  z.object({ type: z.literal("upsert-hole"), hole: holeSchema }),
  z.object({ type: z.literal("remove-hole"), id: z.string().min(1).max(80) }),
  z.object({ type: z.literal("upsert-keepout"), keepout: keepoutSchema }),
  z.object({ type: z.literal("remove-keepout"), id: z.string().min(1).max(80) }),
  z.object({ type: z.literal("update-requirement"), requirement: requirementSchema }),
  z.object({ type: z.literal("upsert-evidence"), evidence: agentEvidenceSchema }),
  z.object({ type: z.literal("add-risk"), risk: riskSchema }),
  z.object({ type: z.literal("resolve-risk"), risk: riskSchema }),
])

export type ChangeOperation = z.infer<typeof changeOperationSchema>

export const changeSchema = z.object({
  id: z.string(),
  baseRevisionId: z.string(),
  request: z.string().min(1).max(500),
  summary: z.string().min(1).max(240),
  evidenceIds: z.array(z.string()),
  operations: z.array(changeOperationSchema).min(1).max(50),
  candidateHash: z.string().regex(/^[a-f0-9]{64}$/),
  readinessBefore: readinessSchema,
  readinessAfter: readinessSchema,
})

export type DesignChange = z.infer<typeof changeSchema>

const libFootprint = (identifier: string, reviewed = false) => ({
  source: "footprinter" as const,
  identifier,
  pads: [],
  reviewed,
})

const pins = (...labels: string[]) =>
  labels.map((label, index) => ({ number: `${index + 1}`, label }))

const bgaFootprint = (identifier: string, rows: number, columns: number, pitch: number) => ({
  source: "pad-map" as const,
  identifier,
  reviewed: false,
  pads: Array.from({ length: rows * columns }, (_, index) => ({
    type: "pcb_smtpad" as const,
    x: ((index % columns) - (columns - 1) / 2) * pitch,
    y: (Math.floor(index / columns) - (rows - 1) / 2) * pitch,
    layer: "top" as const,
    shape: "rect" as const,
    width: pitch * 0.48,
    height: pitch * 0.48,
    portHints: [`${index + 1}`],
  })),
})

const hdmiConnectorFootprint: BoardComponent["footprint"] = {
  source: "pad-map",
  identifier: "KiCad Connector_Video/HDMI_A_Amphenol_10029449-x01xLF_Horizontal",
  sha256: "1fa19576a91129d9dc87e7f837a8a8665289d1adca3aec62e1c6f454821b64bd",
  reviewed: false,
  pads: [
    ...Array.from({ length: 19 }, (_, index) => ({
      type: "pcb_smtpad" as const,
      x: 4.75 - index * 0.5,
      y: 5,
      layer: "top" as const,
      shape: "rect" as const,
      width: 0.3,
      height: 1.9,
      portHints: [`${index + 1}`],
    })),
    ...[
      [-7.85, -0.9],
      [-7.25, 4],
      [7.25, 4],
      [7.85, -0.9],
    ].map(([x, y]) => ({
      type: "pcb_plated_hole" as const,
      x,
      y,
      shape: "circle" as const,
      holeDiameter: 1.3,
      outerDiameter: 1.8,
      portHints: ["20"],
    })),
  ],
}

const usbCConnectorFootprint: BoardComponent["footprint"] = {
  source: "pad-map",
  identifier: "KiCad Connector_USB/USB_C_Receptacle_Molex_105450-0101",
  sha256: "4c0ad553929671d01ad6f9bd6c54004970e6482d62016af39fa7812d5c043540",
  reviewed: false,
  pads: [
    ...[-3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3].map((x, index) => ({
      type: "pcb_smtpad" as const,
      x,
      y: 3.215,
      layer: "top" as const,
      shape: "rect" as const,
      width: 0.3,
      height: 0.7,
      portHints: [`${index + 1}`],
    })),
    ...[3.1, 2.25, 1.75, 1.25, 0.75, 0.25, -0.25, -0.75, -1.25, -1.75, -2.25, -3.1].map(
      (x, index) => ({
        type: "pcb_smtpad" as const,
        x,
        y: 1.915,
        layer: "top" as const,
        shape: "rect" as const,
        width: index === 0 || index === 11 ? 1 : 0.3,
        height: 0.7,
        portHints: [`${index + 13}`],
      }),
    ),
    ...[
      [-4.32, 2.805, 2.1, 1.6],
      [-4.32, -2.555, 2.6, 2.1],
      [4.32, 2.805, 2.1, 1.6],
      [4.32, -2.555, 2.6, 2.1],
    ].map(([x, y, outerHeight, holeHeight]) => ({
      type: "pcb_plated_hole" as const,
      x,
      y,
      shape: "pill" as const,
      outerWidth: 1.1,
      outerHeight,
      holeWidth: 0.6,
      holeHeight,
      portHints: ["25"],
    })),
  ],
}

const indicatorEvidence: Evidence[] = [
  {
    id: "ev-led-datasheet",
    title: "Lite-On LTST-C170KGKT official datasheet",
    sourceUrl: "https://optoelectronics.liteon.com/upload/download/DS22-2000-073/LTST-C170KGKT.pdf",
    revision: "DS22-2000-073",
    kind: "datasheet",
    official: true,
    reviewed: true,
  },
  {
    id: "ev-resistor-datasheet",
    title: "Bourns CR series official datasheet",
    sourceUrl: "https://www.bourns.com/docs/product-datasheets/cr.pdf",
    kind: "datasheet",
    official: true,
    reviewed: true,
  },
  {
    id: "ev-connector-product",
    title: "Samtec TSW series official product page",
    sourceUrl: "https://www.samtec.com/products/tsw",
    kind: "datasheet",
    official: true,
    reviewed: true,
  },
]

export const indicatorSnapshot: DesignSnapshot = snapshotSchema.parse({
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
  evidence: indicatorEvidence,
  constraints: [],
  validationPlan: [],
  design: {
    board: {
      outline: { shape: "rectangle", widthMm: 25, heightMm: 15 },
      layers: 2,
      material: "fr4",
      thicknessMm: 1.6,
      solderMaskColor: "black",
      allowBlindAndBuriedVias: false,
      doubleSidedAssembly: false,
      stackup: ["Top copper", "FR-4 core", "Bottom copper"],
    },
    components: [
      {
        kind: "connector",
        reference: "J1",
        mpn: "TSW-102-07-G-S",
        manufacturer: "Samtec",
        value: "2-pin power input",
        pins: pins("VCC", "GND"),
        footprint: libFootprint("pinrow2", true),
        placement: { x: -9, y: 0, rotation: 90, side: "top" },
        reviewStatus: "reviewed",
        evidenceIds: ["ev-connector-product"],
        supplierPartIds: {},
        doNotPlace: false,
      },
      {
        kind: "resistor",
        reference: "R1",
        mpn: "CR0805-FX-1001ELF",
        manufacturer: "Bourns",
        value: "1k",
        pins: pins("A", "B"),
        footprint: libFootprint("0805", true),
        placement: { x: -3, y: 0, rotation: 0, side: "top" },
        reviewStatus: "reviewed",
        evidenceIds: ["ev-resistor-datasheet"],
        supplierPartIds: {},
        doNotPlace: false,
      },
      {
        kind: "led",
        reference: "D1",
        mpn: "LTST-C170KGKT",
        manufacturer: "Lite-On",
        value: "green",
        pins: pins("pos", "neg"),
        footprint: libFootprint("0805", true),
        placement: { x: 4, y: 0, rotation: 0, side: "top" },
        reviewStatus: "reviewed",
        evidenceIds: ["ev-led-datasheet"],
        supplierPartIds: {},
        doNotPlace: false,
      },
    ],
    nets: [
      { name: "VCC", members: ["J1.pin1", "R1.pin1"], className: "default" },
      { name: "LED", members: ["R1.pin2", "D1.pin1"], className: "default" },
      { name: "GND", members: ["D1.pin2", "J1.pin2"], className: "default" },
    ],
    netClasses: [{ name: "default", traceWidthMm: 0.25, clearanceMm: 0.2 }],
    differentialPairs: [],
    pours: [],
    holes: [],
    keepouts: [],
    routingHints: [],
  },
  unresolvedRisks: [],
})

const captureEvidence: Evidence[] = [
  {
    id: "ev-apple-external-camera",
    title: "Apple external camera documentation",
    sourceUrl:
      "https://developer.apple.com/documentation/avfoundation/avcapturedevice/devicetype-swift.struct/external",
    kind: "standard",
    official: true,
    reviewed: false,
  },
  {
    id: "ev-toshiba-tc358743",
    title: "Toshiba TC358743XBG official datasheet",
    sourceUrl:
      "https://toshiba.semicon-storage.com/info/TC358743XBG_datasheet_en_20260511.pdf?did=35655&prodName=TC358743XBG",
    revision: "Rev. 2.20",
    kind: "datasheet",
    official: true,
    reviewed: false,
  },
  {
    id: "ev-infineon-cx3",
    title: "Infineon CYUSB3065-BZXC official product page",
    sourceUrl: "https://www.infineon.com/part/CYUSB3065-BZXC",
    kind: "datasheet",
    official: true,
    reviewed: false,
  },
  {
    id: "ev-ti-usbc",
    title: "Texas Instruments USB-C protection and mux documentation",
    sourceUrl: "https://www.ti.com/product/HD3SS3212",
    kind: "datasheet",
    official: true,
    reviewed: false,
  },
  {
    id: "ev-infineon-power",
    title: "Infineon FX3/CX3 hardware design guidelines",
    sourceUrl:
      "https://www.infineon.com/dgdl/Infineon-AN70707_EZ-USB_FX3_FX3S_SX3_hardware_design_guidelines_and_schematic_checklist-ApplicationNotes-v18_00-EN.pdf?fileId=8ac78c8c7cdc391c017d0739793e5dfd",
    kind: "datasheet",
    official: true,
    reviewed: false,
  },
  {
    id: "ev-ecs-oscillators",
    title: "ECS 27 MHz and 19.2 MHz oscillator product documentation",
    sourceUrl: "https://ecsxtal.com/products/oscillators/surface-mount-oscillators/",
    kind: "datasheet",
    official: true,
    reviewed: false,
  },
]

const candidate = (
  reference: string,
  kind: BoardComponent["kind"],
  mpn: string,
  manufacturer: string,
  footprint: BoardComponent["footprint"],
  x: number,
  y: number,
  pinLabels: string[],
  evidenceIds: string[],
  rotation = 0,
): BoardComponent => ({
  kind,
  reference,
  mpn,
  manufacturer,
  pins: pins(...pinLabels),
  footprint,
  placement: { x, y, rotation, side: "top" },
  reviewStatus: "candidate",
  evidenceIds,
  supplierPartIds: {},
  doNotPlace: false,
})

const cx3PinLabels = Array.from({ length: 121 }, (_, index) => {
  const pin = index + 1
  return (
    {
      5: "TX_P_A5",
      6: "TX_M_A6",
      23: "SSN_C1",
      40: "CLKIN_D7",
      95: "CLK_P_J7",
      106: "CLK_N_K7",
    }[pin] ?? `P${pin}`
  )
})

const captureComponents: BoardComponent[] = [
  candidate(
    "J1",
    "connector",
    "10029449-101RLF",
    "Amphenol",
    hdmiConnectorFootprint,
    -30,
    21,
    [
      "TMDS2P",
      "TMDS2_SHIELD",
      "TMDS2N",
      "TMDS1P",
      "TMDS1_SHIELD",
      "TMDS1N",
      "TMDS0P",
      "TMDS0_SHIELD",
      "TMDS0N",
      "CLKP",
      "CLK_SHIELD",
      "CLKN",
      "CEC",
      "UTILITY",
      "DDC_SCL",
      "DDC_SDA",
      "GND",
      "V5",
      "HPD",
      "SHIELD",
    ],
    ["ev-toshiba-tc358743"],
  ),
  candidate(
    "U1",
    "chip",
    "TC358743XBG",
    "Toshiba",
    bgaFootprint("P-TFBGA64-0606-0.65-001", 8, 8, 0.65),
    -18,
    4,
    [
      "REXT",
      "VSS_A2",
      "VPGM",
      "BIASDA",
      "DAOUT",
      "PFIL",
      "CSID3N",
      "CSID3P",
      "AVDD33_B1",
      "AVDD12_B2",
      "INT",
      "IR",
      "AVDD25",
      "PCKIN",
      "CSID2N",
      "CSID2P",
      "HDMICP",
      "HDMICN",
      "VDDC2_C3",
      "VSS_C4",
      "VSS_C5",
      "VDD_MIPI_C6",
      "CSICN",
      "CSICP",
      "HDMID0P",
      "HDMID0N",
      "AVDD12_D3",
      "VSS_D4",
      "VSS_D5",
      "VSS_D6",
      "CSID1N",
      "CSID1P",
      "HDMID1P",
      "HDMID1N",
      "VSS_E3",
      "VSS_E4",
      "TEST",
      "VSS_E6",
      "CSID0N",
      "CSID0P",
      "HDMID2P",
      "HDMID2N",
      "AVDD33_F3",
      "VDDIO1",
      "VDDC2_F5",
      "VDD_MIPI_F6",
      "A_SCK",
      "A_SD",
      "CEC",
      "VDDC1",
      "DDC_SDA",
      "I2C_SDA",
      "RESETN",
      "EDID_SDA",
      "A_WFS",
      "A_OSCK",
      "HPDO",
      "HPDI",
      "DDC_SCL",
      "I2C_SCL",
      "REFCLK",
      "EDID_SCL",
      "VDDIO2",
      "VSS_H8",
    ],
    ["ev-toshiba-tc358743"],
  ),
  candidate(
    "U2",
    "chip",
    "CYUSB3065-BZXC",
    "Infineon",
    bgaFootprint("PG-LFBGA-121", 11, 11, 0.8),
    8,
    2,
    cx3PinLabels,
    ["ev-infineon-cx3", "ev-infineon-power"],
  ),
  candidate(
    "J2",
    "connector",
    "105450-0101",
    "Molex",
    usbCConnectorFootprint,
    30,
    21,
    [
      "A1_GND",
      "A2_TX1P",
      "A3_TX1N",
      "A4_VBUS",
      "A5_CC1",
      "A6_DP",
      "A7_DN",
      "A8_SBU1",
      "A9_VBUS",
      "A10_RX2N",
      "A11_RX2P",
      "A12_GND",
      "B1_GND",
      "B2_TX2P",
      "B3_TX2N",
      "B4_VBUS",
      "B5_CC2",
      "B6_DP",
      "B7_DN",
      "B8_SBU2",
      "B9_VBUS",
      "B10_RX1N",
      "B11_RX1P",
      "B12_GND",
      "SHIELD",
    ],
    ["ev-ti-usbc"],
  ),
  candidate(
    "U3",
    "chip",
    "HD3SS3212IRKSR",
    "Texas Instruments",
    libFootprint("qfn20"),
    24,
    12,
    [
      "A_TXP",
      "A_TXN",
      "B_TXP",
      "B_TXN",
      "RX_P",
      "RX_N",
      "SEL",
      "OE",
      "VCC",
      "GND",
      "P11",
      "P12",
      "P13",
      "P14",
      "P15",
      "P16",
      "P17",
      "P18",
      "P19",
      "P20",
    ],
    ["ev-ti-usbc"],
  ),
  candidate(
    "U4",
    "chip",
    "TUSB320LAIRWBR",
    "Texas Instruments",
    libFootprint("qfn12"),
    27,
    -9,
    ["CC1", "CC2", "DIR", "PORT", "VBUS", "VCC", "GND", "P8", "P9", "P10", "P11", "P12"],
    ["ev-ti-usbc"],
  ),
  candidate(
    "U5",
    "chip",
    "S25FL064LABMFB010",
    "Infineon",
    libFootprint("soic8"),
    8,
    -12,
    ["CS", "MISO", "WP", "GND", "MOSI", "SCK", "HOLD", "VCC"],
    ["ev-infineon-cx3"],
  ),
  candidate(
    "U6",
    "chip",
    "TPS62130ARGTR",
    "Texas Instruments",
    libFootprint("qfn16"),
    -5,
    -14,
    Array.from({ length: 16 }, (_, index) => `P${index + 1}`),
    ["ev-infineon-power"],
  ),
  candidate(
    "U7",
    "chip",
    "TPS62160DSGR",
    "Texas Instruments",
    libFootprint("qfn8"),
    -16,
    -14,
    Array.from({ length: 8 }, (_, index) => `P${index + 1}`),
    ["ev-infineon-power"],
  ),
  candidate(
    "U8",
    "chip",
    "TPS7A2025PDBVR",
    "Texas Instruments",
    libFootprint("sot23_5"),
    -25,
    -14,
    Array.from({ length: 5 }, (_, index) => `P${index + 1}`),
    ["ev-infineon-power"],
  ),
  candidate(
    "U9",
    "chip",
    "TPD12S520DBTR",
    "Texas Instruments",
    libFootprint("tssop38"),
    -24,
    11,
    Array.from({ length: 38 }, (_, index) => `P${index + 1}`),
    ["ev-ti-usbc", "ev-toshiba-tc358743"],
  ),
  candidate(
    "U10",
    "chip",
    "TPD1S514-1YZR",
    "Texas Instruments",
    libFootprint("qfn12"),
    31,
    -14,
    Array.from({ length: 12 }, (_, index) => `P${index + 1}`),
    ["ev-ti-usbc", "ev-infineon-power"],
  ),
  candidate(
    "U11",
    "chip",
    "TPS259531DSGR",
    "Texas Instruments",
    libFootprint("qfn8"),
    20,
    -15,
    Array.from({ length: 8 }, (_, index) => `P${index + 1}`),
    ["ev-infineon-power"],
  ),
  candidate(
    "U12",
    "chip",
    "TPS3808G01DBVR",
    "Texas Instruments",
    libFootprint("sot23_6"),
    8,
    14,
    Array.from({ length: 6 }, (_, index) => `P${index + 1}`),
    ["ev-infineon-power"],
  ),
  candidate(
    "U13",
    "chip",
    "SN74LVC2G17DBVR",
    "Texas Instruments",
    libFootprint("sot23_6"),
    -7,
    -7,
    Array.from({ length: 6 }, (_, index) => `P${index + 1}`),
    ["ev-infineon-cx3"],
  ),
  candidate(
    "U14",
    "chip",
    "TPD2S300YFFR",
    "Texas Instruments",
    libFootprint("qfn9"),
    32,
    -7,
    Array.from({ length: 9 }, (_, index) => `P${index + 1}`),
    ["ev-ti-usbc"],
  ),
  candidate(
    "U15",
    "chip",
    "TPS62160DSGR",
    "Texas Instruments",
    libFootprint("qfn8"),
    -16,
    -8,
    Array.from({ length: 8 }, (_, index) => `P${index + 1}`),
    ["ev-infineon-power"],
  ),
  ...Array.from({ length: 5 }, (_, index) =>
    candidate(
      `D${index + 1}`,
      "chip",
      "ESD122DMXR",
      "Texas Instruments",
      libFootprint("qfn3"),
      15 + index * 4,
      0,
      ["IO1", "GND", "IO2"],
      ["ev-ti-usbc"],
    ),
  ),
  candidate(
    "Y1",
    "crystal",
    "ECS-2520MV-270-CN-TR",
    "ECS",
    libFootprint("qfn4"),
    -18,
    10,
    ["EN", "GND", "OUT", "VCC"],
    ["ev-toshiba-tc358743", "ev-ecs-oscillators"],
  ),
  candidate(
    "Y2",
    "crystal",
    "ECS-2520MVLC-192-BN-TR",
    "ECS",
    libFootprint("qfn4"),
    7,
    -6,
    ["EN", "GND", "OUT", "VCC"],
    ["ev-infineon-cx3", "ev-ecs-oscillators"],
  ),
  candidate(
    "TP1",
    "testpoint",
    "5015",
    "Keystone",
    libFootprint("testpoint"),
    -5,
    15,
    ["TP"],
    ["ev-infineon-power"],
  ),
  candidate(
    "TP2",
    "testpoint",
    "5015",
    "Keystone",
    libFootprint("testpoint"),
    5,
    15,
    ["TP"],
    ["ev-infineon-power"],
  ),
]

export const captureBridgeSnapshot: DesignSnapshot = snapshotSchema.parse({
  requirements: [
    {
      id: "req-video-only",
      label: "Video-only unprotected-HDMI prototype",
      value: "1080p30 YCbCr 4:2:2 to UVC; no audio, HDCP, or simultaneous charging claim",
      required: true,
      status: "verified",
      evidenceIds: ["ev-toshiba-tc358743", "ev-infineon-cx3"],
    },
    {
      id: "req-host",
      label: "Exact iPhone transport and iOS version",
      value: "SeeMo-class compressed-video accessory path is not yet proven",
      required: true,
      status: "blocked",
      evidenceIds: ["ev-apple-external-camera"],
    },
    {
      id: "req-mode",
      label: "Measured HDMI-to-UVC video mode",
      value: "Candidate 1080p30",
      required: true,
      status: "blocked",
      evidenceIds: [],
    },
    {
      id: "req-power",
      label: "Measured USB-C power budget",
      required: true,
      status: "blocked",
      evidenceIds: ["ev-infineon-power"],
    },
  ],
  architecture: [
    "Clean non-HDCP HDMI → TC358743XBG → four-lane MIPI CSI-2 → CYUSB3065-BZXC",
    "CYUSB3065 UVC output → HD3SS3212 mux → USB-C UVC comparison path",
    "Final iPhone path requires proven video compression and app-compatible accessory transport",
    "USB-C VBUS protection → current limit → 1.2 V / 1.8 V / 3.3 V → 2.5 V analog rail",
  ],
  evidence: captureEvidence,
  constraints: [
    "Engineering candidate eight-layer stack; fabricator must approve final geometry.",
    "USB SuperSpeed 90 Ω differential; MIPI CSI-2 100 Ω differential.",
    "No high-speed probe stubs; expose only rail and low-speed test points.",
    "Video only: TC358743 and CX3 audio interfaces are both outputs and must not be connected.",
  ],
  validationPlan: [
    "Resolve the 1.6 mm HDMI versus 0.8 mm USB-C connector thickness conflict.",
    "Run regulator transient SPICE with vendor models and the CX3 PHY startup load.",
    "Run HDMI, MIPI, and USB channel analysis with the approved stackup and public models.",
    "Prove the final transport on the exact iPhone, iOS, cable, and PocketRoar app; UVC comparison results are not sufficient.",
    "Measure HDMI lock, CSI counters, UVC enumeration, reconnect, thermal behavior, and five-hour soak.",
    "Review stackup, impedance, power integrity, return paths, EMI/ESD, enclosure, licensing, and DFM.",
  ],
  design: {
    board: {
      outline: { shape: "rectangle", widthMm: 100, heightMm: 60 },
      layers: 8,
      material: "fr4",
      thicknessMm: 1.6,
      solderMaskColor: "black",
      allowBlindAndBuriedVias: true,
      isViaInPadAllowed: true,
      doubleSidedAssembly: false,
      stackup: ["Signal", "Ground", "Signal", "Power", "Power", "Signal", "Ground", "Signal"],
    },
    components: captureComponents,
    nets: [
      { name: "HDMI_D0_P", members: ["J1.pin7", "U1.pin25"], className: "hdmi" },
      {
        name: "HDMI_D0_N",
        members: ["J1.pin9", "U1.pin26"],
        className: "hdmi",
        pcbPath: [
          { x: 0.75, y: -2 },
          { x: 0.75, y: -3 },
          { x: 0.75, y: -3, via: true, toLayer: "inner1" },
          { x: 0.75, y: -3 },
          { x: 9, y: -14 },
          { x: 10.375, y: -17.325 },
          { x: 10.375, y: -17.325, via: true, toLayer: "top" },
          { x: 10.375, y: -17.325 },
        ],
      },
      {
        name: "CSI_CLK_P",
        members: ["U1.pin24", "U2.pin95"],
        className: "mipi",
        pcbPath: [
          { x: 2.275, y: -0.975 },
          { x: 2.275, y: -0.975, via: true, toLayer: "inner2" },
          { x: 2.275, y: -0.975 },
          { x: 6, y: -1.6 },
          { x: 22, y: -0.3 },
          { x: 26.8, y: 0.4 },
          { x: 26.8, y: 0.4, via: true, toLayer: "top" },
          { x: 26.8, y: 0.4 },
        ],
      },
      {
        name: "CSI_CLK_N",
        members: ["U1.pin23", "U2.pin106"],
        className: "mipi",
        pcbPath: [
          { x: 1.625, y: -0.975 },
          { x: 1.625, y: -0.975, via: true, toLayer: "inner3" },
          { x: 1.625, y: -0.975 },
          { x: 6, y: -2 },
          { x: 22, y: 0.5 },
          { x: 26.8, y: 1.2 },
          { x: 26.8, y: 1.2, via: true, toLayer: "top" },
          { x: 26.8, y: 1.2 },
        ],
      },
      { name: "USB_TX_P", members: ["U2.pin5", "U3.pin1"], className: "usb3" },
      { name: "USB_TX_N", members: ["U2.pin6", "U3.pin2"], className: "usb3" },
      { name: "SPI_CS", members: ["U2.pin23", "U5.pin1"], className: "default" },
      { name: "CLK27", members: ["Y1.pin3", "U1.pin61"], className: "clock" },
      { name: "CLK19", members: ["Y2.pin3", "U2.pin40"], className: "clock" },
      { name: "V12_TEST", members: ["U6.pin1", "TP1.pin1"], className: "power" },
      { name: "V33_TEST", members: ["U7.pin1", "TP2.pin1"], className: "power" },
    ],
    netClasses: [
      { name: "default", traceWidthMm: 0.15, clearanceMm: 0.15 },
      { name: "power", traceWidthMm: 0.5, clearanceMm: 0.2 },
      { name: "clock", traceWidthMm: 0.15, clearanceMm: 0.18 },
      { name: "hdmi", traceWidthMm: 0.12, clearanceMm: 0.12, targetImpedanceOhms: 100 },
      { name: "mipi", traceWidthMm: 0.1, clearanceMm: 0.1, targetImpedanceOhms: 100 },
      { name: "usb3", traceWidthMm: 0.12, clearanceMm: 0.12, targetImpedanceOhms: 90 },
    ],
    differentialPairs: [
      {
        name: "HDMI_D0",
        positiveNet: "HDMI_D0_P",
        negativeNet: "HDMI_D0_N",
        targetImpedanceOhms: 100,
        maxSkewMm: 0.5,
      },
      {
        name: "CSI_CLK",
        positiveNet: "CSI_CLK_P",
        negativeNet: "CSI_CLK_N",
        targetImpedanceOhms: 100,
        maxSkewMm: 0.5,
      },
      {
        name: "USB_TX",
        positiveNet: "USB_TX_P",
        negativeNet: "USB_TX_N",
        targetImpedanceOhms: 90,
        maxSkewMm: 0.25,
      },
    ],
    pours: [],
    holes: [
      { id: "mount-1", x: -45, y: -25, diameterMm: 3.2, plated: false },
      { id: "mount-2", x: 45, y: -25, diameterMm: 3.2, plated: false },
    ],
    keepouts: [],
    routingHints: ["Route all named differential pairs before low-speed control nets."],
  },
  unresolvedRisks: [
    "The selected HDMI and USB-C connectors require incompatible PCB thicknesses.",
    "The published Toshiba material omits the complete register map, startup sequence, decoupling network, and reference design.",
    "TC358743 EDID, HPD, register programming, sequencing, and recovery are not frozen.",
    "TC358743-to-CX3 timing and the target 1080p30 mode are unmeasured.",
    "USB-C current policy and CX3 1.2 V startup transient are unverified.",
    "Order-specific stackup, SI/DFM, licensing, thermal, EMI/ESD, and enclosure mechanics remain open.",
    "The 0.65 mm BGA escape requires a fabricator-approved filled and capped via-in-pad process.",
    "Exact iPhone transport, decoding, app integration, and compatibility require physical-device proof.",
  ],
})

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

function structuralErrors(snapshot: DesignSnapshot): string[] {
  if (!snapshot.design) return ["No compilable BoardGraph exists."]
  const parsed = boardGraphSchema.safeParse(snapshot.design)
  if (!parsed.success) return parsed.error.issues.map(({ message }) => message)
  return []
}

export function validateSnapshot(snapshot: DesignSnapshot): Validation {
  const errors = structuralErrors(snapshot)
  if (errors.length)
    return {
      status: "blocked",
      readiness: "blocked",
      errors,
      warnings: [],
      checkedAt: new Date().toISOString(),
    }
  const design = snapshot.design
  if (!design)
    return {
      status: "blocked",
      readiness: "blocked",
      errors: ["No compilable BoardGraph exists."],
      warnings: [],
      checkedAt: new Date().toISOString(),
    }
  const warnings: string[] = []
  const evidenceIds = new Set(snapshot.evidence.map(({ id }) => id))
  for (const requirement of snapshot.requirements) {
    if (requirement.required && requirement.status !== "verified")
      warnings.push(`Required input is ${requirement.status}: ${requirement.label}`)
    for (const evidenceId of requirement.evidenceIds) {
      if (!evidenceIds.has(evidenceId))
        warnings.push(`Requirement ${requirement.id} references missing evidence ${evidenceId}.`)
    }
  }
  for (const component of design.components) {
    if (component.reviewStatus !== "reviewed")
      warnings.push(`${component.reference} is not human-reviewed.`)
    if (!component.footprint.reviewed)
      warnings.push(`${component.reference} footprint is not human-reviewed.`)
    const hasReviewedOfficialEvidence = component.evidenceIds.some((id) =>
      snapshot.evidence.some((item) => item.id === id && item.official && item.reviewed),
    )
    if (!hasReviewedOfficialEvidence)
      warnings.push(`${component.reference} lacks reviewed official evidence.`)
    for (const evidenceId of component.evidenceIds) {
      if (!evidenceIds.has(evidenceId))
        warnings.push(`${component.reference} references missing evidence ${evidenceId}.`)
    }
  }
  if (design.differentialPairs.length) {
    warnings.push(
      "Differential-pair impedance, coupling, and routed-length skew are recorded constraints but are not verified by the current compiler.",
    )
  }
  warnings.push(...snapshot.unresolvedRisks.map((risk) => `Unresolved risk: ${risk}`))
  return {
    status: "passed",
    readiness: warnings.length ? "engineering" : "fabrication-ready",
    errors: [],
    warnings,
    checkedAt: new Date().toISOString(),
  }
}

export async function computeRevisionId(
  parentId: string | null,
  summary: string,
  snapshot: DesignSnapshot,
): Promise<string> {
  const parsed = snapshotSchema.parse(snapshot)
  return (await sha256(stableStringify({ parentId, summary, snapshot: parsed }))).slice(0, 16)
}

export async function createRevision(
  parentId: string | null,
  summary: string,
  snapshot: DesignSnapshot,
): Promise<Revision> {
  const parsed = snapshotSchema.parse(snapshot)
  const id = await computeRevisionId(parentId, summary, parsed)
  return {
    id,
    parentId,
    summary,
    createdAt: new Date().toISOString(),
    snapshot: structuredClone(parsed),
    validation: {
      status: "not-run",
      readiness: validateSnapshot(parsed).readiness,
      errors: [],
      warnings: [],
    },
  }
}

export async function createProject(
  id: string,
  name: string,
  snapshot: DesignSnapshot,
): Promise<BoardProject> {
  const revision = await createRevision(null, "Initial design", snapshot)
  return boardProjectSchema.parse({
    schemaVersion: 2,
    id,
    name,
    currentRevisionId: revision.id,
    revisions: [revision],
  })
}

export function currentRevision(project: BoardProject): Revision {
  const revision = project.revisions.find(({ id }) => id === project.currentRevisionId)
  if (!revision) throw new Error("Current revision is missing")
  return revision
}

const upsert = <T>(items: T[], next: T, key: (item: T) => string): T[] => {
  const index = items.findIndex((item) => key(item) === key(next))
  if (index < 0) return [...items, next]
  return items.map((item, itemIndex) => (itemIndex === index ? next : item))
}

export function applyOperations(
  snapshot: DesignSnapshot,
  operations: ChangeOperation[],
): DesignSnapshot {
  const next = structuredClone(snapshot)
  if (!next.design) throw new Error("The revision has no board to change.")
  for (const raw of operations) {
    const operation = changeOperationSchema.parse(raw)
    switch (operation.type) {
      case "set-board":
        next.design.board = operation.board
        break
      case "upsert-component":
        next.design.components = upsert(
          next.design.components,
          operation.component,
          (item) => item.reference,
        )
        break
      case "remove-component":
        next.design.components = next.design.components.filter(
          ({ reference }) => reference !== operation.reference,
        )
        break
      case "move-component": {
        const component = next.design.components.find(
          ({ reference }) => reference === operation.reference,
        )
        if (!component) throw new Error(`Component ${operation.reference} does not exist.`)
        component.placement = {
          x: operation.x,
          y: operation.y,
          rotation: operation.rotation,
          side: operation.side,
        }
        break
      }
      case "upsert-net":
        next.design.nets = upsert(next.design.nets, operation.net, (item) => item.name)
        break
      case "remove-net":
        next.design.nets = next.design.nets.filter(({ name }) => name !== operation.name)
        break
      case "upsert-differential-pair":
        next.design.differentialPairs = upsert(
          next.design.differentialPairs,
          operation.pair,
          (item) => item.name,
        )
        break
      case "remove-differential-pair":
        next.design.differentialPairs = next.design.differentialPairs.filter(
          ({ name }) => name !== operation.name,
        )
        break
      case "upsert-pour":
        next.design.pours = upsert(next.design.pours, operation.pour, (item) => item.id)
        break
      case "remove-pour":
        next.design.pours = next.design.pours.filter(({ id }) => id !== operation.id)
        break
      case "upsert-hole":
        next.design.holes = upsert(next.design.holes, operation.hole, (item) => item.id)
        break
      case "remove-hole":
        next.design.holes = next.design.holes.filter(({ id }) => id !== operation.id)
        break
      case "upsert-keepout":
        next.design.keepouts = upsert(next.design.keepouts, operation.keepout, (item) => item.id)
        break
      case "remove-keepout":
        next.design.keepouts = next.design.keepouts.filter(({ id }) => id !== operation.id)
        break
      case "update-requirement":
        next.requirements = upsert(next.requirements, operation.requirement, (item) => item.id)
        break
      case "upsert-evidence":
        next.evidence = upsert(
          next.evidence,
          { ...operation.evidence, reviewed: false },
          (item) => item.id,
        )
        break
      case "add-risk":
        if (!next.unresolvedRisks.includes(operation.risk))
          next.unresolvedRisks.push(operation.risk)
        break
      case "resolve-risk":
        next.unresolvedRisks = next.unresolvedRisks.filter((risk) => risk !== operation.risk)
        break
    }
  }
  return snapshotSchema.parse(next)
}

export async function previewChange(
  project: BoardProject,
  revisionId: string,
  request: string,
  operations: ChangeOperation[],
): Promise<DesignChange> {
  const revision = project.revisions.find(({ id }) => id === revisionId)
  if (!revision) throw new Error("Revision not found")
  const parsedOperations = z.array(changeOperationSchema).min(1).max(50).parse(operations)
  const candidate = applyOperations(revision.snapshot, parsedOperations)
  const candidateHash = await sha256(stableStringify(candidate))
  const id = (
    await sha256(stableStringify({ revisionId, request, parsedOperations, candidateHash }))
  ).slice(0, 16)
  return {
    id,
    baseRevisionId: revisionId,
    request,
    summary: parsedOperations
      .map(({ type }) => type)
      .join(", ")
      .slice(0, 240),
    evidenceIds: candidate.evidence.map(({ id: evidenceId }) => evidenceId),
    operations: parsedOperations,
    candidateHash,
    readinessBefore: validateSnapshot(revision.snapshot).readiness,
    readinessAfter: validateSnapshot(candidate).readiness,
  }
}

export async function applyChange(
  project: BoardProject,
  change: DesignChange,
): Promise<BoardProject> {
  const parsed = changeSchema.parse(change)
  if (project.currentRevisionId !== parsed.baseRevisionId)
    throw new Error("Change is stale; preview it again from the current revision.")
  const snapshot = applyOperations(currentRevision(project).snapshot, parsed.operations)
  const candidateHash = await sha256(stableStringify(snapshot))
  if (candidateHash !== parsed.candidateHash)
    throw new Error("Preview candidate hash does not match.")
  const revision = await createRevision(project.currentRevisionId, parsed.summary, snapshot)
  return boardProjectSchema.parse({
    ...project,
    currentRevisionId: revision.id,
    revisions: [...project.revisions, revision].slice(-30),
  })
}

export function withValidation(project: BoardProject, validation: Validation): BoardProject {
  return boardProjectSchema.parse({
    ...project,
    revisions: project.revisions.map((revision) =>
      revision.id === project.currentRevisionId ? { ...revision, validation } : revision,
    ),
  })
}

export function sanitizeAgentSnapshot(snapshot: DesignSnapshot): DesignSnapshot {
  const next = structuredClone(snapshotSchema.parse(snapshot))
  next.evidence = next.evidence.map((evidence) => ({ ...evidence, reviewed: false }))
  if (next.design) {
    next.design.components = next.design.components.map((component) => ({
      ...component,
      reviewStatus: "candidate",
      footprint: { ...component.footprint, reviewed: false },
    }))
  }
  return next
}

export function sanitizeAgentOperations(operations: ChangeOperation[]): ChangeOperation[] {
  return operations.map((operation) => {
    if (operation.type === "upsert-component")
      return {
        ...operation,
        component: {
          ...operation.component,
          reviewStatus: "candidate" as const,
          footprint: { ...operation.component.footprint, reviewed: false },
        },
      }
    if (operation.type === "update-requirement")
      return {
        ...operation,
        requirement: { ...operation.requirement, status: "unverified" as const },
      }
    return operation
  })
}

export function createRequirementsSnapshot(requirements: string): DesignSnapshot {
  return snapshotSchema.parse({
    requirements: [
      {
        id: "req-brief",
        label: "Structured board design",
        value: requirements,
        required: true,
        status: "blocked",
        evidenceIds: [],
      },
    ],
    architecture: ["A BoardGraph must be supplied by the browser agent or manual JSON editor."],
    evidence: [],
    constraints: [],
    validationPlan: ["Provide exact parts, pins, nets, footprints, placement, and evidence."],
    unresolvedRisks: ["No structured board design has been supplied."],
  })
}

export function createDraftSnapshot(requirements: string, design?: BoardGraph): DesignSnapshot {
  if (!design) return createRequirementsSnapshot(requirements)
  return sanitizeAgentSnapshot(
    snapshotSchema.parse({
      requirements: [
        {
          id: "req-brief",
          label: "Agent-supplied custom board brief",
          value: requirements,
          required: true,
          status: "unverified",
          evidenceIds: [],
        },
      ],
      architecture: ["Custom BoardGraph supplied through the shared RoarCAD design seam."],
      evidence: [],
      constraints: [],
      validationPlan: [
        "Review exact parts, footprints, evidence, checks, and physical risks before fabrication.",
      ],
      design,
      unresolvedRisks: [
        "Agent-supplied requirements, parts, footprints, and evidence require visible human review.",
      ],
    }),
  )
}

export async function applyHumanReview(
  project: BoardProject,
  target: {
    requirementId?: string
    evidenceId?: string
    componentReference?: string
    footprintReference?: string
  },
): Promise<BoardProject> {
  const snapshot = structuredClone(currentRevision(project).snapshot)
  if (target.requirementId) {
    const requirement = snapshot.requirements.find(({ id }) => id === target.requirementId)
    if (!requirement) throw new Error("Requirement not found.")
    requirement.status = "verified"
  }
  if (target.evidenceId) {
    const evidence = snapshot.evidence.find(({ id }) => id === target.evidenceId)
    if (!evidence) throw new Error("Evidence not found.")
    evidence.reviewed = true
  }
  if (target.componentReference || target.footprintReference) {
    if (!snapshot.design) throw new Error("The revision has no BoardGraph.")
    const reference = target.componentReference ?? target.footprintReference
    const component = snapshot.design.components.find((item) => item.reference === reference)
    if (!component) throw new Error("Component not found.")
    if (target.componentReference) component.reviewStatus = "reviewed"
    if (target.footprintReference) component.footprint.reviewed = true
  }
  const label =
    target.requirementId ??
    target.evidenceId ??
    target.componentReference ??
    target.footprintReference
  const revision = await createRevision(
    project.currentRevisionId,
    `Human review: ${label}`,
    snapshot,
  )
  return boardProjectSchema.parse({
    ...project,
    currentRevisionId: revision.id,
    revisions: [...project.revisions, revision].slice(-30),
  })
}

type V1Project = {
  schemaVersion: 1
  id: string
  name: string
  currentRevisionId: string
  revisions: Array<{ snapshot?: unknown }>
}

export async function importProject(source: string): Promise<BoardProject> {
  const raw = JSON.parse(source) as unknown
  const parsed = boardProjectSchema.safeParse(raw)
  if (parsed.success) return parsed.data
  const legacy = raw as V1Project
  if (legacy?.schemaVersion !== 1) throw parsed.error
  const capture = /capture|pocketroar/i.test(`${legacy.id} ${legacy.name}`)
  return createProject(legacy.id, legacy.name, capture ? captureBridgeSnapshot : indicatorSnapshot)
}
