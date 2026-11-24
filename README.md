# Beaker Bakery 🧁🧪

A PLTL chemistry game: dimensional analysis as kitchen orders. Teams (or a single student) work a timed shift.
Each order is a conversion ("make 0.250 mol of NaCl: how many grams?"); the team's line cook (rotating every
order) types the conversion chain and the final amount on their phone, and it's graded:

- 🧁 **Perfect**: every factor is a true equality, the units cancel to the target, the amount is right, and so are
  the sig figs (100 points plus a speed tip)
- 🥞 **Undercooked**: the setup is right but the math or the sig figs are off (50 points)
- 🔥 **Burnt**: a factor isn't true, or the units don't cancel (try again; three burns and the order is thrown out)

Menus: Breakfast (metric prefixes), Lunch (grams ↔ moles ↔ molecules), Dinner (molarity, density,
stoichiometry). Orders come from templates with random numbers, so every shift is different.

- `/` the leader: lobby (teams, menus, shift length), the kitchen on the projector, and the shift report
- `/join` students' phones

Backend: the shared Supabase project (`bake-game` and `bake-play` Edge Functions, `bake_*` tables). The chemistry
and the grader are in `supabase/functions/_shared/bakery.ts` (with tests in `bakery_test.ts`).

## Run it

```
npm install
cp .env.example .env.local   # add the Supabase URL and publishable key
npm run dev
```
