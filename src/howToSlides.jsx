/* eslint-disable react-refresh/only-export-components -- static slide content with small local helpers */
// The "How to play" slides for Beaker Bakery (shown on the projector when the kitchen opens)

function Phone({ children }) {
  return <div className="w-60 rounded-[1.6rem] border-4 border-slate-600 bg-[#fff4ea] p-3 text-[#2f2419] shadow-xl">{children}</div>
}
const strike = 'line-through decoration-teal-500 decoration-[3px] opacity-60'

export const SLIDES = [
  {
    title: 'An order comes in',
    text: 'Each team gets an order ticket on the projector and on their phones. Every order is a chemistry conversion, and the team has 5 minutes to serve it.',
    art: (
      <div className="w-72 rounded-2xl border-2 border-dashed border-[#d9c3a3] bg-[#fffdf8] p-4 text-[#2f2419]">
        <p className="flex justify-between text-lg font-black"><span>🍪 Sugar cookies</span><span className="text-sm text-stone-500">4:12</span></p>
        <p className="mt-2">The recipe uses <b>23.7 g</b> of sucrose (C12H22O11). <b>How many moles</b> is that?</p>
        <p className="mt-2 text-sm text-stone-500">📝 C12H22O11: 342.30 g/mol</p>
        <div className="mt-3 h-2 rounded-full bg-stone-200"><div className="h-full w-4/5 rounded-full bg-teal-600" /></div>
      </div>
    ),
  },
  {
    title: 'One line cook per order',
    text: 'One teammate is the line cook and types the answer. It rotates every order, so everyone cooks. Everyone else helps out loud and checks the math on their own calculator.',
    art: (
      <div className="flex gap-4">
        <Phone><p className="text-center text-2xl">👩‍🍳</p><p className="text-center font-black text-[#d9652b]">You&apos;re the line cook!</p><p className="mt-1 text-center text-xs">Write the chain, then the amount.</p></Phone>
        <Phone><p className="text-center text-2xl">🥄</p><p className="text-center font-black text-[#17807a]">Maria is the line cook</p><p className="mt-1 text-center text-xs">Help her out loud: do the units cancel?</p></Phone>
      </div>
    ),
  },
  {
    title: 'Write the conversion chain',
    text: 'Start from the amount on the ticket. Add conversion factors (top over bottom) so the units cancel down to what the order asks for. ⇅ flips a factor upside down; + adds another one.',
    art: (
      <Phone>
        <p className={`text-center font-bold ${strike}`}>23.7 g C12H22O11</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xl text-stone-400">×</span>
          <div className="flex-1 rounded-xl border-2 border-stone-300 bg-white p-2 text-center text-sm font-bold">
            <p>1 &nbsp;mol C12H22O11</p>
            <div className="my-1 h-0.5 bg-stone-800" />
            <p>342.30 &nbsp;<span className={strike}>g C12H22O11</span></p>
          </div>
          <span className="rounded-lg border-2 border-stone-300 px-2 text-sm">⇅</span>
        </div>
        <p className="mt-2 text-center text-xs font-bold text-green-700">✓ Units cancel to mol C12H22O11</p>
      </Phone>
    ),
  },
  {
    title: 'Type the amount: sig figs count!',
    text: 'Work out the number (every phone has a calculator), then round it. Use the same number of sig figs as the measurement you started with: 23.7 has 3, so the answer has 3.',
    art: (
      <Phone>
        <div className="flex items-center gap-2">
          <span className="text-xl text-stone-400">=</span>
          <div className="flex-1 rounded-xl border-2 border-[#d9652b] bg-white px-3 py-2 text-center text-xl font-black">0.0692</div>
          <span className="font-bold">mol</span>
        </div>
        <div className="mt-3 rounded-xl bg-[#2f2419] px-3 py-2 text-right font-mono text-white"><p className="text-xs opacity-60">23.7÷342.30</p><p>0.06923751</p></div>
        <p className="mt-2 text-center text-xs text-stone-600">0.06923751 → <b>0.0692</b> (3 sig figs)</p>
      </Phone>
    ),
  },
  {
    title: 'Serve it!',
    text: 'Burnt dishes can be fixed and served again, but after 3 burns the order is thrown out and the right chain is shown so everyone learns from it.',
    art: (
      <div className="grid w-full max-w-sm gap-2 text-[#2f2419]">
        <div className="rounded-xl border-2 border-green-600 bg-green-50 p-3"><b className="text-green-700">🧁 Perfect · +100 + a speed tip</b><p className="text-sm">Right setup, right number, right sig figs.</p></div>
        <div className="rounded-xl border-2 border-amber-600 bg-amber-50 p-3"><b className="text-amber-700">🥞 Undercooked · +50</b><p className="text-sm">The setup is right, but the math or the sig figs are off.</p></div>
        <div className="rounded-xl border-2 border-orange-700 bg-orange-50 p-3"><b className="text-orange-700">🔥 Burnt · try again</b><p className="text-sm">A factor is wrong, or the units don&apos;t cancel.</p></div>
      </div>
    ),
  },
  {
    title: 'Most points wins',
    text: 'Serve as many orders as you can before the shift clock runs out. Faster perfect dishes earn bigger tips. A late order walks out with no points.',
    art: (
      <div className="w-72 space-y-2">
        <p className="rounded-xl bg-[#2f2419] p-2 text-center text-white">Shift ends in <b className="text-2xl">12:40</b></p>
        {[['Team 2', 480, '★★★★☆'], ['Team 1', 350, '★★★☆☆']].map(([n, p, s]) => (
          <div key={n} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-[#2f2419]"><b>{n}</b><span className="text-amber-500">{s}</span><b className="text-[#d9652b]">{p}</b></div>
        ))}
      </div>
    ),
  },
]
