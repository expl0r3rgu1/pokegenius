# PokéGenius

## Approach

- Understand the constraint and choose the smallest correct solution. Avoid speculative abstractions, unrelated cleanup, and scope creep.
- Keep game rules in shared, pure domain logic. UI components display state and dispatch actions; do not duplicate scoring or turn rules in components.
- Reuse shared UI components. Put reusable appearance in the component and feature-specific layout at the call site.
- Prefer inferred types. Do not silence errors with `any`, blanket casts, or lint suppressions.
- Comments explain constraints or invariants; do not narrate code or record change history.
- Never write em dashes (U+2014) or en dashes (U+2013) anywhere. Use a hyphen (-).
- Consider rendering, subscription, network, and animation costs. Avoid extra polling and continuous repainting.

## Complete the behavior

- This is a static, client-only game. Do not add servers, runtime API dependencies, accounts, analytics, or secrets. Bundle game data and assets locally.
- Keep generation filters, round settings, scoring, turn changes, timers, results, and saved-game recovery consistent across all five games.
- Cover pending, failure, recovery, and reverse actions. Late results must not restore cancelled work.
- Account for mobile and desktop, touch and keyboard, reduced motion, and inaccessible storage. Never hide the answer only with alt text or visible labels during a silhouette challenge.
- Preserve unrelated work. Stop only task-owned processes by captured PID or session, never by name patterns. Never expose credentials.

## Verification

- Use pnpm, including its existing lockfile.
- Keep tests lean and behavioral. Cover non-obvious game rules, board solvability, timer boundaries, and saved-state validation. Avoid tests that mirror component implementation.
- Await completion signals in asynchronous tests. Use controlled clocks instead of arbitrary sleeps.
- Run focused checks appropriate to the change. A production release needs type checks, game tests, browser flows, and a production build.
- Desktop simulation does not prove physical phone keyboard or gesture behavior. Report verified paths and remaining gaps accurately.

## Documentation

- Add documentation only when it enables a user task or prevents a maintainer mistake. Keep setup and deployment separate from game instructions.
- Rewrite outdated text rather than appending a second account. Keep plans, research notes, scratch files, and PR summaries outside Git.
- When external documentation is needed, check installed dependency versions first, then use web search for official documentation matching the library, version, and API or error. Open relevant pages rather than relying on snippets.
- For unresolved bugs, inspect upstream source, issues, release notes, and migration guides. Treat community answers as leads and verify against official sources or installed code.
- Never invent APIs or configuration. If matching documentation is unavailable, state uncertainty and verify locally.
