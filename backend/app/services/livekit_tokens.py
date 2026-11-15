"""Room-scoped connector tokens; project secrets never leave the server."""
import os
import asyncio
import json
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import jwt
from livekit import api
from pydantic import BaseModel


class LiveKitConfigurationError(ValueError):
    pass


ROOM_NAME = 'claimly-dev'
CHERT_IDENTITY = 'chert-connector'
VOICE_IDENTITY = 'claimly-voice-agent'
VOICE_AGENT_NAME = 'claimly-elevenlabs-bridge'


def project_config():
    names = ('LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET')
    config = {name: os.getenv(name, '').strip() for name in names}
    config['LIVEKIT_ROOM_NAME'] = os.getenv('LIVEKIT_ROOM_NAME', ROOM_NAME).strip()
    if any(not value for value in config.values()):
        raise LiveKitConfigurationError('LiveKit project credentials and room name must be configured')
    url = urlparse(config['LIVEKIT_URL'])
    if url.scheme != 'wss' or not url.hostname or url.username or url.password or url.query or url.fragment:
        raise LiveKitConfigurationError('LIVEKIT_URL must be a secure WebSocket URL without credentials')
    return config


class ConnectorToken(BaseModel):
    server_url: str
    room_name: str
    participant_identity: str
    token: str
    expires_at: datetime
    expires_in: int


def generate_connector_token():
    config = project_config()
    identity = CHERT_IDENTITY
    token = (api.AccessToken(config['LIVEKIT_API_KEY'], config['LIVEKIT_API_SECRET'])
             .with_identity(identity)
             .with_ttl(timedelta(hours=1))
             .with_grants(api.VideoGrants(
                 room_join=True, room=config['LIVEKIT_ROOM_NAME'],
                 can_publish=True, can_subscribe=True, can_publish_data=False,
             )).to_jwt())
    # Read the SDK-created expiry rather than approximating the issue time.
    claims = jwt.decode(token, config['LIVEKIT_API_SECRET'], algorithms=['HS256'],
                        issuer=config['LIVEKIT_API_KEY'])
    return ConnectorToken(server_url=config['LIVEKIT_URL'], room_name=config['LIVEKIT_ROOM_NAME'],
                          participant_identity=identity, token=token, expires_in=3600,
                          expires_at=datetime.fromtimestamp(claims['exp'], timezone.utc))


class AgentDispatchResponse(BaseModel):
    dispatch_id: str
    room_name: str
    agent_name: str
    expected_participant_identity: str
    status: str = 'dispatched'


# Prevent duplicate requests in the MVP's single worker. Listing existing remote
# dispatches also preserves deduplication across application restarts.
dispatch_lock = asyncio.Lock()


async def dispatch_voice_agent():
    config = project_config()
    async with dispatch_lock:
        async with api.LiveKitAPI(url=config['LIVEKIT_URL'], api_key=config['LIVEKIT_API_KEY'],
                                  api_secret=config['LIVEKIT_API_SECRET']) as client:
            existing = await client.agent_dispatch.list_dispatch(config['LIVEKIT_ROOM_NAME'])
            dispatch = next((item for item in existing if item.agent_name == VOICE_AGENT_NAME), None)
            if dispatch is None:
                dispatch = await client.agent_dispatch.create_dispatch(api.CreateAgentDispatchRequest(
                    room=config['LIVEKIT_ROOM_NAME'], agent_name=VOICE_AGENT_NAME,
                    metadata=json.dumps({'participant_identity': VOICE_IDENTITY}),
                ))
            return AgentDispatchResponse(dispatch_id=dispatch.id, room_name=config['LIVEKIT_ROOM_NAME'],
                                         agent_name=VOICE_AGENT_NAME,
                                         expected_participant_identity=VOICE_IDENTITY)
