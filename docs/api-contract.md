
# Claimly API Contract

Base URL: http://localhost:8000

## Existing Endpoints

GET /
- Returns a welcome message.

GET /api/health
- Returns {"status": "ok"}.

## Planned Endpoints

POST /api/claims
- Create a new claim.

GET /api/claims/{id}
- Retrieve claim information.

POST /api/claims/{id}/evidence
- Upload evidence for a claim.

POST /api/claims/{id}/generate
- Generate an AI-assisted claim summary.

## Claim Data Structure

{
  "id": "claim-001",
  "product": "Water bottle",
  "issue": "Cracked bottle",
  "requested_resolution": "replacement",
  "status": "draft"
}

Note: Planned endpoints are not implemented yet.
The team should agree on request and response
schemas before integrating the frontend.
