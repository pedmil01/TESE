# Hybrid Placement Studio

Greenfield application and workload placement assessment based on Pedro Milagres’s thesis framework for hybrid IT infrastructure and operations in central banks.

## Run locally

The application is a static website with no build step or package installation required. From the repository root, run:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000 in a browser. Use an HTTP server rather than opening `index.html` directly, because the application loads its assessment model and PDF fonts using fetch.

## Validate

Node.js is required only to run the existing regression tests:

```sh
node tests/placement.cjs
```

## Contents

- `dist/`: complete website, assessment model, acronym glossary, and PDF report generation.
- `dist/vendor/`: bundled PDF libraries, fonts, and the included third-party license notices.
- `tests/placement.cjs`: regression checks for placement recommendations, AI authority, and infrastructure security.
- `THESIS_RULES.md`: governing rules and limits of the framework interpretation.
- `.openai/hosting.json`: existing ChatGPT Sites hosting configuration.

## Hosting

Serve `dist/` as the static web root. This source upload does not configure or activate GitHub Pages.

## Scope and limitations

Recommendations are provisional architecture proposals. They do not certify eligibility, regulatory compliance, or operational effectiveness, and remain subject to institutional validation. The assessment covers greenfield applications, infrastructure security concerns, AI infrastructure and operational authority, and operating models.

## Source snapshot

Imported from the existing Hybrid Placement Studio (currently titled Workload Placement Studio) on 2026-10-11.

Source commit: `1a919fddce8464d99765dde9609c5930e945eba8`.
