# Claimly LiveKit integration

Implementation is local until reviewed, pushed, and deployed. No real project
token has been generated or live agent dispatched yet.

Agreed names:

- Room: `claimly-dev` (default `LIVEKIT_ROOM_NAME`)
- Chert participant: `chert-connector`
- Voice participant: `claimly-voice-agent`
- Voice worker dispatch name: `claimly-elevenlabs-bridge`

Configure `LIVEKIT_URL` (`wss://...`), `LIVEKIT_API_KEY`, and
`LIVEKIT_API_SECRET` from the same shared Claimly project in the backend's private
environment. Configure a separate random `LIVEKIT_TOKEN_ENDPOINT_SECRET` for
server-to-server authentication. Never put either secret in frontend code, git,
or request URLs. Locally load `.env` with uvicorn's `--env-file .env`.

Both endpoints require:

```text
Authorization: Bearer <LIVEKIT_TOKEN_ENDPOINT_SECRET>
```

## Chert token

`POST /api/livekit/chert-token` — no request body. The room and participant
identity are server-controlled; callers cannot request other identities or grants.

Example response (illustrative, not a real token):

```json
{
  "server_url": "wss://your-project.livekit.cloud",
  "room_name": "claimly-dev",
  "participant_identity": "chert-connector",
  "token": "<signed-jwt>",
  "expires_at": "2026-11-15T06:00:00Z",
  "expires_in": 3600
}
```

The JWT grants room join, publish, and subscribe. It does not grant room admin,
room creation/listing, recording, or data publishing. The response is not cached.
Keep tokens private and use only one concurrent Chert connection with this fixed
identity. Expiry controls token admission/reconnection; it is not a forced
one-hour disconnect for a participant already connected.

## Voice agent dispatch

`POST /api/livekit/dispatch` — no request body.

```json
{
  "dispatch_id": "AD_example",
  "room_name": "claimly-dev",
  "agent_name": "claimly-elevenlabs-bridge",
  "expected_participant_identity": "claimly-voice-agent",
  "status": "dispatched"
}
```

The voice teammate must run a worker registered with
`agent_name="claimly-elevenlabs-bridge"` in the same project and configure its
room connection identity as `claimly-voice-agent`. The backend passes
`{"participant_identity":"claimly-voice-agent"}` as dispatch metadata, but the
worker must explicitly consume that metadata or set its identity itself. Dispatch
does not enforce participant identity and does not prove the worker connected.

Repeat dispatch requests reuse an existing dispatch with that agent name in the
configured room. Concurrent deduplication assumes a single backend worker (the
MVP deployment). To verify the integration, confirm the actual participants in
the LiveKit room and test audio/video with teammates.

## Errors and deployment

- `401`: missing/wrong bearer secret.
- `503`: endpoint secret or project settings missing/invalid.
- `502`: dispatch could not be confirmed by LiveKit; retry safely.

After these changes are deployed, prefix routes with
`https://claimly-api-rkbt.onrender.com`. They are not available on the existing
deployment until the new code is pushed and deployed. Configure all environment
values in Render before calling. Use credentials from the shared project to
establish project membership; the names alone cannot confirm it.

Sources: [token grants](https://docs.livekit.io/frontends/reference/tokens-grants/),
[agent dispatch](https://docs.livekit.io/agents/server/agent-dispatch/).
