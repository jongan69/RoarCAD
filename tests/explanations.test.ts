import { expect, test } from "bun:test"
import { componentSchema } from "../src/domain"
import { componentDefinition } from "../src/explanations"

test("every supported part kind has a plain-English definition", () => {
  const kinds = componentSchema.shape.kind.options
  for (const kind of kinds) {
    const definition = componentDefinition(kind)
    expect(definition.length).toBeGreaterThan(20)
    expect(definition).not.toContain("R1")
  }
})
