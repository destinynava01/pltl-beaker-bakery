import { useCallback, useEffect, useRef, useState } from 'react'
import HowToPlay from './HowToPlay'
import { SLIDES as HOW_TO_SLIDES } from './howToSlides'
import { bakeGame, watchGame } from './api'
import EndShift from './EndShift'
import { MENUS, RESULTS, SITE_NAME } from './config'
import { clock } from './time'
import { Button, Gingham, Stars } from './ui'

// The projector: every team's counter with its order ticket, line cook, order timer, score and the dishes
// it has served. The shift clock runs at the top; when it runs out, the shift report opens.
export default function Kitchen({ session, onLobby, onNewGame }) {
  const [kitchen, setKitchen] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const endedOnce = useRef(false)

  const call = useCallback((payload) => bakeGame({ ...payload, game_id: session.gameId, host_token: session.hostToken }), [session])
  const load = useCallback(
    () => call({ action: 'kitchen' })
      .then((data) => { setKitchen({ ...data, offset: Date.parse(data.server_now) - Date.now() }); setError('') })
      .catch((e) => setError(e.message)),
    [call],
  )

  useEffect(() => {
    load()
    return watchGame(session.gameId, ['state', 'lobby'], load, 5000)
  }, [session, load])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [])

  const serverNow = now + (kitchen?.offset ?? 0)
  const shiftLeft = kitchen?.game?.shift_ends_at ? (Date.parse(kitchen.game.shift_ends_at) - serverNow) / 1000 : null
  const playing = kitchen?.game?.status === 'playing'

  // The shift clock ran out: ask once, and the server closes the kitchen
  const timeUp = playing && shiftLeft !== null && shiftLeft <= 0
  useEffect(() => {
    if (!timeUp || endedOnce.current) return
    endedOnce.current = true
    load()
  }, [timeUp, load])

  async function act(payload, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(true)
    try {
      await call(payload)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!kitchen) {
    return <main className="bakery-bg flex min-h-dvh items-center justify-center"><p className="text-muted">{error || 'Preheating the ovens…'}</p></main>
  }
  if (kitchen.game.status === 'finished') return <EndShift session={session} onNewGame={onNewGame} onLobby={onLobby} />

  const menus = MENUS.filter((m) => (kitchen.game.levels ?? []).includes(m.id))

  return (
    <main className="bakery-bg min-h-dvh text-ink">
      {/* The visual how-to guide: opens once per game, skippable */}
      <HowToPlay site="bakery" gameId={session.gameId} name="Beaker Bakery" accent="#d9652b" slides={HOW_TO_SLIDES} />
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.3em] opacity-90">{SITE_NAME} · join code {session.joinCode}</p>
            <h1 className="font-display text-3xl text-[#f3b27a]">🧁 Kitchen&apos;s open! <span className="text-lg font-semibold opacity-90">{menus.map((m) => `${m.emoji} ${m.label}`).join(' · ')}</span></h1>
          </div>
          <div className="flex items-center gap-3">
            {shiftLeft !== null && (
              <div className={`rounded-2xl bg-white px-4 py-1 text-center text-ink ${shiftLeft <= 30 ? 'wobble' : ''}`} key={shiftLeft <= 30 ? Math.ceil(shiftLeft) : 'shift'}>
                <p className="font-display text-[10px] uppercase tracking-widest text-muted">Shift ends in</p>
                <p className={`font-display text-3xl tabular-nums ${shiftLeft <= 60 ? 'text-bad' : ''}`}>{clock(shiftLeft)}</p>
              </div>
            )}
            {kitchen.waiting > 0 && <Button variant="mint" className="!px-3 !py-2 text-sm" onClick={onLobby}>{kitchen.waiting} waiting</Button>}
            <Button variant="outline" className="!px-3 !py-2 text-sm" onClick={onLobby}>Lobby</Button>
            <Button variant="outline" className="!px-3 !py-2 text-sm" disabled={busy} onClick={() => act({ action: 'end_game' }, 'End the shift now and see the results?')}>End shift</Button>
          </div>
        </div>
        <div className="frosting" />
      </header>
      {error && <p className="mx-auto mt-3 max-w-7xl px-6 font-bold text-bad">{error}</p>}

      <section className="mx-auto grid max-w-7xl gap-5 p-4 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
        {kitchen.teams.map((t) => <Counter key={t.index} team={t} serverNow={serverNow} busy={busy} onPass={() => act({ action: 'pass_cook', team_index: t.index })} />)}
      </section>
    </main>
  )
}

// One team's counter
function Counter({ team, serverNow, busy, onPass }) {
  const o = team.order
  const total = o ? (Date.parse(o.due_at) - Date.parse(o.started_at)) / 1000 : 0
  const left = o ? Math.max(0, (Date.parse(o.due_at) - serverNow) / 1000) : 0
  const last = team.last_dish
  const fresh = last && serverNow - Date.parse(last.created_at) < 8000
  return (
    <article className="soft-shadow overflow-hidden rounded-3xl border-2 border-line bg-card">
      <div className="flex items-center justify-between gap-2 px-4 py-3" style={{ background: `${team.color}22`, borderBottom: `4px solid ${team.color}` }}>
        <div className="min-w-0">
          <h2 className="truncate font-display text-2xl">{team.name}</h2>
          <p className="truncate text-xs text-muted">{team.members.join(', ')}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl text-accent">{team.score.points}</p>
          <Stars n={team.score.stars} className="text-lg" />
        </div>
      </div>

      <div className="p-4">
        {o ? (
          <div className="ticket rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-xl"><span className="mr-1 text-2xl">{o.emoji}</span>{o.title}</p>
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-display text-xs uppercase text-accent">#{o.order_no} · {o.level}</span>
            </div>
            <p className="mt-2 leading-snug">{o.ticket}</p>
            {o.hints.length > 0 && <p className="mt-2 text-sm text-muted">📝 {o.hints.join(' · ')}</p>}
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-panel">
              <div className={`h-full rounded-full transition-all ${left / total < 0.25 ? 'bg-bad' : 'bg-info'}`} style={{ width: `${total ? (100 * left) / total : 0}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span>👩‍🍳 <b>{o.cook ?? 'No cook'}</b> is cooking{o.tries > 0 ? ` · ${3 - o.tries} tr${3 - o.tries === 1 ? 'y' : 'ies'} left` : ''}</span>
              <span className={`font-display tabular-nums ${left < 15 ? 'text-bad' : 'text-muted'}`}>{clock(left)}</span>
            </div>
            <button type="button" disabled={busy} onClick={onPass} className="mt-1 text-xs font-bold text-info hover:underline">Cook not here? Pass the whisk →</button>
          </div>
        ) : (
          <p className="text-center text-muted">Waiting for the next order…</p>
        )}

        {last && (
          <div className={`mt-3 rounded-2xl border-2 px-3 py-2 text-sm ${RESULTS[last.result].bg} ${fresh ? 'pop' : ''}`} key={last.created_at}>
            <b className={RESULTS[last.result].color}>{RESULTS[last.result].emoji} {RESULTS[last.result].label}</b>
            <span className="text-muted"> · {last.cook}</span>
            <p className="mt-0.5 text-xs">{last.reason}</p>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1 text-xl" aria-label="Dishes so far">
          {team.history.map((h, i) => <span key={i} title={`${h.title}: ${RESULTS[h.status]?.label}`}>{RESULTS[h.status]?.emoji}</span>)}
          {team.history.length === 0 && <span className="text-sm text-muted">No dishes yet</span>}
        </div>
      </div>
      <Gingham className="h-2" />
    </article>
  )
}

