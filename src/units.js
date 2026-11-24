// A light copy of the server's unit reading (supabase _shared/bakery.ts), only to show units cancelling while a
// student types. The server does the real grading.
const ALIASES = {
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  g: 'g', gram: 'g', grams: 'g',
  mg: 'mg', milligram: 'mg', milligrams: 'mg',
  ug: 'µg', 'µg': 'µg', 'μg': 'µg', mcg: 'µg', microgram: 'µg', micrograms: 'µg',
  l: 'L', liter: 'L', liters: 'L', litre: 'L', litres: 'L',
  dl: 'dL', ml: 'mL', milliliter: 'mL', milliliters: 'mL', cc: 'mL', cm3: 'mL',
  ul: 'µL', 'µl': 'µL', 'μl': 'µL', microliter: 'µL', microliters: 'µL',
  mol: 'mol', mole: 'mol', moles: 'mol', mols: 'mol',
  mmol: 'mmol', millimole: 'mmol', millimoles: 'mmol',
  molecule: 'molecules', molecules: 'molecules', particle: 'molecules', particles: 'molecules',
  atom: 'molecules', atoms: 'molecules', ion: 'molecules', ions: 'molecules', 'formula units': 'molecules', 'formula unit': 'molecules',
}
const sub = (text) => text.replace(/[\s()]/g, '').toLowerCase()

// "g NaCl" -> { sym: 'g', sub: 'nacl', label: 'g NaCl' } (null if it isn't a unit we know)
export function readUnit(raw) {
  const text = String(raw ?? '').trim().replace(/\s+/g, ' ').replace(/\bof\b/gi, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return null
  const lower = text.toLowerCase()
  for (const two of ['formula units', 'formula unit']) {
    if (lower.startsWith(two)) return { sym: 'molecules', sub: sub(text.slice(two.length)) || null, label: text }
  }
  const [first, ...rest] = text.split(' ')
  const sym = ALIASES[first] ?? ALIASES[first.toLowerCase()]
  if (!sym) return null
  return { sym, sub: sub(rest.join(' ')) || null, label: text }
}

// The order's substances: with exactly one, a unit without a substance means that one
export function unitKey(u, substances) {
  if (!u) return null
  const only = substances.length === 1 ? sub(substances[0]) : null
  return `${u.sym}|${u.sub ?? only ?? ''}`
}

// Which units cancel: returns { start: bool, tops: [bool], bottoms: [bool], left: [labels] }
export function cancellation(startUnit, factors, target, substances) {
  const startU = readUnit(startUnit)
  const tops = [{ who: 'start', u: startU }, ...factors.map((f, i) => ({ who: i, u: readUnit(f.top.unit) }))]
  const used = new Set()
  const bottoms = factors.map((f) => {
    const b = readUnit(f.bottom.unit)
    const key = unitKey(b, substances)
    if (!key) return false
    const match = tops.findIndex((t, k) => !used.has(k) && unitKey(t.u, substances) === key)
    if (match < 0) return false
    used.add(match)
    return true
  })
  const cancelled = tops.map((_, k) => used.has(k))
  const leftTops = tops.filter((_, k) => !used.has(k) && tops[k].u)
  const leftBottoms = factors.filter((_, i) => !bottoms[i] && readUnit(factors[i].bottom.unit))
  const done = leftBottoms.length === 0 && leftTops.length === 1 &&
    unitKey(leftTops[0].u, substances) === unitKey(readUnit(target), substances)
  return {
    start: cancelled[0],
    tops: cancelled.slice(1),
    bottoms,
    left: [...leftTops.map((t) => t.u.label), ...leftBottoms.map((f) => `/${f.bottom.unit}`)],
    done,
  }
}

// "g NaCl" for the units dropdown: the plain units plus each with the order's substances
export function unitChoices(substances) {
  const plain = ['g', 'mg', 'kg', 'mL', 'L', 'µL', 'mol', 'molecules']
  const withSubs = substances.flatMap((s) => ['g', 'mol', 'molecules', 'mL'].map((u) => `${u} ${s}`))
  return [...withSubs, ...plain]
}
