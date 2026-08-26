import { type BoardGraph, boardGraphSchema } from "./domain"

export const environmentMonitorRequirements =
  "Create a compact 3.3 V I2C temperature and humidity sensor breakout with a four-pin host connector and local decoupling."

export const environmentMonitorGraph: BoardGraph = boardGraphSchema.parse({
  board: {
    outline: { shape: "rectangle", widthMm: 30, heightMm: 20 },
    layers: 2,
    material: "fr4",
    thicknessMm: 1.6,
    solderMaskColor: "green",
    allowBlindAndBuriedVias: false,
    doubleSidedAssembly: false,
    stackup: ["Top copper", "FR-4 core", "Bottom copper"],
  },
  components: [
    {
      kind: "connector",
      reference: "J1",
      mpn: "SM04B-SRSS-TB(LF)(SN)",
      manufacturer: "JST",
      value: "I2C host",
      pins: [
        { number: "1", label: "GND" },
        { number: "2", label: "VCC" },
        { number: "3", label: "SDA" },
        { number: "4", label: "SCL" },
      ],
      footprint: { source: "footprinter", identifier: "pinrow4", pads: [], reviewed: false },
      placement: { x: -10, y: 0, rotation: 90, side: "top" },
      reviewStatus: "candidate",
      evidenceIds: ["candidate-jst-drawing"],
      supplierPartIds: {},
      doNotPlace: false,
    },
    {
      kind: "chip",
      reference: "U1",
      mpn: "SHT40-AD1B-R2",
      manufacturer: "Sensirion",
      value: "Temperature and humidity sensor",
      pins: [
        { number: "1", label: "SDA" },
        { number: "2", label: "SCL" },
        { number: "3", label: "VDD" },
        { number: "4", label: "VSS" },
      ],
      footprint: { source: "footprinter", identifier: "qfn4", pads: [], reviewed: false },
      placement: { x: 2, y: 0, rotation: 0, side: "top" },
      reviewStatus: "candidate",
      evidenceIds: ["candidate-sht40-datasheet"],
      supplierPartIds: {},
      doNotPlace: false,
    },
    {
      kind: "capacitor",
      reference: "C1",
      mpn: "GRM188R71C104KA01D",
      manufacturer: "Murata",
      value: "100nF",
      pins: [
        { number: "1", label: "A" },
        { number: "2", label: "B" },
      ],
      footprint: { source: "footprinter", identifier: "0603", pads: [], reviewed: false },
      placement: { x: 7, y: -2, rotation: 0, side: "top" },
      reviewStatus: "candidate",
      evidenceIds: ["candidate-murata-datasheet"],
      supplierPartIds: {},
      doNotPlace: false,
    },
  ],
  nets: [
    { name: "GND", members: ["J1.pin1", "U1.pin4", "C1.pin2"], className: "default" },
    { name: "VCC", members: ["J1.pin2", "U1.pin3", "C1.pin1"], className: "power" },
    { name: "SDA", members: ["J1.pin3", "U1.pin1"], className: "default" },
    { name: "SCL", members: ["J1.pin4", "U1.pin2"], className: "default" },
  ],
  netClasses: [
    { name: "default", traceWidthMm: 0.2, clearanceMm: 0.2 },
    { name: "power", traceWidthMm: 0.4, clearanceMm: 0.2 },
  ],
  differentialPairs: [],
  pours: [],
  holes: [
    { id: "mount-left", x: -12, y: -7, diameterMm: 2.5, plated: false },
    { id: "mount-right", x: 12, y: -7, diameterMm: 2.5, plated: false },
  ],
  keepouts: [],
  routingHints: ["Keep U1 exposed to airflow and place C1 close to U1 VDD/VSS."],
})
