// src/agent/prompts/suffixes/localeDirective.ts
// Phase 1.2 Session 3 — one-line locale instruction appended to
// every system prompt per sub-brief Pre-decision 2. Tells Claude
// which locale's template_ids to use in the respondToUser tool
// call, matching the user's preferred language.

export type Locale = 'en' | 'fr-CA' | 'zh-Hant';

export function localeDirective(locale: Locale): string {
  switch (locale) {
    case 'en':
      return 'Respond in English.';
    case 'fr-CA':
      return 'Répondez en français canadien.';
    case 'zh-Hant':
      return '請以繁體中文回應。';
  }
}
