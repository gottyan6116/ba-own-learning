# Analysis Gateway Worker

Private Cloudflare Worker for framework analysis. It accepts only authenticated server-to-server requests; never call it from the browser.

## Setup

1. Create `workers/analysis-gateway/.dev.vars` from `.dev.vars.example` and choose a high-entropy `ANALYSIS_GATEWAY_TOKEN`.
2. Set the same value in the Vercel project as `ANALYSIS_GATEWAY_TOKEN`, alongside the deployed Worker URL as `ANALYSIS_GATEWAY_URL`.
3. Configure the production Worker secret with `wrangler secret put ANALYSIS_GATEWAY_TOKEN`.
4. Run `npm install`, `npm test`, and `npm run deploy` from this directory.

The Wrangler configuration supplies the `BROWSER` Browser Run binding and `AI` Workers AI binding. The Worker calls `BROWSER.quickAction("markdown")` directly, so it requires no Browser Run API token.

## Request contract

`POST /` with `Authorization: Bearer <ANALYSIS_GATEWAY_TOKEN>` and JSON:

```json
{
  "companyName": "Example Inc.",
  "sourceUrl": "https://example.com/about",
  "framework": "3c",
  "notes": "Optional context"
}
```

Supported framework IDs: `3c`, `five_forces`, `swot`, `pestel`, `stp`.

Errors use `{ "error": { "code": "…", "message": "…" } }`. Deterministic codes include `UNAUTHORIZED`, `INVALID_SOURCE_URL`, `CONTENT_FETCH_FAILED`, `CONTENT_TOO_LARGE`, `AI_RATE_LIMITED`, `AI_GENERATION_FAILED`, `AI_RESPONSE_INVALID`, and `REQUEST_TIMEOUT`.
