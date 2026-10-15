import { Circuit, emitCompare, emitSelect, emitMinimumExact, emitClampExact, type Wire, type Relation } from './hw'

export type Built = { circuit: Circuit, inputs: Record<string, Wire>, outputs: Record<string, Wire> }

/** README example: `a > 4 ? 10 : 12` as relu(a - 4) - relu(a - 5), then a select. */
export function buildSoftSwitch(): Built {
  const circuit = new Circuit(3)
  const a = circuit.source(0), hi = circuit.source(1), lo = circuit.source(2)
  const r1 = circuit.reglu([], 1, [[a, 1]], -4) // relu(a - 4)
  const r2 = circuit.reglu([], 1, [[a, 1]], -5) // relu(a - 5)
  const above4 = circuit.roundAffine([[r1, 1], [r2, -1]])
  const result = emitSelect(circuit, above4, lo, hi)
  return { circuit, inputs: { a, hi, lo }, outputs: { r1, r2, above4, result } }
}

/** emitCompare + emitSelect + emitMinimumExact over two declared inputs. */
export function buildCompare(relation: Relation, grid: boolean, max = 1024): Built {
  const circuit = new Circuit(2)
  const a = circuit.source(0), b = circuit.source(1)
  circuit.assumeRange(a, 0, max)
  circuit.assumeRange(b, 0, max)
  if (grid) { circuit.assumeGrid(a, 1); circuit.assumeGrid(b, 1) }
  const bit = emitCompare(circuit, a, relation, b)
  const picked = emitSelect(circuit, bit, b, a) // bit ? a : b
  const min = emitMinimumExact(circuit, a, b)
  return { circuit, inputs: { a, b }, outputs: { bit, picked, min } }
}

/** Math.min(Math.max(x, lo), hi) as an exact clamp. */
export function buildClamp(): Built {
  const circuit = new Circuit(3)
  const x = circuit.source(0), lo = circuit.source(1), hi = circuit.source(2)
  for (const w of [x, lo, hi]) { circuit.assumeRange(w, 0, 256); circuit.assumeGrid(w, 1) }
  const clamped = emitClampExact(circuit, x, lo, hi)
  return { circuit, inputs: { x, lo, hi }, outputs: { clamped } }
}

/** The soft switch with its constants unfrozen: threshold t, slope k, hi and lo are cells. */
export function buildTrainable(): Built {
  const circuit = new Circuit(5)
  const a = circuit.source(0), t = circuit.source(1), k = circuit.source(2), hi = circuit.source(3), lo = circuit.source(4)
  const shifted = circuit.affine([[a, 1], [t, -1]]) // a - t
  const u = circuit.multiply(k, shifted) // k × (a - t)
  const r1 = circuit.reglu([], 1, [[u, 1]], 0)
  const r2 = circuit.reglu([], 1, [[u, 1]], -1)
  const s = circuit.affine([[r1, 1], [r2, -1]]) // clamp(u, 0, 1)
  const y = emitSelect(circuit, s, lo, hi)
  return { circuit, inputs: { a, t, k, hi, lo }, outputs: { s, y } }
}

export function evaluate(built: Built, values: Record<string, number>): Float32Array {
  const source = new Float32Array(built.circuit.sourceSize)
  for (const [name, wire] of Object.entries(built.inputs)) source[wire] = values[name] ?? 0
  return built.circuit.evaluateReference(source)
}

export function stats(circuit: Circuit) {
  const layers = circuit.operations.reduce((m, op) => Math.max(m, op.depth), 0)
  const kinds: Record<string, number> = {}
  for (const p of circuit.roundingPoints()) kinds[p.kind] = (kinds[p.kind] ?? 0) + 1
  return { operations: circuit.operations.length, layers, roundingPoints: kinds }
}
