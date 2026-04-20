# tests/e2e — Playwright harness

Project-side end-to-end harness introduced by Session 7.1.2. Runs real
Chromium against a local dev server and issues live API calls,
including **real Anthropic API calls** for agent-behavior scenarios.
Integration tests (`tests/integration/`) remain the project-side
workhorse for deterministic coverage; this harness is reserved for
EC-level scenarios that require real Claude + a real browser.

## First-run setup

```sh
pnpm test:e2e:install   # one-time: downloads Chromium + system deps
```

The `--with-deps` flag uses `sudo` on Linux/WSL to install the
libraries Chromium needs at runtime. Re-run after a Playwright
version bump.

## Environment prerequisites

- `.env.local` must contain `ANTHROPIC_API_KEY` (EC-19 issues real
  Claude calls — ~$0.02 per scenario at Opus pricing).
- Supabase local dev stack running (`pnpm db:start`) with seeded
  users (`pnpm db:seed:all`).
- Nothing listening on port 3000, OR a `pnpm dev` server already
  running there (config has `reuseExistingServer: !process.env.CI`).

## Running

```sh
pnpm test:e2e            # headless, sequential
pnpm test:e2e:ui         # headed + Playwright inspector UI
pnpm test:e2e ec-19      # filter to a single spec
```

## Auth model

A single `globalSetup` in `fixtures/auth.ts` signs in as the
controller seed user once per run and persists cookies to
`tests/e2e/.auth/user.json`. All specs inherit that session via the
default `use.storageState` in `playwright.config.ts`.

**`tests/e2e/.auth/` is gitignored.** The cookie persisted there is
a live credential; the seed *password* is not a secret (see
`docs/09_briefs/CURRENT_STATE.md` §Seed passwords).

## Output location

EC-19 writes per-run artifacts to `/tmp/ec-19-results-<timestamp>/`:

- `results.json` — the user message, selected entity (if any),
  captured `/api/agent/message` request + response bodies, and the
  verbatim agent response text for all three scenarios.
- `scenario-a.png`, `scenario-b.png`, `scenario-c.png` — full-page
  screenshots taken immediately after the agent's response appears.

The path is logged to stdout at the end of the run. Files are
ephemeral — each run creates a fresh directory; nothing persists
inside the repo.

## Founder review workflow (EC-19)

Per sub-brief Pre-decision 24, the spec does NOT render a pass/fail
verdict on the agent's natural-language response. Verdict authority
rests with founder + planner. After a run:

1. Open `results.json` and read each scenario's `agent_response_text`
   alongside its `selected_entity` and `user_message`.
2. Open the matching screenshot for visual sanity (card rendered?
   pill rendered? error banner?).
3. Apply the verdict rules from
   `docs/09_briefs/phase-1.2/canvas_context_injection.md`
   §Over-Anchoring Test:
   - **(a)** agent references the selected entry → pass;
     agent asks a clarification → under-anchored.
   - **(b)** agent answers about the explicitly named entry → pass;
     agent answers about the selected entry → **hard failure**.
   - **(c)** agent asks a clarification → pass;
     agent confidently answers about a ghost selection → over-anchored.

## Stop conditions

- `pnpm test:e2e:install` fails: surface the environment error to
  the founder. Do not work around.
- Playwright's `webServer` fails to start `pnpm dev`: investigate
  the local env (missing `.env.local`, Supabase not running, port
  collision), not the Playwright config.
- Text-based selectors ambiguate against multiple DOM matches: add
  stable `data-testid` attributes as part of the component's own
  scope, not inside this harness.
