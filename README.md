# BlackRoad OS — Sites

Sovereign static sites for BlackRoad OS. Privacy-first, offline-capable, zero dependencies.

## What's Working (as of 2026-03-04)

| Feature | Status | Details |
|---|---|---|
| Static site (HTML/CSS) | **Working** | 2 pages: Home, About |
| Development server | **Working** | `npm start` — zero-dependency Node.js server |
| Build to dist/ | **Working** | `npm run build` — copies and reports file sizes |
| HTML validation | **Working** | `npm run validate` — checks structure and privacy compliance |
| Test suite | **Working** | `npm test` — 43 tests, all passing |
| Security headers | **Working** | nosniff, DENY framing, no-referrer, permissions policy |
| Directory traversal protection | **Working** | Path normalization prevents `../` attacks |
| Privacy compliance | **Working** | Zero tracking, zero analytics, zero external CDN |
| 404 handling | **Working** | Custom 404 for missing routes |

**Test results: 43 passed, 0 failed.**

## Quick Start

```bash
# Run the development server
npm start

# Run all tests
npm test

# Validate HTML
npm run validate

# Build for production
npm run build
```

## Project Structure

```
sites/
  public/          Static site files served to visitors
    index.html     Home page
    about.html     About page
    styles.css     BlackRoad design system styles
  server.js        Zero-dependency development server
  build.js         Build script (copies public/ to dist/)
  validate.js      HTML structure and privacy validator
  test.js          End-to-end test suite (43 tests)
  package.json     Project configuration
```

## Principles

- **Sovereignty** — Users own their data and infrastructure
- **Privacy** — No telemetry, no tracking, no external dependencies
- **Offline-First** — Everything works without internet
- **Zero Dependencies** — Node.js standard library only

## License

Proprietary — BlackRoad OS, Inc. See [LICENSE](LICENSE).
