# contracts/agent-tools/

Formal interface between agent/tools/ and services/. Per
ADR-0020 Decision item 4, this is the canonical home for
tool input/output schemas. Existing schemas at
agent/tools/schemas/ and shared/schemas/accounting/ migrate
here only when their tool is naturally edited.

Capability subdirectories (per v2 §3): ledger/, onboarding/,
document/, evidence/, reference/. Created on first use.
