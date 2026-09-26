export function PageHead({ title, lead, children }: { title: string; lead?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[clamp(26px,3.4vw,38px)] font-black text-serpent">{title}</h1>
        {lead && <p className="mt-2 max-w-[70ch] text-[15px] text-muted">{lead}</p>}
      </div>
      {children}
    </div>
  )
}

export function Panel({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`mb-6 rounded-[18px] border-2 border-ink bg-white p-5 min-[600px]:p-6 ${className}`}>
      {title && <h2 className="mb-4 text-xl font-bold">{title}</h2>}
      {children}
    </section>
  )
}
