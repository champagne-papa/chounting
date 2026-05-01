export function APQueueScreen() {
  return (
    <div className="mx-auto mt-20 max-w-[720px] text-center">
      <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-wide text-foreground/80">
        PHASE 2 ›
      </span>
      <h1 className="m-0 my-3 font-display text-[36px] font-semibold tracking-[-0.02em] text-foreground">
        AP Queue · coming in Phase 2
      </h1>
      <p className="mx-auto max-w-[540px] text-[14.5px] leading-[1.6] text-foreground/70">
        Phase 1.1 ships the engine. The AP Queue is specified but not yet built —
        controllers will see invoice intake, vendor matching, and a payment run here.
      </p>
      <div className="mx-auto mt-8 max-w-[560px] rounded-xl border border-border bg-muted px-4 py-4 text-left shadow-xs">
        <div className="mb-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          scope
        </div>
        <ul className="m-0 list-none p-0 text-[13px] leading-[1.7] text-foreground/70">
          <li>· Invoice intake (email, PDF, OCR)</li>
          <li>· Vendor + GL matching with confidence model</li>
          <li>· Three-way match against POs and receipts</li>
          <li>· Payment run with bank file export</li>
        </ul>
      </div>
    </div>
  );
}
