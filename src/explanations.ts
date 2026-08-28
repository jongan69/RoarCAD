import type { BoardComponent } from "./domain"

const componentDefinitions: Record<BoardComponent["kind"], string> = {
  resistor:
    "A resistor limits current or helps set a voltage. Its exact job depends on the connections around it.",
  capacitor:
    "A capacitor briefly stores electrical energy and often helps keep power or signals steady.",
  inductor:
    "An inductor stores energy in a magnetic field and is often used in power conversion or filtering.",
  diode:
    "A diode mainly lets current travel in one direction and can protect a circuit from harmful voltage.",
  led: "An LED is a diode that produces light when current flows through it in the correct direction.",
  transistor:
    "A transistor uses a small electrical signal to switch or control a larger electrical signal.",
  mosfet:
    "A MOSFET is an efficient electronic switch commonly used to control power or fast signals.",
  fuse: "A fuse opens the circuit when too much current flows, helping limit damage from a fault.",
  crystal:
    "A crystal or oscillator provides a precise repeating clock that keeps digital parts working in time.",
  connector:
    "A connector is the physical place where power or signals enter, leave, or attach to another device.",
  switch: "A switch opens or closes an electrical path in response to a person or control signal.",
  testpoint:
    "A test point gives an engineer a safe place to measure a signal or power rail during testing.",
  chip: "A chip combines many tiny electronic circuits to perform a larger job such as processing video or managing power.",
}

export function componentDefinition(kind: BoardComponent["kind"]): string {
  return componentDefinitions[kind]
}
