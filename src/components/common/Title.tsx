export function Title({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-w-0">
      <h1 className="text-xl font-semibold tracking-[-0.012em]">{title}</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
    </div>
  )
}
