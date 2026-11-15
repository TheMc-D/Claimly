# Claimly backend

Run these commands from `backend/` in PowerShell:

```powershell
uv venv --python 3.12
uv pip install -r requirements.txt
Copy-Item .env.example .env
uv run uvicorn app.main:app --env-file .env --reload --port 8000
```

Alternatively use `python -m venv .venv`, activate `.venv\Scripts\Activate.ps1`,
then use `pip install -r requirements.txt` and `uvicorn` directly.
Interactive API: http://localhost:8000/docs. Contract: [API contract](../docs/api-contract.md).

Tests (from `backend/`):

```powershell
uv run python -m unittest discover -s tests -v
```

SQLite stores claim metadata, uploaded bytes, and fictional inbox receipts. Set
`CLAIMLY_DB_PATH` to a writable file whose parent directory already exists.
`FRONTEND_URL` is the exact allowed browser origin, without a trailing slash.
Provider keys in `.env.example` are reserved for teammate integrations; this MVP
does not call external AI, voice, video, or email services.

## Container deployment

From the repository root:

```powershell
docker build -t claimly-api backend
docker volume create claimly-data
docker run --rm -p 8000:8000 --mount source=claimly-data,target=/data -e FRONTEND_URL=http://localhost:3000 claimly-api
```

Run one service instance with one persistent volume. SQLite is intended for this
small demo, not multiple replicas with separate disks. The container runs as UID
10001; the mounted data directory must be writable by that user.

## Deployment and GoDaddy handoff

Deployment provider and domain are not yet selected. The following is a concrete
Render deployment option, not an already deployed service:

1. Push the reviewed backend to your team's GitHub repository.
2. In Render create a Docker Web Service connected to that repository. Set the
   root directory to `backend` (Dockerfile is `./Dockerfile`).
3. Attach a persistent disk at `/data`; this requires a disk-capable paid service.
   Set `CLAIMLY_DB_PATH=/data/claimly.db` and `FRONTEND_URL` to the frontend origin.
   Set the health-check path to `/api/health`. Use a single service instance.
4. Deploy and check `https://<assigned-host>/api/health` and `/docs`. Run the full
   create/upload/assess/generate/submit flow, then verify it survives a restart.
5. Add `api.<your-domain>` as a custom domain in the hosting dashboard. Copy the
   exact DNS target it supplies. In GoDaddy's domain DNS page, add a CNAME with
   Name `api` and Value equal to that target hostname (no `https://` or path).
   If DNS is managed by another nameserver provider, edit the record there.
6. Complete domain verification in the host dashboard and wait for HTTPS to
   become active. Verify `https://api.<your-domain>/api/health`.
7. Give that HTTPS base URL and the API contract to teammates. The frontend owner
   configures their API base URL; you configure the matching `FRONTEND_URL`.

If you do not own a domain, choose and register one in your own GoDaddy account
before step 5. Domain registration and hosting can involve charges; no purchase,
deployment, DNS change, or Git push has been performed by these setup files.

This MVP has no authentication or user isolation. Use synthetic demonstration
data only; the inbox and evidence routes are accessible to anyone who can reach
the server. CORS is not authentication. Add access control before handling real
customer data.

Sources: [Render Docker](https://render.com/docs/docker),
[persistent disks](https://render.com/docs/disks),
[GoDaddy CNAME records](https://www.godaddy.com/help/add-a-cname-record-19236).

## Hackathon dashboard

The demo now uses `GET /api/claims` for a shared customer across devices, with
newest claims first. It intentionally lists every synthetic demo claim; there
is no customer authentication or isolation.

`POST /api/claims/{id}/corrections` appends a pending correction after submission.
It requires a nonblank `message` (up to 4000 characters) and a UUID `request_id`
for safe retries. Original submissions and inbox receipts are preserved. See
`docs/api-contract.md` for details. Deploy these backend routes together with
the updated frontend. No schema migration is needed for existing records.

## Full claim editing

`PUT /api/claims/{id}` updates the dashboard details and written request using
the current `version` as an optimistic concurrency check. Optional customer,
retailer, brand/model, order number, and purchase/issue dates are supported on
creation and editing. A submitted claim stays submitted and retains its original
receipt/inbox snapshot; previous values are recorded in revisions. Edits are not
merchant resubmissions. The frontend now uses a full Edit claim page instead of
the earlier correction-request form.
