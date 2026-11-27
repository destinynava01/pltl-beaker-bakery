import { useEffect, useState } from 'react'
import { RESULTS } from './config'
import { Button, Label } from './ui'

// The leader's peek at one team: the order it's cooking (as its phones show it), the line cook, and every dish
// served on this order, with the conversion chain the cook wrote and why it burnt or came out undercooked. The model
// answer stays behind a button, since the kitchen is often on the projector. Refreshes whenever the kitchen does
// (`stamp` changes).
export default function Peek({ call, team, stamp, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [shownFor, setShownFor] = useState(null) // the order the answer was shown for (a new order hides it again)

  useEffect(() => {
    call({ action: 'peek', team_index: team.index }).then((d) => { setData(d); setError('') }).catch((e) => setError(e.message))
  }, [call, team.index, stamp])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const o = data?.order
  const showAnswer = o && shownFor === o.order_no

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={`Peek at ${team.name}`}>
      <section className="soft-shadow my-auto w-full max-w-2xl rounded-3xl border-2 border-line bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Label>👀 Peeking at {team.name}</Label>
            {o && <h2 className="mt-1 font-display text-2xl"><span className="mr-1">{o.emoji}</span>{o.title} <span className="text-base text-muted">#{o.order_no} · {o.level}</span></h2>}
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border-2 border-line px-3 py-1 font-bold hover:bg-hover" aria-label="Close">✕</button>
        </div>

        {error && <p className="mt-3 font-bold text-bad">{error}</p>}
        {!data && !error && <p className="mt-4 text-muted">Loading…</p>}
        {data && !o && <p className="mt-4 text-muted">No order on the counter right now (the next one is on its way).</p>}

        {data && data.history.length > 0 && (
          <ol className="mt-3 flex flex-wrap gap-1.5">
            {data.history.map((h) => (
              <li key={h.order_no} title={`${h.title}: ${RESULTS[h.status]?.label}`} className={`rounded-full border px-2 py-0.5 text-xs font-bold ${RESULTS[h.status]?.bg ?? ''}`}>
                {RESULTS[h.status]?.emoji} #{h.order_no}
              </li>
            ))}
          </ol>
        )}

        {o && (
          <>
            <div className="ticket mt-4 rounded-2xl p-4">
              <Label>What their phones show</Label>
              <p className="mt-1 leading-snug">{o.ticket}</p>
              {o.hints.length > 0 && <p className="mt-2 text-sm text-muted">📝 {o.hints.join(' · ')}</p>}
              <p className="mt-2 text-sm">Start: <b>{o.start_text}</b> → end in <b>{o.target_text}</b></p>
            </div>

            <p className="mt-3 text-sm">
              👩‍🍳 Line cook: <b>{o.cook ?? 'nobody on this team'}</b> ·{' '}
              {o.tries > 0 ? <span className="font-bold text-bad">{o.tries} dish{o.tries === 1 ? '' : 'es'} sent back, {3 - o.tries} tr{3 - o.tries === 1 ? 'y' : 'ies'} left</span> : 'nothing served on this order yet'}
            </p>

            <div className="mt-3">
              <Label>Dishes served on this order</Label>
              {o.dishes.length === 0 ? <p className="mt-1 text-sm text-muted">Nothing served yet.</p> : (
                <ol className="mt-1 space-y-1.5">
                  {o.dishes.map((d, i) => (
                    <li key={i} className={`rounded-xl border-2 px-3 py-2 text-sm ${RESULTS[d.result]?.bg ?? ''}`}>
                      <p><b className={RESULTS[d.result]?.color}>{RESULTS[d.result]?.emoji} {RESULTS[d.result]?.label}</b> <span className="text-muted">· {d.cook}</span></p>
                      <p className="mt-0.5 break-words font-mono text-xs">{d.chain}</p>
                      {d.reason && <p className="mt-0.5">{d.reason}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="outline" className="!px-3 !py-1.5 text-sm" onClick={() => setShownFor(showAnswer ? null : o.order_no)}>{showAnswer ? 'Hide' : 'Show'} the answer</Button>
              <span className="text-xs text-muted">(hidden by default in case this is on the projector)</span>
            </div>
            {showAnswer && (
              <div className="mt-2 rounded-2xl bg-ok-soft px-3 py-2 text-sm text-ok">
                <p className="font-bold">{o.answer}</p>
                {o.solution.length > 0 && <ol className="mt-1 list-decimal pl-5 font-mono text-xs">{o.solution.map((s, i) => <li key={i}>{s}</li>)}</ol>}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
