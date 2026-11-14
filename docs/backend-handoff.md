# Backend handoff

Verified November 14, 2026 against the deployed API.

- Base URL: `https://claimly-api-rkbt.onrender.com`
- Interactive docs: `https://claimly-api-rkbt.onrender.com/docs`
- Machine-readable contract: `https://claimly-api-rkbt.onrender.com/openapi.json`
- Request/response details: [api-contract.md](api-contract.md)
- Deployed backend commit: `fbc3c7d`

The live API check passed: health, OpenAPI, claim creation, upload and byte
retrieval, blurry/usable assessment, retake text, fallback generation, structured
AI draft replacement, fictional inbox submission, repeat-submit deduplication,
submitted-state protection, and CORS for `http://localhost:3000`.
The assessment and AI draft in this check were simulated; this does not verify
the teammates' actual Chert, ElevenLabs, or frontend implementations.

## Frontend teammate

Use the base URL above for API calls and follow the API contract. For local work,
use `http://localhost:3000`. Once the frontend is hosted, provide its exact origin
to the backend owner, who sets Render's `FRONTEND_URL` environment variable and
redeploys. A GitHub repository URL is not the frontend's hosted origin.

## Video teammate

Upload with multipart field `file`; use the returned claim and evidence IDs.
Fetch evidence using the content route if needed. POST the quality assessment;
show or speak the returned camera instructions. At least one item must be usable
before drafting is allowed.

## AI/voice teammate

GET claim context and PUT structured text to `/api/claims/{id}/draft` with
`subject`, `body`, and `speech_text`. Use the returned text with ElevenLabs.
Submission is a separate action after review. `/generate` is a template fallback.

## Outstanding domain setup

`api.claimly.design` is added in Render but verification is pending. The DNS
check currently resolves it to `pixie.porkbun.com`. Porkbun is the authoritative
DNS provider. In the domain's Porkbun DNS settings add or edit only the `api`
CNAME to `claimly-api-rkbt.onrender.com`, then retry verification in Render.
If the parking response comes from a wildcard record, add an explicit `api`
record rather than changing the wildcard or the root domain.
Verify HTTPS and `/api/health` before sharing the branded API URL.

## Demo limitations

The free Render instance uses ephemeral SQLite storage: claims, media, and inbox
records can be lost across restarts/redeploys. It also sleeps when idle. This is
a synthetic-data demo with no authentication or real email/merchant delivery.
Persistent storage and access control remain necessary before real customer use.

