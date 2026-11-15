import os
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch
from types import SimpleNamespace

import jwt
from fastapi.testclient import TestClient
from livekit import api

from app.main import create_app


class LiveKitTokenTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.client = TestClient(create_app(Path(self.tmp.name) / 'claims.db'))
        self.config = {
            'LIVEKIT_URL': 'wss://test-project.livekit.cloud',
            'LIVEKIT_API_KEY': 'test-key',
            'LIVEKIT_API_SECRET': 'synthetic-test-secret-long-enough-for-hs256',
            'LIVEKIT_ROOM_NAME': 'test-claimly-room',
            'LIVEKIT_TOKEN_ENDPOINT_SECRET': 'synthetic-connector-secret',
        }
        self.env = patch.dict(os.environ, self.config)
        self.env.start()

    def tearDown(self):
        self.env.stop()
        self.client.close()
        self.tmp.cleanup()

    def request(self, secret='synthetic-connector-secret'):
        return self.client.post('/api/livekit/chert-token', headers={'Authorization': f'Bearer {secret}'})

    def test_room_identity_permissions_signature_and_expiry(self):
        before = int(time.time())
        response = self.request()
        self.assertEqual(response.status_code, 200)
        result = response.json()
        api.TokenVerifier(self.config['LIVEKIT_API_KEY'], self.config['LIVEKIT_API_SECRET']).verify(result['token'])
        claims = jwt.decode(result['token'], self.config['LIVEKIT_API_SECRET'], algorithms=['HS256'],
                            issuer=self.config['LIVEKIT_API_KEY'])
        self.assertEqual(claims['iss'], self.config['LIVEKIT_API_KEY'])
        self.assertEqual(claims['sub'], 'chert-connector')
        self.assertEqual(claims['video']['room'], 'test-claimly-room')
        for grant in ('roomJoin', 'canPublish', 'canSubscribe'):
            self.assertTrue(claims['video'][grant])
        for grant in ('roomAdmin', 'roomCreate', 'roomList', 'roomRecord'):
            self.assertFalse(claims['video'].get(grant, False))
        self.assertFalse(claims['video']['canPublishData'])
        self.assertGreater(claims['exp'], before)
        self.assertLessEqual(claims['exp'], int(time.time()) + 3600)
        self.assertEqual(result['room_name'], 'test-claimly-room')
        self.assertEqual(result['server_url'], self.config['LIVEKIT_URL'])
        self.assertEqual(response.headers['cache-control'], 'no-store')
        self.assertNotIn(self.config['LIVEKIT_API_SECRET'], response.text)

    def test_missing_and_wrong_authentication(self):
        self.assertEqual(self.client.post('/api/livekit/chert-token').status_code, 401)
        self.assertEqual(self.request('wrong').status_code, 401)

    def test_missing_configuration_fails_closed(self):
        for name in self.config:
            with self.subTest(name=name), patch.dict(os.environ, {name: ''}):
                self.assertEqual(self.request().status_code, 503)

    def test_invalid_server_url(self):
        with patch.dict(os.environ, {'LIVEKIT_URL': 'https://not-a-livekit-websocket.example'}):
            self.assertEqual(self.request().status_code, 503)

    def test_agreed_default_room(self):
        with patch.dict(os.environ, self.config):
            os.environ.pop('LIVEKIT_ROOM_NAME', None)
            self.assertEqual(self.request().json()['room_name'], 'claimly-dev')

    def test_dispatch_creation_and_reuse(self):
        headers = {'Authorization': 'Bearer synthetic-connector-secret'}
        existing = SimpleNamespace(id='AD_test', agent_name='claimly-elevenlabs-bridge')
        client = SimpleNamespace(agent_dispatch=SimpleNamespace(
            list_dispatch=AsyncMock(side_effect=[[], [existing]]),
            create_dispatch=AsyncMock(return_value=existing),
        ))
        context = AsyncMock()
        context.__aenter__.return_value = client
        with patch('app.services.livekit_tokens.api.LiveKitAPI', return_value=context):
            first = self.client.post('/api/livekit/dispatch', headers=headers)
            second = self.client.post('/api/livekit/dispatch', headers=headers)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.json(), second.json())
        self.assertEqual(first.json()['expected_participant_identity'], 'claimly-voice-agent')
        client.agent_dispatch.create_dispatch.assert_awaited_once()
        request = client.agent_dispatch.create_dispatch.call_args.args[0]
        self.assertEqual(request.room, 'test-claimly-room')
        self.assertEqual(request.agent_name, 'claimly-elevenlabs-bridge')
        self.assertIn('claimly-voice-agent', request.metadata)

    def test_dispatch_auth_and_provider_error(self):
        self.assertEqual(self.client.post('/api/livekit/dispatch').status_code, 401)
        with patch('app.routers.livekit.dispatch_voice_agent', new=AsyncMock(side_effect=RuntimeError('private provider error'))):
            response = self.client.post('/api/livekit/dispatch', headers={'Authorization': 'Bearer synthetic-connector-secret'})
        self.assertEqual(response.status_code, 502)
        self.assertNotIn('private provider error', response.text)


if __name__ == '__main__':
    unittest.main()
