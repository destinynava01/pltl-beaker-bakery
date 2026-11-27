import { useEffect, useState } from 'react'
import HowToPlay from './HowToPlay'
import { SLIDES as HOW_TO_SLIDES } from './howToSlides'
import { QRCodeSVG } from 'qrcode.react'
import { bakeGame, watchGame } from './api'
import { DEFAULT_SHIFT, HUB_URL, MAX_TEAMS, MENUS, MIN_TEAMS, SHIFT_CHOICES, SITE_NAME, TEAM_COLORS } from './config'
import { saveSession } from './session'
import { Button, Gingham, Label } from './ui'

const card = 'soft-shadow rounded-3xl border-2 border-line bg-card p-6'
const choice = (on) =>
  `rounded-2xl border-2 px-3 py-2 text-sm font-bold transition ${on ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-panel hover:bg-hover'}`

// Leader lobby: create the game -> teams -> finalize -> menus and shift length -> open the kitchen.
// Students join from their phones; the leader puts them on teams. A team of one works (solo baking).
export default function Lobby({ onStart, onOpenKitchen, hasGame, resume, onCloseGame }) {
  const [session, setSession] = useState(resume?.session ?? null)
  const [teamNames, setTeamNames] = useState(resume?.teams?.length ? resume.teams : ['Team 1', 'Team 2'])
  const [finalized, setFinalized] = useState(Boolean(resume?.finalized))
  const [menus, setMenus] = useState(['breakfast', 'lunch'])
  const [shift, setShift] = useState(DEFAULT_SHIFT)
  const [busy, setBusy] = useState(false)
  const [guide, setGuide] = useState(false) // the how-to guide, shown when Start is pressed (before the clock starts)
  const [error, setError] = useState('')
  const [players, setPlayers] = useState([])

  useEffect(() => {
    if (!session) return undefined
    const load = () =>
      bakeGame({ action: 'list_players', game_id: session.gameId, host_token: session.hostToken })
        .then((data) => setPlayers(data.players))
        .catch(() => {})
    load()
    return watchGame(session.gameId, ['lobby'], load, 10000)
  }, [session])

  const waiting = players.filter((p) => p.approval_status === 'pending')
  const teamLabel = (i) => teamNames[i].trim() || `Team ${i + 1}`
  const sizes = teamNames.map((_, i) => players.filter((p) => p.approval_status === 'approved' && p.team_index === i).length)
  const emptyTeams = teamNames.map((_, i) => i).filter((i) => sizes[i] === 0)

  async function run(fn) {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  const call = (payload) => bakeGame({ ...payload, game_id: session.gameId, host_token: session.hostToken })

  const createGame = () => run(async () => {
    const data = await bakeGame({ action: 'create_game' })
    const created = { gameId: data.game.id, hostToken: data.host_token, joinCode: data.game.join_code }
    saveSession(created)
    setSession(created)
  })
  const finalize = () => run(async () => {
    await call({ action: 'set_teams', team_names: teamNames.map((_, i) => teamLabel(i)) })
    setFinalized(true)
  })
  const studentAction = (payload) => run(async () => {
    await call(payload)
    setPlayers((await call({ action: 'list_players' })).players)
  })
  const start = () => run(async () => {
    await call({ action: 'start_game', team_names: teamNames.map((_, i) => teamLabel(i)), levels: menus, shift_minutes: shift })
    onStart(session)
  })

  const joinUrl = session ? `${window.location.origin}/join?code=${session.joinCode}` : ''

  return (
    <main className="bakery-bg min-h-dvh p-4 text-ink sm:p-8">
      {/* Start shows the how-to guide first; the game (and its clock) starts when it closes */}
      {guide && <HowToPlay site="bakery" gameId={session?.gameId ?? 'lobby'} name="Beaker Bakery" accent="#d9652b" slides={HOW_TO_SLIDES} open onClose={() => { setGuide(false); start() }} />}
      {hasGame && (
        <button onClick={onOpenKitchen} className="fixed right-4 top-4 z-20 rounded-2xl border-2 border-line bg-card px-4 py-2 font-bold hover:bg-hover">
          Back to the kitchen
        </button>
      )}

      <header className="mx-auto mb-8 max-w-5xl text-center">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-info">{SITE_NAME}</p>
        <h1 className="mt-1 font-display text-5xl text-accent">🧁 Leader Lobby</h1>
        <p className="mt-2 text-muted">Set up your teams, pick the menus, then open the kitchen.</p>
        <p className="mt-2 text-sm font-bold"><a href={HUB_URL} className="text-info hover:brightness-110">← All games</a></p>
        <div className="mt-6">
          {session ? (
            <div className="flex flex-col items-center gap-3">
              <p className="font-bold text-ok">The bakery is ready!</p>
              <Button variant="outline" className="!px-4 !py-2 text-sm" disabled={busy}
                onClick={() => window.confirm('Close this game? Every student will be sent back to the join page.') && onCloseGame()}>
                Close game and start fresh
              </Button>
            </div>
          ) : (
            <Button onClick={createGame} disabled={busy}>{busy ? 'Preheating…' : 'Create new game'}</Button>
          )}
          {error && <p className="mt-3 font-bold text-bad">{error}</p>}
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
        <div className={card}>
          <h2 className="font-display text-2xl text-accent">Join the kitchen</h2>
          <p className="mt-3">
            Join code:{' '}
            {session ? <span className="font-display text-3xl tracking-widest text-info">{session.joinCode}</span> : <span className="text-muted">Not created yet</span>}
          </p>
          {session && (
            <div className="mt-5 flex flex-col items-center">
              <div className="rounded-3xl border-4 border-accent-soft bg-white p-4">
                <QRCodeSVG value={joinUrl} size={200} title={`Join code ${session.joinCode}`} />
              </div>
              <p className="mt-3 text-center text-sm text-muted">Students scan this with their phone camera to join.</p>
              <p className="mt-3 rounded-lg border-2 border-dashed border-warn bg-warn-soft px-3 py-2 text-center text-sm font-bold text-warn">📝 Tell students to grab scratch paper for the conversion chains and sig-fig math.</p>
            </div>
          )}
          <div className="mt-6 rounded-2xl border-2 border-dashed border-line p-4 text-sm text-muted">
            <p className="font-bold text-ink">How an order works</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>An order ticket comes in, like &ldquo;make 0.250 mol of NaCl: how many grams?&rdquo;</li>
              <li>The team&apos;s line cook (it rotates every order) types the conversion chain and the amount.</li>
              <li>🧁 Perfect, 🥞 undercooked (math or sig figs off), or 🔥 burnt (units don&apos;t cancel). Three burns and the order is thrown out.</li>
            </ol>
          </div>
        </div>

        <div className={card}>
          <h2 className="font-display text-2xl text-accent">Teams</h2>
          <div className="mt-4 space-y-3">
            {teamNames.map((name, i) => (
              // A team is a little bakery counter: an apron color and the team's name
              <div key={i} className="flex items-center gap-3 overflow-hidden rounded-2xl border-2 border-line bg-panel">
                <span className="self-stretch px-3 py-3 text-2xl" style={{ background: TEAM_COLORS[i] }} aria-hidden="true">👩‍🍳</span>
                <input
                  className="min-w-0 flex-1 bg-transparent py-2 font-display text-xl outline-none disabled:opacity-100"
                  value={name} maxLength={40} disabled={finalized} aria-label={`Name for team ${i + 1}`}
                  onChange={(e) => setTeamNames(teamNames.map((n, k) => (k === i ? e.target.value : n)))}
                />
                {finalized && <span className="pr-3 text-sm text-muted">{sizes[i]} cook{sizes[i] === 1 ? '' : 's'}</span>}
                {!finalized && teamNames.length > MIN_TEAMS && (
                  <button type="button" onClick={() => setTeamNames(teamNames.filter((_, k) => k !== i))}
                    aria-label={`Remove team ${i + 1}`} className="mr-3 rounded-xl px-2 py-1 font-bold text-muted hover:bg-hover hover:text-bad">✕</button>
                )}
              </div>
            ))}
          </div>
          {!finalized && teamNames.length < MAX_TEAMS && (
            <Button variant="outline" className="mt-3 w-full" onClick={() => setTeamNames([...teamNames, `Team ${teamNames.length + 1}`])}>
              + Add team ({teamNames.length}/{MAX_TEAMS})
            </Button>
          )}
          <p className="mt-2 text-xs text-muted">One team works too: solo baking. Every team needs at least one student.</p>
          <Button className="mt-4 w-full" disabled={!session || finalized || busy} onClick={finalize}>{finalized ? 'Teams finalized' : 'Finalize teams'}</Button>
          {finalized && (
            <button type="button" className="mt-2 text-sm font-bold text-info" onClick={() => setFinalized(false)}>Edit teams</button>
          )}

          {finalized && (
            <div className="mt-6 border-t-2 border-line pt-4">
              <Label>Menus (pick one or more)</Label>
              <div className="mt-2 grid gap-2">
                {MENUS.map((m) => {
                  const on = menus.includes(m.id)
                  return (
                    <button key={m.id} type="button" aria-pressed={on} className={`${choice(on)} flex items-center gap-3 text-left`}
                      onClick={() => setMenus(on ? menus.filter((x) => x !== m.id) : [...menus, m.id])}>
                      <span className="text-2xl">{m.emoji}</span>
                      <span>
                        <span className="block font-display text-base">{m.label}</span>
                        <span className="block text-xs font-normal text-muted">{m.about}</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <Label className="mt-4">Shift length</Label>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {SHIFT_CHOICES.map((n) => (
                  <button key={n} type="button" aria-pressed={shift === n} onClick={() => setShift(n)} className={choice(shift === n)}>{n} min</button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">Each order has 5 minutes. Sig figs always count: the right amount with the wrong sig figs comes out undercooked. Every phone has a calculator.</p>

              {emptyTeams.length > 0 && (
                <p className="mt-3 text-sm font-bold text-bad">Every team needs at least one student. Still empty: {emptyTeams.map(teamLabel).join(', ')}.</p>
              )}
              <Button className="mt-4 w-full" disabled={busy || menus.length === 0 || emptyTeams.length > 0} onClick={() => (howToSkipped('bakery') ? start() : setGuide(true))}>
                {busy ? 'Opening…' : '🔔 Open the kitchen'}
              </Button>
            </div>
          )}
        </div>

        <div className={`${card} md:col-span-2`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-accent">Students waiting</h2>
            <Button variant="outline" className="!px-4 !py-2 text-sm" disabled={!finalized || waiting.length === 0 || busy}
              title="Approves every waiting student and splits them evenly between the teams" onClick={() => studentAction({ action: 'assign_random' })}>
              🎲 Randomly assign teams ({waiting.length})
            </Button>
          </div>
          <p className="mt-1 text-sm text-muted">Random assignment only includes students you&apos;ve checked are in the room.</p>
          {!session && <p className="mt-4 text-muted">Create the game first, then students can join with the code.</p>}
          {session && !finalized && <p className="mt-4 text-muted">Finalize the teams so you can put students on them.</p>}
          {session && players.length === 0 && <p className="mt-4 text-muted">No students have joined yet.</p>}

          {waiting.length > 0 && (
            <ul className="mt-4 space-y-2">
              {waiting.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-line bg-panel px-3 py-2">
                  <span className="font-bold">{p.display_name}</span>
                  <span className="flex flex-wrap gap-2">
                    {teamNames.map((_, i) => (
                      <button key={i} type="button" disabled={!finalized || busy}
                        onClick={() => studentAction({ action: 'approve_player', player_id: p.id, team_index: i })}
                        className="rounded-xl px-3 py-1 text-sm font-bold text-white disabled:opacity-40" style={{ background: TEAM_COLORS[i] }}>
                        {teamLabel(i)}
                      </button>
                    ))}
                    <button type="button" disabled={busy} onClick={() => studentAction({ action: 'remove_player', player_id: p.id })}
                      className="rounded-xl border-2 border-line px-3 py-1 text-sm font-bold hover:bg-hover">Remove</button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {players.some((p) => p.approval_status === 'approved') && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {teamNames.map((_, i) => {
                const members = players.filter((p) => p.approval_status === 'approved' && p.team_index === i)
                return (
                  <div key={i} className="overflow-hidden rounded-2xl border-2 border-line bg-panel">
                    <div className="h-2" style={{ background: TEAM_COLORS[i] }} />
                    <div className="p-3">
                      <p className="font-display text-lg">{teamLabel(i)}</p>
                      <ul className="mt-1 space-y-1 text-sm">
                        {members.map((p) => (
                          <li key={p.id} className="flex items-center justify-between gap-2">
                            <span>{p.display_name}</span>
                            <button type="button" aria-label={`Remove ${p.display_name}`} disabled={busy}
                              onClick={() => studentAction({ action: 'remove_player', player_id: p.id })} className="text-xs font-bold text-bad">✕</button>
                          </li>
                        ))}
                        {members.length === 0 && <li className="text-xs font-bold text-bad">Needs a student</li>}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
      <Gingham className="mx-auto mt-8 h-3 max-w-5xl rounded-full" />
    </main>
  )
}

// The leader turned the how-to guide off on this computer ("Don't show this again")
function howToSkipped(site) {
  try {
    return Boolean(localStorage.getItem(`pltlHowToSkip:${site}`))
  } catch {
    return false
  }
}
