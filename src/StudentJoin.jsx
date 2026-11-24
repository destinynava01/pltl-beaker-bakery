import { useCallback, useEffect, useState } from 'react'
import { bakePlay, watchGame } from './api'
import { RESULTS } from './config'
import { clock } from './time'
import { Button, CenterCard, Gingham, Label, Stars } from './ui'
import { cancellation, unitChoices } from './units'

const STORAGE_KEY = 'beakerBakeryStudent'
const DEVICE_KEY = 'beakerBakeryDevice'
const input = 'w-full rounded-xl border-2 border-line bg-white px-2 py-2 text-center font-bold text-ink outline-none placeholder:font-normal placeholder:text-muted focus:border-accent'
const MAX_FACTORS = 6

function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}
const readSaved = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') } catch { return null } }
const writeSaved = (v) => { try { v ? localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) : localStorage.removeItem(STORAGE_KEY) } catch { /* blocked */ } }

// The phone: join, wait for a team, then cook (write the conversion chain) when it's your turn.
export default function StudentJoin() {
  const [saved, setSaved] = useState(readSaved)
  const [notice, setNotice] = useState('')
  const leave = useCallback((message = '') => { writeSaved(null); setSaved(null); setNotice(message) }, [])
  return saved
    ? <Room saved={saved} onLeave={leave} />
    : <JoinForm notice={notice} onJoined={(v) => { writeSaved(v); setSaved(v); setNotice('') }} />
}

function JoinForm({ onJoined, notice }) {
  const [code, setCode] = useState(() => (new URLSearchParams(window.location.search).get('code') ?? '').toUpperCase())
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function join(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = await bakePlay({ action: 'join', join_code: code, display_name: name, device_id: deviceId() })
      onJoined({ playerId: data.player.id, gameId: data.game.id })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <CenterCard title="Join the bakery">
      <p className="mt-1 text-4xl"><span className="bob">🧁</span></p>
      <form onSubmit={join} className="mt-4 space-y-4">
        {notice && <p className="font-bold text-muted">{notice}</p>}
        <div>
          <Label>Game code</Label>
          <input className={`${input} mt-2 py-3 text-xl uppercase tracking-widest`} maxLength={6} placeholder="ABC123" value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())} required autoCapitalize="characters" autoComplete="off" />
        </div>
        <div>
          <Label>Your name</Label>
          <input className={`${input} mt-2 py-3 text-xl`} maxLength={40} placeholder="Maria G." value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={busy || code.length < 6 || !name.trim()}>{busy ? 'Joining…' : 'Put on my apron'}</Button>
        {error && <p className="font-bold text-bad">{error}</p>}
      </form>
    </CenterCard>
  )
}

function Room({ saved, onLeave }) {
  const [view, setView] = useState(null)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())

  const check = useCallback(
    () => bakePlay({ action: 'status', player_id: saved.playerId, device_id: deviceId() })
      .then((data) => {
        if (data.ended) return onLeave('That game has ended. Join another with a new code.')
        setView({ ...data, offset: Date.parse(data.server_now) - Date.now() })
        setError('')
      })
      .catch((e) => {
        if (/not found|another phone/i.test(e.message)) return onLeave('You were removed from that game.')
        setError(e.message)
      }),
    [saved, onLeave],
  )

  useEffect(() => {
    check()
    return watchGame(saved.gameId, ['state', 'lobby'], check, 4000)
  }, [saved, check])
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [])

  if (!view) return <CenterCard title="Beaker Bakery"><p className="mt-4 text-muted">{error || 'Preheating…'}</p></CenterCard>

  const { player, teams, team, order, last_dish: last } = view
  const myTeam = teams[player.team_index]
  const serverNow = now + view.offset
  let body

  if (player.approval_status !== 'approved') {
    body = <Panel emoji="⏳" title="Almost in!" text="Your leader will put you on a team in a moment." />
  } else if (view.game.status === 'setup') {
    body = <Panel emoji="👩‍🍳" title={`You're on ${myTeam?.name ?? 'a team'}`} text="Wash your hands! The kitchen opens soon." />
  } else if (view.game.status === 'finished') {
    body = (
      <section className="soft-shadow rounded-3xl border-2 border-line bg-card p-6 text-center">
        <p className="text-5xl">🎉</p>
        <h2 className="mt-2 font-display text-3xl font-bold text-accent">Shift over!</h2>
        <p className="mt-2 text-lg">{myTeam?.name}: <b>{team?.points ?? 0}</b> points · #{team?.place} of {team?.teams}</p>
        <Stars n={team?.stars ?? 0} className="text-3xl" />
        <p className="mt-2 text-sm text-muted">{team?.perfect ?? 0} perfect · {team?.undercooked ?? 0} undercooked · {team?.burnt ?? 0} burnt</p>
      </section>
    )
  } else {
    body = (
      <>
        {last && <LastDish last={last} fresh={serverNow - Date.parse(last.at) < 20000} />}
        {order ? (
          <>
            <Ticket order={order} serverNow={serverNow} />
            {order.cook?.mine
              ? <ChainBuilder key={order.order_no} order={order} playerId={saved.playerId} onServed={check} />
              : (
                <Panel emoji="🥄" title={`${order.cook?.name ?? 'Your teammate'} is the line cook`}
                  text={`Help them out loud: which factor comes first? Do the units cancel?${order.cook?.next_name ? ` Next order: ${order.cook.next_name}.` : ''}`} />
              )}
          </>
        ) : <Panel emoji="🔔" title="Next order coming up…" text="" />}
      </>
    )
  }

  return (
    <main className="bakery-bg min-h-dvh text-ink">
      <Gingham className="h-2" />
      <div className="mx-auto max-w-md space-y-4 p-4">
        <header className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold">{player.display_name}</p>
            {myTeam && <p className="text-sm text-muted"><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: myTeam.color }} />{myTeam.name}</p>}
          </div>
          {team && view.game.status === 'playing' && (
            <p className="text-right">
              <span className="font-display text-2xl font-bold text-accent">{team.points}</span> <span className="text-sm text-muted">pts</span>
              <span className="block text-xs text-muted">#{team.place} of {team.teams}</span>
            </p>
          )}
        </header>
        {body}
        {error && <p className="text-center font-bold text-bad">{error}</p>}
        <p className="text-center"><button onClick={() => onLeave()} className="text-sm font-bold text-muted hover:text-ink">Leave game</button></p>
      </div>
    </main>
  )
}

function Panel({ emoji, title, text }) {
  return (
    <section className="soft-shadow rounded-3xl border-2 border-line bg-card p-6 text-center">
      <p className="text-4xl">{emoji}</p>
      <h2 className="mt-1 font-display text-2xl font-bold text-accent">{title}</h2>
      {text && <p className="mt-2 text-muted">{text}</p>}
    </section>
  )
}

function Ticket({ order, serverNow }) {
  const total = (Date.parse(order.due_at) - Date.parse(order.started_at)) / 1000
  const left = Math.max(0, (Date.parse(order.due_at) - serverNow) / 1000)
  return (
    <section className="ticket rounded-3xl p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-xl font-semibold"><span className="mr-1 text-2xl">{order.emoji}</span>{order.title}</p>
        <span className={`font-display text-lg font-bold tabular-nums ${left < 15 ? 'text-bad' : 'text-muted'}`}>{clock(left)}</span>
      </div>
      <p className="mt-2 text-lg leading-snug">{order.ticket}</p>
      {order.hints.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-sm text-muted">{order.hints.map((h) => <li key={h}>📝 {h}</li>)}</ul>
      )}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-panel">
        <div className={`h-full rounded-full ${left / total < 0.25 ? 'bg-bad' : 'bg-info'}`} style={{ width: `${total ? (100 * left) / total : 0}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">{order.tries_left} {order.tries_left === 1 ? 'try' : 'tries'} left before it&apos;s thrown out</p>
    </section>
  )
}

function LastDish({ last, fresh }) {
  const r = RESULTS[last.result]
  return (
    <section className={`rounded-3xl border-2 p-4 ${r.bg} ${fresh ? 'pop' : ''}`} key={last.at}>
      <p className={`font-display text-xl font-bold ${r.color}`}>
        {r.emoji} {last.thrown_out ? 'Burnt: order thrown out' : r.label}
        {last.points > 0 && <span className="ml-2 text-base text-ink">+{last.points}</span>}
      </p>
      <p className="text-sm text-muted">{last.title}{last.order_no ? ` (#${last.order_no})` : ''} · cooked by {last.cook}</p>
      <p className="mt-1">{last.reason}</p>
      {last.answer && last.result !== 'perfect' && (
        <div className="mt-2 rounded-2xl bg-white/70 p-3 text-sm">
          <p className="font-bold">The right way: {last.answer}</p>
          {last.solution?.map((s) => <p key={s} className="mt-1 font-mono text-xs">{s}</p>)}
        </div>
      )}
    </section>
  )
}

const blank = () => ({ top: { value: '', unit: '' }, bottom: { value: '', unit: '' } })

// The line cook's workbench: start amount × (top / bottom) × ... = answer, with the units cancelling live
function ChainBuilder({ order, playerId, onServed }) {
  const [factors, setFactors] = useState([blank()])
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const startLabel = order.start_text
  const c = cancellation(order.start.unit, factors, order.target, order.substances)
  const listId = `units-${order.order_no}`

  const set = (i, side, key, value) =>
    setFactors(factors.map((f, k) => (k === i ? { ...f, [side]: { ...f[side], [key]: value } } : f)))
  const flip = (i) => setFactors(factors.map((f, k) => (k === i ? { top: f.bottom, bottom: f.top } : f)))

  async function serve() {
    setBusy(true)
    setError('')
    try {
      await bakePlay({ action: 'serve', player_id: playerId, device_id: deviceId(), order_no: order.order_no, factors, answer })
      await onServed()
    } catch (e) {
      setError(e.message)
      if (/walked out|just served/i.test(e.message)) onServed()
    } finally {
      setBusy(false)
    }
  }

  const filled = factors.every((f) => f.top.value && f.top.unit && f.bottom.value && f.bottom.unit) && answer.trim()

  return (
    <section className="soft-shadow rounded-3xl border-2 border-accent bg-card p-4">
      <p className="text-center font-display text-2xl font-bold text-accent">👩‍🍳 You&apos;re the line cook!</p>
      <p className="text-center text-sm text-muted">Write the conversion chain, then the amount. Units should cancel down to <b>{order.target_text}</b>.</p>
      <datalist id={listId}>{unitChoices(order.substances).map((u) => <option key={u} value={u} />)}</datalist>

      <div className="mt-4 rounded-2xl bg-panel p-3">
        <p className="text-center font-display text-lg">
          <span className={c.start ? 'cancel' : ''}>{startLabel}</span>
        </p>
        {factors.map((f, i) => (
          <div key={i} className="mt-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-xl text-muted">×</span>
              <div className="flex-1 rounded-2xl border-2 border-line bg-white p-2">
                <div className="grid grid-cols-[1fr_1.4fr] gap-1.5">
                  <input className={input} inputMode="decimal" placeholder="58.44" aria-label={`Factor ${i + 1} top number`} value={f.top.value} onChange={(e) => set(i, 'top', 'value', e.target.value)} />
                  <input className={`${input} ${c.tops[i] ? 'cancel' : ''}`} list={listId} placeholder="g NaCl" aria-label={`Factor ${i + 1} top unit`} value={f.top.unit} onChange={(e) => set(i, 'top', 'unit', e.target.value)} autoCapitalize="none" />
                </div>
                <div className="my-1.5 h-0.5 rounded bg-ink" />
                <div className="grid grid-cols-[1fr_1.4fr] gap-1.5">
                  <input className={input} inputMode="decimal" placeholder="1" aria-label={`Factor ${i + 1} bottom number`} value={f.bottom.value} onChange={(e) => set(i, 'bottom', 'value', e.target.value)} />
                  <input className={`${input} ${c.bottoms[i] ? 'cancel' : ''}`} list={listId} placeholder="mol NaCl" aria-label={`Factor ${i + 1} bottom unit`} value={f.bottom.unit} onChange={(e) => set(i, 'bottom', 'unit', e.target.value)} autoCapitalize="none" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => flip(i)} className="rounded-xl border-2 border-line px-2 py-1 text-sm font-bold hover:bg-hover" aria-label={`Flip factor ${i + 1}`} title="Flip it upside down">⇅</button>
                {factors.length > 1 && (
                  <button type="button" onClick={() => setFactors(factors.filter((_, k) => k !== i))} className="rounded-xl px-2 py-1 text-sm font-bold text-bad hover:bg-bad-soft" aria-label={`Remove factor ${i + 1}`}>✕</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {factors.length < MAX_FACTORS && (
          <button type="button" onClick={() => setFactors([...factors, blank()])} className="mt-3 w-full rounded-2xl border-2 border-dashed border-line py-2 font-bold text-info hover:bg-info-soft">
            + Add a conversion factor
          </button>
        )}
        <p className={`mt-3 text-center text-sm font-bold ${c.done ? 'text-ok' : 'text-muted'}`}>
          {c.done ? `✓ Units cancel to ${order.target_text}` : `Units left: ${c.left.join(' · ') || '…'}`}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="font-display text-2xl text-muted">=</span>
        <input className={`${input} py-3 text-xl`} placeholder="amount (sig figs count!)" aria-label="Final amount" value={answer} onChange={(e) => setAnswer(e.target.value)} autoComplete="off" />
        <span className="shrink-0 font-display text-lg font-semibold">{order.target_text}</span>
      </div>
      <p className="mt-1 text-xs text-muted">Big or tiny numbers: write 6.02 x 10^23 or 6.02e23.</p>

      <Button className="mt-4 w-full text-xl" disabled={busy || !filled} onClick={serve}>{busy ? 'Plating…' : '🔔 Serve it!'}</Button>
      {error && <p className="mt-2 text-center font-bold text-bad">{error}</p>}
    </section>
  )
}
