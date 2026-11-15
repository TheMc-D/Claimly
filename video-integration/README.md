# Claimly — Chert / FaceTime Integration

## Overview

This directory contains the Chert integration for Claimly.

Chert connects a FaceTime caller to a LiveKit room, allowing the caller to communicate with an AI agent through FaceTime.

The integration is designed to work alongside the ElevenLabs voice agent developed by Member 2.

## Architecture

The intended architecture is:

1. The user joins a FaceTime call using an iPhone.
2. The Chert connector runs locally on a Mac and connects the FaceTime browser guest to LiveKit.
3. The ElevenLabs-powered LiveKit agent joins the same LiveKit room.
4. The agent receives caller audio and sends its generated speech back through LiveKit.
5. The Claimly frontend connects to LiveKit.
6. The backend handles secure room-token generation and claim submission.

## Requirements

- Node.js 22.22 or newer
- Google Chrome
- An iPhone with FaceTime
- A LiveKit Cloud project
- A running LiveKit-compatible AI agent
- A short-lived LiveKit room token

## Project Structure

```text
video-integration/
├── .env
├── .env.example
├── .gitignore
├── generate-token.mjs
├── package.json
├── package-lock.json
└── README.md
```

## Environment Configuration

Create a local `.env` file containing:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

Never commit `.env` or expose API secrets in frontend code.

The `.env.example` file contains placeholders only and can be shared with teammates.

## Development Token Generation

The local development token generator uses the official LiveKit Server SDK.

Install the dependency:

```bash
npm install livekit-server-sdk
```

Generate a temporary development token:

```bash
node --env-file=.env generate-token.mjs
```

Current development configuration:

- Room: `claimly-dev`
- Connector identity: `chert-connector`
- Permissions: room join, publish, subscribe
- Token lifetime: 30 minutes

Generate a fresh token when the previous one expires.

This local token generator is for development only. The production application should use a secure backend endpoint managed by Member 4.

## Running Chert

Start the connector using:

```bash
npx @trychert/facetime-opensource
```

The CLI requests:

1. LiveKit server URL
2. Short-lived room token
3. AI agent participant identity
4. FaceTime link

The connector identity and AI agent identity must be different.

The AI agent must already be running and connected to the same LiveKit room before attempting a complete integration test.

## Team Responsibilities

| Member | Responsibility |
|---|---|
| Member 1 | Frontend and LiveKit client |
| Member 2 | ElevenLabs AI agent and LiveKit worker |
| Member 3 | Chert and FaceTime integration |
| Member 4 | FastAPI backend, token generation, claim submission |

## Important Integration Notes

- The LiveKit room must be shared between Chert and the AI agent.
- The connector needs a short-lived token with room join, publish, and subscribe permissions.
- API secrets must remain on the backend or in protected local development configuration.
- The Chert connector does not create or deploy the AI agent.
- The documented connector forwards FaceTime caller audio to the LiveKit room and returns agent audio and optional agent video.
- The documented connector does not establish that the caller's camera video is sent to the AI agent. Additional video-input integration may be necessary if Claimly requires visual product inspection.

## Shared LiveKit Configuration

- Room name: `claimly-dev`
- Chert connector identity: `chert-connector`
- ElevenLabs voice agent identity: `claimly-voice-agent`
- ElevenLabs worker dispatch name: `claimly-elevenlabs-bridge`

The Chert connector and ElevenLabs voice agent must join
the same LiveKit room using different participant identities.

The ElevenLabs worker must be running and dispatched
before attempting the complete integration test.

## Current Status

- [x] LiveKit Cloud project created
- [x] LiveKit URL and API credentials obtained
- [x] Node.js and Chrome verified
- [x] Chert CLI package tested
- [x] Local LiveKit SDK installed
- [x] Temporary token generation implemented
- [ ] ElevenLabs LiveKit worker completed
- [ ] Backend room-token endpoint completed
- [ ] Agent identity and room configuration confirmed
- [ ] Chert connected to the shared LiveKit room
- [ ] FaceTime integration tested
- [ ] End-to-end Claimly integration tested

## References

- Chert: https://github.com/cherthq/chert-facetime-opensource
- Chert setup guide: https://github.com/cherthq/chert-facetime-opensource/blob/main/docs/GUIDE.md
- LiveKit Cloud: https://cloud.livekit.io/
- ElevenLabs LiveKit integration: https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-engine/livekit-integration
