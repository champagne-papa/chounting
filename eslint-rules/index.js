// eslint-rules/index.js
//
// Aggregates the custom ESLint rules registered under the
// `services` plugin namespace. Consumed by eslint.config.mjs.

'use strict';

module.exports = {
  rules: {
    'withInvariants-wrap-or-annotate': require('./withInvariants-wrap-or-annotate'),
  },
};
