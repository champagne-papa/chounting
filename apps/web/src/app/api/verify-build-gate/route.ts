// THROWAWAY — verify-build-gate.
//
// This file contains a DELIBERATE syntax error (an unterminated function) so
// that `next build` fails to compile. Its only purpose is to turn the required
// `build (all workspaces)` check RED on a PR, so the branch-protection merge
// gate can be verified. DO NOT MERGE. This branch will be closed and deleted.
export function GET() {
  return new Response('verify-build-gate — this route intentionally does not compile'
// intentionally missing the closing paren and brace above → parse error
