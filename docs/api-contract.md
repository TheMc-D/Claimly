# Claimly API contract — MVP v1

Local base URL: `http://localhost:8000`. OpenAPI: `/openapi.json`;
interactive documentation: `/docs`. All JSON field names use snake_case.
IDs are opaque UUID strings; timestamps are UTC ISO 8601 strings.
The deployed HTTPS base URL will be shared after hosting and DNS are configured.

## Team ownership

| Owner | Integration |
| --- | --- |
| Frontend | Create/read claims, upload evidence, show camera guidance and draft, explicitly submit after review |
| Chert/video | Upload media, retrieve bytes, POST evidence quality assessment |
| ElevenLabs/AI | Read claim context, generate structured text, PUT draft; speak `camera.speech_text` or `draft.speech_text` |
| Backend/GoDaddy | Routes, validation, persistence, inbox, deployment, domain and DNS |

Provider SDKs, video calls, and audio generation belong to their respective
teammates. No provider API is called by this backend. `/generate` is a deterministic
template fallback for a working demo, not an AI model. Evidence is not visually
analyzed by this backend: the video integration (or a manual demo action) must
explicitly assess it. MIME type is checked against the declared upload type;
file contents are stored without decoding or malware scanning.

## Endpoints

| Method | Path | Input | Success response |
| --- | --- | --- | --- |
| GET | `/` | — | 200 `{ "message": "Welcome to Claimly API" }` |
| GET | `/api/health` | — | 200 `{ "status": "ok" }` |
| POST | `/api/claims` | CreateClaim JSON | 201 Claim |
| GET | `/api/claims/{id}` | — | 200 Claim |
| POST | `/api/claims/{id}/evidence` | multipart field `file` | 201 updated Claim |
| GET | `/api/claims/{id}/evidence/{evidence_id}/content` | — | 200 original media bytes, declared Content-Type |
| POST | `/api/claims/{id}/evidence/{evidence_id}/assessment` | Assessment JSON | 200 updated Claim |
| GET | `/api/claims/{id}/camera` | — | 200 CameraInstructions |
| POST | `/api/claims/{id}/generate` | no body | 200 Claim with fallback draft |
| PUT | `/api/claims/{id}/draft` | DraftInput JSON | 200 Claim with AI/reviewed draft |
| POST | `/api/claims/{id}/submit` | no body | 200 Submission |
| GET | `/api/merchant/inbox` | — | 200 Submission array, newest first |

### CreateClaim

```json
{
  "product": "Water bottle",
  "issue": "Cracked bottle",
  "requested_resolution": "replacement"
}
```

All fields required. `product`: 1–200 characters; `issue`: 1–4000 characters.
`requested_resolution`: `replacement`, `refund`, or `repair`.
Input strings are trimmed; blank strings and extra JSON fields are rejected.

### Claim response

```json
{
  "id": "0a9bf9a3-78bf-44bb-ab72-f28f0bd17ba2",
  "product": "Water bottle",
  "issue": "Cracked bottle",
  "requested_resolution": "replacement",
  "status": "draft",
  "created_at": "2026-11-14T22:00:00Z",
  "evidence": [],
  "camera": {
    "retake_required": true,
    "instructions": ["Capture a clear close-up of the damage and a full product view."],
    "speech_text": "Capture a clear close-up of the damage and a full product view."
  },
  "draft": null,
  "submission": null
}
```

### Evidence and Chert assessment

Upload one file per request. Accepted types: `image/jpeg`, `image/png`,
`image/webp`, `video/mp4`, `video/webm`. Maximum file size: 10 MiB
(10,485,760 bytes); empty files are rejected. Browser clients must let FormData
set the multipart boundary rather than setting Content-Type manually.

Each item in `Claim.evidence` has this shape:

```json
{
  "id": "b1b47750-0243-47a4-aa1d-ed5903af0fca",
  "filename": "damage.png",
  "content_type": "image/png",
  "size_bytes": 1024,
  "quality": "unassessed",
  "created_at": "2026-11-14T22:01:00Z"
}
```

Use the content route to fetch bytes for assessment or preview; it returns an
attachment with `X-Content-Type-Options: nosniff`. Evidence IDs are scoped to the
claim in the URL.

Assessment body:

```json
{ "quality": "blurry" }
```

Accepted quality values: `usable`, `blurry`, `too_dark`, `damage_not_visible`.
Only the backend assigns `unassessed` on upload. Assessments can be updated.
Blur prompts steady focus; darkness prompts better lighting; hidden damage
prompts closer framing. At least one `usable` item makes `retake_required` false.
Before that, generation and saving a draft return 409. `speech_text` joins the
instructions for ElevenLabs; the backend returns text, not audio.

### DraftInput and Draft

Member 2 can generate a draft from the GET Claim context and PUT this JSON to
`/api/claims/{id}/draft`. The frontend may use the same route to save edits.

```json
{
  "subject": "Replacement request: Water bottle",
  "body": "Hello, my water bottle is cracked. I am requesting a replacement.",
  "speech_text": "Your replacement request is ready for review."
}
```

All fields required and nonblank. Subject maximum: 300 characters; body and
speech_text maximum: 12000 each. The stored `Draft` has the same three fields.
`/generate` uses the claim's product, issue, resolution, and evidence count; it
does not invent order numbers, purchase dates, or merchant policy.

### Submission and fictional inbox

```json
{
  "id": "78fe40d2-f078-47d4-b7ca-facfa16428f9",
  "claim_id": "0a9bf9a3-78bf-44bb-ab72-f28f0bd17ba2",
  "inbox": "claims@fictional-merchant.invalid",
  "submitted_at": "2026-11-14T22:05:00Z",
  "draft": {
    "subject": "Replacement request: Water bottle",
    "body": "Hello, my water bottle is cracked. I am requesting a replacement.",
    "speech_text": "Your replacement request is ready for review."
  }
}
```

Submission stores a snapshot in the local database inbox. It sends no email or
external merchant request. Repeating submit returns the same receipt, with no
duplicate inbox message. The receipt is also available as `Claim.submission`.

## Lifecycle and errors

`draft` → `ready` when a draft is generated or saved → `submitted` on submit.
Uploading more evidence or changing an assessment clears the existing draft and
returns status to `draft`, requiring review again. Submitted claims reject all
mutations except repeat submit (which returns the existing receipt).

| Status | Meaning |
| --- | --- |
| 404 | Claim or evidence ID not found |
| 409 | Missing usable evidence, missing draft, or submitted claim mutation |
| 413 | File exceeds 10 MiB |
| 415 | Unsupported declared file media type |
| 422 | Invalid JSON/schema, missing multipart file, or empty file |

Business errors use `{ "detail": "description" }`. FastAPI schema validation
uses `{ "detail": [{ "loc": [...], "msg": "...", "type": "..." }] }`.
Clients should branch on HTTP status, not exact human-readable error text.

## Frontend upload example

```javascript
const form = new FormData();
form.append('file', file);
const response = await fetch(`${API_BASE}/api/claims/${claimId}/evidence`, {
  method: 'POST', body: form
});
if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
const claim = await response.json();
```

## Deployment boundary

SQLite persists claims, media bytes, and inbox messages. Configure a persistent
disk for deployment; ephemeral filesystems lose data. There is no authentication,
authorization, pagination, or real merchant delivery in this demo. All reachable
clients can access data: use synthetic data only. CORS allows `FRONTEND_URL`
(default `http://localhost:3000`); it is not access control. See
[backend deployment instructions](../backend/README.md) for Docker and GoDaddy.
