// Change these to rebrand and re-tune the game.
export const SITE_NAME = 'Beaker Bakery'
export const SITE_TAGLINE = 'Convert it right, bake it right.'
export const HUB_URL = 'https://pltl-game-hub.vercel.app'

// Teams: 1 (solo) to 8. Each team needs at least one student.
export const MIN_TEAMS = 1
export const MAX_TEAMS = 8
export const TEAM_COLORS = ['#ff6fa3', '#3cc9a6', '#8b7cf6', '#ffb347', '#4aa8ff', '#f26b5b', '#a3c45a', '#c78bd6']

// Shift length (minutes) and the menus (difficulty levels)
export const SHIFT_CHOICES = [10, 15, 20, 30, 45]
export const DEFAULT_SHIFT = 20
export const MENUS = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🥐', about: 'Metric prefixes: mg ↔ g ↔ kg, µL ↔ mL ↔ L' },
  { id: 'lunch', label: 'Lunch', emoji: '🍪', about: 'Grams ↔ moles ↔ molecules (molar mass, Avogadro)' },
  { id: 'dinner', label: 'Dinner', emoji: '🍝', about: 'Molarity, density and stoichiometry (mole ratios)' },
]

// How a dish came out
export const RESULTS = {
  perfect: { emoji: '🧁', label: 'Perfect!', color: 'text-ok', bg: 'bg-ok-soft border-ok' },
  undercooked: { emoji: '🥞', label: 'Undercooked', color: 'text-warn', bg: 'bg-warn-soft border-warn' },
  burnt: { emoji: '🔥', label: 'Burnt', color: 'text-bad', bg: 'bg-bad-soft border-bad' },
  expired: { emoji: '⌛', label: 'Walked out', color: 'text-muted', bg: 'bg-panel border-line' },
}
