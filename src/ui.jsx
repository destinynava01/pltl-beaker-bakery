// Shared building blocks with the bakery look (cream, strawberry frosting, mint icing, chocolate text)

export function Gingham({ className = 'h-3' }) {
  return <div aria-hidden="true" className={`gingham ${className}`} />
}

export function CenterCard({ title, children }) {
  return (
    <main className="bakery-bg flex min-h-dvh items-center justify-center p-4 text-ink">
      <div className="soft-shadow w-full max-w-md overflow-hidden rounded-3xl border-2 border-line bg-card text-center">
        <Gingham />
        <div className="p-8">
          <h1 className="font-display text-4xl font-bold text-accent">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  )
}

export function Label({ children, className = '' }) {
  return <p className={`font-display text-xs font-semibold uppercase tracking-[0.2em] text-info ${className}`}>{children}</p>
}

const BUTTONS = {
  primary: 'bg-accent text-on-accent hover:brightness-105 shadow-[0_4px_0_#d63f7c]',
  mint: 'bg-info text-white hover:brightness-105 shadow-[0_4px_0_#16876c]',
  outline: 'border-2 border-line bg-card text-ink hover:bg-hover',
}

export function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`rounded-2xl px-6 py-3 font-display text-lg font-semibold transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 ${BUTTONS[variant]} ${className}`}
      {...props}
    />
  )
}

// ★★★☆☆
export function Stars({ n, className = '' }) {
  return (
    <span className={`tracking-tight ${className}`} aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((k) => <span key={k} className={k <= n ? 'text-[#ffb000]' : 'text-line'}>★</span>)}
    </span>
  )
}
