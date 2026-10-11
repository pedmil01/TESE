# OpenAI analysis

The Sites deployment runs a private, authenticated `/api/ai-analysis` endpoint using the OpenAI Responses API. Runtime values are `OPENAI_API_KEY` (secret) and `OPENAI_MODEL` (default `gpt-5.4-mini`). Never place the key in source, GitHub Pages, browser storage, or the hosting manifest. OpenAI API usage requires its own credits/billing.

The model reviews the complete solution profile, assessment answers, optional explanations, sizing and decision notes against a server-controlled framework summary. This summary was checked against the current governing document on 11 October 2026. Advice is limited to 2000 words and does not modify the rule-based proposal, unresolved eligibility or pending institutional approval. It is included in the PDF only while it matches the current assessment. Editing any answer or note requires regeneration.

GitHub Pages continues to serve the static `dist/` assessment. Its AI button opens the authenticated Sites application and transfers the assessment through origin-checked `postMessage`. The protected window returns advice to the Pages report. If a sign-in flow or browser policy interrupts the window connection, use Export assessment on Pages and Import assessment on Sites, then generate the analysis there. The Site's access policy is preserved.

The frontend states that generating analysis sends all entered assessment data to OpenAI. Submission remains an explicit user action. The API uses `store:false`, has no execution tools, checks signed-in identity, rejects cross-origin requests, limits input size and throttles per-user requests within each Worker instance. It does not log keys or assessment text. Durable global spending limits should be managed in OpenAI Platform.

Build: `node scripts/sync-studio.mjs`, then the supported Sites build helper. Publish the Worker through Sites. The GitHub Pages workflow uploads only the static assessment directory; generated Worker bundles and local secrets are ignored.

Checks: `node tests/placement.cjs` and `node --test tests/ai-analysis.test.mjs`.
