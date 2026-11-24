import { useEffect, useState } from 'react'
import { bakeGame } from './api'
import { RESULTS } from './config'
import { Button, Gingham, Stars } from './ui'

// End of the shift: teams ranked by points (with stars), every order each team got (what they served, and the
// right way to do it), and the results download.
export default function EndShift({ session, onNewGame, onLobby }) {
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(null) // the team whose orders are showing
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    bakeGame({ action: 'shift_report', game_id: session.gameId, host_token: session.hostToken })
      .then(setReport)
      .catch((e) => setError(e.message))
  }, [session])

  async function download() {
    setDownloading(true)
    try {
      const { downloadResults } = await import('./gameResults')
      await downloadResults(report)
    } catch (e) {
      setError(e.message || 'Could not download the results.')
    } finally {
      setDownloading(false)
    }
  }

  if (!report) return <main className="bakery-bg flex min-h-dvh items-center justify-center"><p className="text-muted">{error || 'Counting the tips…'}</p></main>

  const ranked = [...report.teams].sort((a, b) => b.score.points - a.score.points)
  const medal = ['🥇', '🥈', '🥉']

  return (
    <main className="bakery-bg min-h-dvh p-4 text-ink sm:p-8">
      <section className="soft-shadow mx-auto max-w-4xl overflow-hidden rounded-3xl border-2 border-line bg-card">
        <Gingham />
        <div className="p-6 text-center sm:p-8">
          <p className="text-5xl">🎉🧁</p>
          <h1 className="mt-2 font-display text-5xl text-accent">Shift over!</h1>
          <p className="mt-1 text-muted">{report.shift_minutes}-minute shift</p>

          <ol className="mx-auto mt-6 max-w-xl space-y-3 text-left">
            {ranked.map((t, i) => (
              <li key={t.index}>
                <button type="button" onClick={() => setOpen(open === t.index ? null : t.index)}
                  className="w-full rounded-2xl border-2 border-line bg-panel p-4 text-left hover:bg-hover" style={{ borderLeft: `10px solid ${t.color}` }}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-2xl">{medal[i] ?? `#${i + 1}`} {t.name}</p>
                    <p className="font-display text-3xl text-accent">{t.score.points}</p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                    <Stars n={t.score.stars} className="text-xl" />
                    <span>🧁 {t.score.perfect} · 🥞 {t.score.undercooked} · 🔥 {t.score.burnt} · ⌛ {t.score.expired}</span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-info">{open === t.index ? 'Hide orders ▲' : 'See every order ▼'}</p>
                </button>
                {open === t.index && <Orders team={t} />}
              </li>
            ))}
          </ol>

          <div className="mx-auto mt-8 grid max-w-md gap-2 sm:grid-cols-2">
            <Button variant="mint" disabled={downloading} onClick={download}>{downloading ? 'Preparing…' : '⬇️ Results (.xlsx)'}</Button>
            <Button onClick={onNewGame}>New game</Button>
          </div>
          <p className="mt-2 text-xs text-muted">Download before starting a new game. New game closes this one, and game data is cleared after 8 hours.</p>
          <button type="button" onClick={onLobby} className="mt-2 text-sm font-bold text-info">Back to the lobby</button>
          {error && <p className="mt-2 font-bold text-bad">{error}</p>}
        </div>
      </section>
    </main>
  )
}

function Orders({ team }) {
  if (team.orders.length === 0) return <p className="mt-2 text-center text-sm text-muted">No orders.</p>
  return (
    <ul className="mt-2 space-y-2">
      {team.orders.map((o) => {
        const r = RESULTS[o.status] ?? { emoji: '🍳', label: 'Still cooking', bg: 'bg-panel border-line', color: 'text-muted' }
        return (
          <li key={o.order_no} className={`rounded-2xl border-2 p-3 text-sm ${r.bg}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-base">{o.emoji} #{o.order_no} {o.title} <span className="text-xs font-normal text-muted">({o.level})</span></p>
              <p className={`shrink-0 font-bold ${r.color}`}>{r.emoji} {r.label}{o.points + o.tip > 0 ? ` +${o.points + o.tip}` : ''}</p>
            </div>
            <p className="mt-1">{o.ticket}</p>
            {o.dishes.map((d, k) => (
              <p key={k} className="mt-1 font-mono text-xs">
                {RESULTS[d.result].emoji} {d.cook}: {d.chain}
              </p>
            ))}
            {o.status !== 'perfect' && (
              <div className="mt-2 rounded-xl bg-white/70 p-2 text-xs">
                <p className="font-bold">Answer: {o.answer}</p>
                {o.solution.map((s) => <p key={s} className="font-mono">{s}</p>)}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
