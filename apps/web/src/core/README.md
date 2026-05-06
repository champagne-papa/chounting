# core/

Pure deterministic rules, math, validation helpers, and types
with no database, no network, no agent, no UI. Per ADR-0020
Decision item 2, this is the v2 proposal's "core/" not
"domain/" — avoiding DDD framing while preserving the
testability property.

Files live here only when extracted from existing services
under the opportunistic-migration rule (ADR-0020 Decision
item 6). First candidate per Phase 1: core/evidence/.
