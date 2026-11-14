import tempfile
import unittest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import create_app

class ClaimFlowTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / 'test.db'
        self.client = TestClient(create_app(self.path))
        self.claim = self.client.post('/api/claims', json={'product': 'Bottle', 'issue': 'Cracked', 'requested_resolution': 'replacement'}).json()
        self.url = '/api/claims/' + self.claim['id']

    def tearDown(self):
        self.client.close()
        self.tmp.cleanup()

    def upload(self):
        response = self.client.post(self.url + '/evidence', files={'file': ('damage.png', b'example-media', 'image/png')})
        self.assertEqual(response.status_code, 201)
        return response.json()['evidence'][-1]['id']

    def assess(self, evidence_id, quality):
        return self.client.post(self.url + '/evidence/' + evidence_id + '/assessment', json={'quality': quality})

    def test_full_flow_and_restart(self):
        self.assertEqual(self.client.post(self.url + '/generate').status_code, 409)
        evidence_id = self.upload()
        result = self.assess(evidence_id, 'blurry').json()
        self.assertTrue(result['camera']['retake_required'])
        self.assertIn('steady', result['camera']['speech_text'])
        self.assess(evidence_id, 'usable')
        result = self.client.post(self.url + '/generate').json()
        self.assertEqual(result['status'], 'ready')
        self.assertIn('Cracked', result['draft']['body'])
        receipt = self.client.post(self.url + '/submit').json()
        self.assertEqual(receipt, self.client.post(self.url + '/submit').json())
        with TestClient(create_app(self.path)) as restarted:
            self.assertEqual(restarted.get(self.url).json()['status'], 'submitted')
            self.assertEqual(restarted.get('/api/merchant/inbox').json(), [receipt])
        self.assertEqual(self.assess(evidence_id, 'blurry').status_code, 409)
        self.assertEqual(self.client.post(self.url + '/generate').status_code, 409)
        self.assertEqual(self.client.post(self.url + '/evidence', files={'file': ('x.png', b'x', 'image/png')}).status_code, 409)

    def test_validation_and_missing_resources(self):
        self.assertEqual(self.client.post('/api/claims', json={'product': ' ', 'issue': 'x', 'requested_resolution': 'refund'}).status_code, 422)
        self.assertEqual(self.client.get('/api/claims/missing').status_code, 404)
        self.assertEqual(self.assess('missing', 'usable').status_code, 404)
        self.assertEqual(self.client.post(self.url + '/submit').status_code, 409)
        for content, media, status in [(b'x', 'text/plain', 415), (b'', 'image/png', 422), (b'x' * (10 * 1024 * 1024 + 1), 'image/png', 413)]:
            self.assertEqual(self.client.post(self.url + '/evidence', files={'file': ('x', content, media)}).status_code, status)

    def test_evidence_changes_invalidate_draft(self):
        evidence_id = self.upload()
        self.assess(evidence_id, 'usable')
        self.client.post(self.url + '/generate')
        result = self.assess(evidence_id, 'too_dark').json()
        self.assertIsNone(result['draft'])
        self.assertEqual(result['status'], 'draft')
        self.assertEqual(self.client.post(self.url + '/submit').status_code, 409)
        self.assertEqual(self.assess(evidence_id, 'unknown').status_code, 422)

    def test_teammate_draft_and_media_integration(self):
        evidence_id = self.upload()
        content_url = self.url + '/evidence/' + evidence_id + '/content'
        response = self.client.get(content_url)
        self.assertEqual(response.content, b'example-media')
        self.assertEqual(response.headers['content-type'], 'image/png')
        draft = {'subject': 'AI draft', 'body': 'Replacement requested.', 'speech_text': 'Ready to review.'}
        self.assertEqual(self.client.put(self.url + '/draft', json=draft).status_code, 409)
        self.assess(evidence_id, 'usable')
        response = self.client.put(self.url + '/draft', json=draft)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['draft'], draft)
        self.assertEqual(self.client.post(self.url + '/submit').json()['draft'], draft)
        self.assertEqual(self.client.put(self.url + '/draft', json=draft).status_code, 409)
        other = self.client.post('/api/claims', json={'product': 'Other', 'issue': 'Broken', 'requested_resolution': 'refund'}).json()
        self.assertEqual(self.client.get('/api/claims/' + other['id'] + '/evidence/' + evidence_id + '/content').status_code, 404)

    def test_cors_and_openapi(self):
        response = self.client.options('/api/claims', headers={'Origin': 'http://localhost:3000', 'Access-Control-Request-Method': 'POST'})
        self.assertEqual(response.headers['access-control-allow-origin'], 'http://localhost:3000')
        self.assertEqual(self.client.get('/openapi.json').status_code, 200)
        self.assertEqual(self.client.get('/api/health').json(), {'status': 'ok'})

if __name__ == '__main__':
    unittest.main()
