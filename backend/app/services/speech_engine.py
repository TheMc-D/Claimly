import logging
import os

import httpx
from elevenlabs import AsyncElevenLabs
from fastapi import WebSocket
from openai import AsyncOpenAI
from starlette.websockets import WebSocketState

logger = logging.getLogger(__name__)

CLAIMLY_SYSTEM_PROMPT = """
You are Claimly, a friendly AI assistant helping customers create product claims.

Your responsibilities:
- Help customers report damaged or defective products.
- Ask one question at a time.
- Ask what product they have and what happened.
- Ask when and where they purchased it.
- Ask when they first noticed the problem.
- Ask whether they prefer a replacement, refund, or repair.
- Be conversational, clear, and concise.

Important rules:
- Never invent product details or purchase information.
- Never claim you have visually inspected a product unless actual
  visual inspection has been performed.
- Never claim a claim was submitted or approved unless the backend
  confirms it.
- Ask the customer to confirm their claim details before creation.
- Do not claim to create a claim yet; claim creation will be connected
  through a separate, verified backend action.
"""


async def handle_speech_engine_websocket(websocket: WebSocket):
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    engine_id = os.getenv("SPEECH_ENGINE_ID")

    if not elevenlabs_key or not openai_key or not engine_id:
        await websocket.close(
            code=1011,
            reason="Speech Engine configuration is incomplete",
        )
        return

    elevenlabs_http_client = httpx.AsyncClient(
        timeout=240,
        follow_redirects=True,
    )
    openai = None

    try:
        elevenlabs = AsyncElevenLabs(
            api_key=elevenlabs_key,
            httpx_client=elevenlabs_http_client,
        )
        openai = AsyncOpenAI(api_key=openai_key)

        engine = await elevenlabs.speech_engine.get(engine_id)

        if not engine.verify_request(dict(websocket.headers)):
            await websocket.close(
                code=1008,
                reason="Unauthorized Speech Engine connection",
            )
            return

        await websocket.accept()

        session = engine.create_session(websocket)

        async def handle_transcript(transcript):
            messages = [
                {"role": "system", "content": CLAIMLY_SYSTEM_PROMPT}
            ]

            for message in transcript:
                role = "assistant" if message.role == "agent" else message.role
                messages.append({
                    "role": role,
                    "content": message.content,
                })

            try:
                stream = await openai.responses.create(
                    model="gpt-4o-mini",
                    input=messages,
                    stream=True,
                )

                await session.send_response(stream)

            except Exception:
                logger.exception("Claimly speech response failed")
                await session.send_response(
                    "I'm sorry, I had trouble processing that. "
                    "Could you please say that again?"
                )

        session.on("user_transcript", handle_transcript)

        logger.info("Claimly Speech Engine session connected")

        await session.run()

    except Exception:
        logger.exception("Claimly Speech Engine connection failed")

        if websocket.application_state == WebSocketState.CONNECTED:
            try:
                await websocket.close(
                    code=1011,
                    reason="Speech Engine connection failed",
                )
            except RuntimeError:
                logger.debug("WebSocket was already closed")

    finally:
        if openai is not None:
            await openai.close()

        await elevenlabs_http_client.aclose()