# Analysis Gateway Worker

Private Cloudflare Worker for framework analysis. It accepts only authenticated server-to-server requests; never call it from the browser.

## Setup

1. Create `workers/analysis-gateway/.dev.vars` from `.dev.vars.example` and choose a high-entropy `ANALYSIS_GATEWAY_TOKEN`.
2. Set the same value in the Vercel project as `ANALYSIS_GATEWAY_TOKEN`, alongside the deployed Worker URL as `ANALYSIS_GATEWAY_URL`.
3. Configure the production Worker secret with `wrangler secret put ANALYSIS_GATEWAY_TOKEN`.
4. Run `npm install`, `npm test`, and `npm run deploy` from this directory.

## Model selection

The Worker defaults to `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, a JSON Mode compatible 70B model. To switch without a code change, open **Cloudflare Dashboard → Workers & Pages → ba-own-analysis-gateway → Settings → Variables and Secrets**, add or update the non-secret variable `ANALYSIS_MODEL`, then deploy the Worker.

For a temporary highest-quality trial, set it to `@cf/deepseek-ai/deepseek-v4-pro-0813`. This model requires a Workers Paid plan or prepaid AI Gateway credits; if the account is not eligible, requests fail and the variable should be returned to the default model above. The Worker reserves 60 seconds for Browser Run and gives AI all remaining time within the 290-second Worker budget.

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
