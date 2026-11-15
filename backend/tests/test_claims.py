import tempfile
import unittest
from pathlib import Path
from uuid import uuid4
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

    def test_demo_dashboard_lists_agent_claims_without_browser_state(self):
        second = self.client.post('/api/claims', json={'product': 'Headphones', 'issue': 'Broken', 'requested_resolution': 'refund'}).json()
        response = self.client.get('/api/claims')
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item['id'] for item in response.json()], [second['id'], self.claim['id']])
        # A separate browser/session sees the same shared demo customer's claims.
        with TestClient(create_app(self.path)) as other_device:
            self.assertEqual(other_device.get('/api/claims').json(), response.json())
        # Old JSON records without the new field are still readable.
        self.assertEqual(response.json()[1]['corrections'], [])

    def test_corrections_preserve_submission_and_survive_restart(self):
        evidence_id = self.upload()
        self.assess(evidence_id, 'usable')
        self.client.post(self.url + '/generate')
        original_receipt = self.client.post(self.url + '/submit').json()
        original = self.client.get(self.url).json()
        payload = {'message': 'The crack is on the right side.', 'request_id': str(uuid4())}
        response = self.client.post(self.url + '/corrections', json=payload)
        self.assertEqual(response.status_code, 201)
        updated = response.json()
        self.assertEqual(updated['status'], 'submitted')
        self.assertEqual(updated['submission'], original_receipt)
        self.assertEqual(updated['draft'], original['draft'])
        self.assertEqual(updated['issue'], original['issue'])
        self.assertEqual(updated['corrections'][0]['status'], 'pending')
        self.assertEqual(updated['corrections'][0]['message'], payload['message'])
        # Retrying a saved request does not duplicate it.
        self.assertEqual(self.client.post(self.url + '/corrections', json=payload).json(), updated)
        changed = {**payload, 'message': 'A different correction'}
        self.assertEqual(self.client.post(self.url + '/corrections', json=changed).status_code, 409)
        with TestClient(create_app(self.path)) as restarted:
            self.assertEqual(restarted.get(self.url).json(), updated)
            self.assertEqual(restarted.get('/api/claims').json()[0], updated)
            self.assertEqual(restarted.get('/api/merchant/inbox').json(), [original_receipt])
            self.assertEqual(restarted.post(self.url + '/submit').json(), original_receipt)
        self.assertEqual(self.client.put(self.url + '/draft', json=original['draft']).status_code, 409)

    def test_corrections_require_submission_and_valid_message(self):
        payload = {'message': 'Please correct the issue.', 'request_id': str(uuid4())}
        self.assertEqual(self.client.post(self.url + '/corrections', json=payload).status_code, 409)
        self.assertEqual(self.client.post('/api/claims/missing/corrections', json=payload).status_code, 404)
        for message in ['   ', 'x' * 4001]:
            self.assertEqual(self.client.post(self.url + '/corrections', json={**payload, 'message': message}).status_code, 422)
        self.assertEqual(self.client.post(self.url + '/corrections', json={'message': 'Test', 'request_id': 'bad'}).status_code, 422)

    def test_edit_submitted_claim_preserves_receipt_and_tracks_versions(self):
        evidence_id = self.upload()
        self.assess(evidence_id, 'usable')
        self.client.post(self.url + '/generate')
        receipt = self.client.post(self.url + '/submit').json()
        original = self.client.get(self.url).json()
        payload = {key: original[key] for key in ['product', 'issue', 'requested_resolution', 'draft', 'version']}
        payload.update(product='Updated bottle', issue='Crack on the right side', customer_name='Demo Customer', retailer='Demo Store', purchase_date='2026-11-01')
        payload['draft'] = {**payload['draft'], 'body': 'Updated request for the crack on the right side.'}
        response = self.client.put(self.url, json=payload)
        self.assertEqual(response.status_code, 200)
        updated = response.json()
        self.assertEqual(updated['product'], 'Updated bottle')
        self.assertEqual(updated['customer_name'], 'Demo Customer')
        self.assertEqual(updated['purchase_date'], '2026-11-01')
        self.assertEqual(updated['version'], 1)
        self.assertEqual(updated['status'], 'submitted')
        self.assertEqual(updated['submission'], receipt)
        self.assertEqual(updated['evidence'], original['evidence'])
        self.assertEqual(updated['revisions'][0]['previous_details']['issue'], original['issue'])
        self.assertEqual(updated['revisions'][0]['previous_draft'], original['draft'])
        self.assertEqual(self.client.get('/api/merchant/inbox').json(), [receipt])
        # A stale editor must reload instead of overwriting another editor's changes.
        self.assertEqual(self.client.put(self.url, json=payload).status_code, 409)
        with TestClient(create_app(self.path)) as restarted:
            self.assertEqual(restarted.get(self.url).json(), updated)
            self.assertEqual(restarted.get('/api/claims').json()[0], updated)
        invalid = {**payload, 'version': 1, 'product': '  '}
        self.assertEqual(self.client.put(self.url, json=invalid).status_code, 422)
        self.assertEqual(self.client.put(self.url, json={**payload, 'version': 1, 'draft': None}).status_code, 422)

    def test_edit_draft_validation_and_noop(self):
        payload = {key: self.claim[key] for key in ['product', 'issue', 'requested_resolution', 'draft', 'version']}
        self.assertEqual(self.client.put(self.url, json=payload).json()['version'], 0)
        result = self.client.put(self.url, json={**payload, 'issue': 'Updated issue'}).json()
        self.assertEqual(result['issue'], 'Updated issue')
        self.assertEqual(result['status'], 'draft')
        invalid = {**payload, 'version': 1, 'purchase_date': 'not-a-date'}
        self.assertEqual(self.client.put(self.url, json=invalid).status_code, 422)
        self.assertEqual(self.client.put('/api/claims/missing', json=payload).status_code, 404)

    def test_cors_and_openapi(self):
        response = self.client.options('/api/claims', headers={'Origin': 'http://localhost:3000', 'Access-Control-Request-Method': 'POST'})
        self.assertEqual(response.headers['access-control-allow-origin'], 'http://localhost:3000')
        self.assertEqual(self.client.get('/openapi.json').status_code, 200)
        self.assertEqual(self.client.get('/api/health').json(), {'status': 'ok'})

if __name__ == '__main__':
    unittest.main()
