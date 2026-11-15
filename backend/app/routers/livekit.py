import os
import secrets
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.livekit_tokens import (
    ConnectorToken, LiveKitConfigurationError, generate_connector_token,
    AgentDispatchResponse, dispatch_voice_agent,
)

router = APIRouter(prefix='/api/livekit', tags=['LiveKit'])
bearer = HTTPBearer(auto_error=False)


def require_connector_secret(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
):
    expected = os.getenv('LIVEKIT_TOKEN_ENDPOINT_SECRET', '').strip()
    if not expected:
        raise HTTPException(503, 'LiveKit token endpoint is not configured')
    if credentials is None or not secrets.compare_digest(
        credentials.credentials.encode(), expected.encode(),
    ):
        raise HTTPException(401, 'Invalid connector credentials', headers={'WWW-Authenticate': 'Bearer'})


@router.post('/chert-token', response_model=ConnectorToken,
             dependencies=[Depends(require_connector_secret)])
def chert_token(response: Response):
    response.headers['Cache-Control'] = 'no-store'
    response.headers['Pragma'] = 'no-cache'
    try:
        return generate_connector_token()
    except LiveKitConfigurationError as error:
        raise HTTPException(503, str(error)) from error


@router.post('/dispatch', response_model=AgentDispatchResponse,
             dependencies=[Depends(require_connector_secret)])
async def dispatch(response: Response):
    response.headers['Cache-Control'] = 'no-store'
    try:
        return await dispatch_voice_agent()
    except LiveKitConfigurationError as error:
        raise HTTPException(503, str(error)) from error
    except Exception:
        # Do not forward provider errors, which can contain connection details.
        logging.getLogger(__name__).warning('LiveKit agent dispatch failed')
        raise HTTPException(502, 'LiveKit dispatch could not be confirmed; retry the request') from None
