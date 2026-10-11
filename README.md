# Workload Placement Studio

Preliminary solution-placement and operating-model demonstrator with advisory OpenAI analysis. Institutional eligibility validation and final approval remain outside the questionnaire.

The assessment source is in `studio/`. GitHub Pages publishes that directory. The private Sites deployment runs the same assessment plus the authenticated AI service. See `AI_INTEGRATION.md` for configuration, privacy, access and deployment behavior.

Run `node tests/placement.cjs` and `node --test tests/ai-analysis.test.mjs`. The build and development commands copy the assessment to the generated assets automatically. Do not commit local secrets.
