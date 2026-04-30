import { cn } from "@chounting/ui";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-12">
      <h1
        className={cn(
          "text-5xl font-semibold tracking-tight text-foreground",
        )}
      >
        Demo App
      </h1>
      <p className="max-w-md text-center text-muted-foreground">
        Design surface for chounting UI artifacts. Tokens load from{" "}
        <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm">
          @chounting/tokens
        </code>
        ; the{" "}
        <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm">
          cn
        </code>{" "}
        utility comes from{" "}
        <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm">
          @chounting/ui
        </code>
        .
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={cn(
            "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
            "shadow-sm transition-colors hover:bg-primary/90",
          )}
        >
          Primary
        </button>
        <button
          type="button"
          className={cn(
            "rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground",
            "shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground",
          )}
        >
          Secondary
        </button>
      </div>
    </main>
  );
}
