import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from fastapi import FastAPI, File, HTTPException, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware
from app.models.claims import Assessment, CameraInstructions, Claim, ClaimRevision, EditClaim, Correction, CorrectionInput, CreateClaim, Draft, DraftInput, Evidence, Submission
from app.services.store import Store

MAX_UPLOAD = 10 * 1024 * 1024
MEDIA_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'}

def now():
    return datetime.now(timezone.utc)

def camera(evidence):
    usable = any(e.quality == 'usable' for e in evidence)
    hints = {
        'blurry': 'Hold the camera steady and focus on the damage.',
        'too_dark': 'Move to brighter, even lighting and avoid shadows.',
        'damage_not_visible': 'Move closer and keep the damaged area in the frame.',
        'unassessed': 'Capture a clear close-up of the damage and a full product view.',
    }
    instructions = list(dict.fromkeys(hints[e.quality] for e in evidence if e.quality in hints))
    if usable:
        instructions = ['Evidence is ready. You can generate your draft.']
    elif not instructions:
        instructions = [hints['unassessed']]
    return CameraInstructions(retake_required=not usable, instructions=instructions, speech_text=' '.join(instructions))

def create_app(database_path=None):
    app = FastAPI(title='Claimly API', description='Local claims MVP; fictional deliveries only', version='1.0.0')
    app.add_middleware(CORSMiddleware, allow_origins=[os.getenv('FRONTEND_URL', 'http://localhost:3000')], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
    store = Store(str(database_path or os.getenv('CLAIMLY_DB_PATH', 'claimly.db')))

    def get(db, claim_id):
        row = db.execute('SELECT data FROM claims WHERE id = ?', (claim_id,)).fetchone()
        if not row:
            raise HTTPException(404, 'Claim not found')
        return Claim.model_validate_json(row[0])

    def save(db, claim):
        db.execute('INSERT OR REPLACE INTO claims VALUES (?, ?)', (claim.id, claim.model_dump_json()))
        return claim

    def editable(claim):
        if claim.status == 'submitted':
            raise HTTPException(409, 'Submitted claims cannot be changed')

    @app.get('/')
    def root():
        return {'message': 'Welcome to Claimly API'}

    @app.get('/api/health')
    def health():
        return {'status': 'ok'}

    @app.post('/api/claims', response_model=Claim, status_code=201)
    def create(payload: CreateClaim):
        claim = Claim(**payload.model_dump(), id=str(uuid4()), status='draft', created_at=now(), camera=camera([]))
        with store.connect() as db:
            return save(db, claim)

    @app.get('/api/claims', response_model=list[Claim])
    def list_demo_claims():
        # This MVP uses one shared demo customer; no account isolation is provided.
        with store.connect() as db:
            claims = [Claim.model_validate_json(row[0]) for row in db.execute('SELECT data FROM claims')]
            return sorted(claims, key=lambda claim: (claim.created_at, claim.id), reverse=True)

    @app.get('/api/claims/{claim_id}', response_model=Claim)
    def retrieve(claim_id: str):
        with store.connect() as db:
            return get(db, claim_id)

    @app.put('/api/claims/{claim_id}', response_model=Claim)
    def edit_claim(claim_id: str, payload: EditClaim):
        with store.connect() as db:
            claim = get(db, claim_id)
            if payload.version != claim.version:
                raise HTTPException(409, 'This claim was edited elsewhere. Reload it before saving your changes.')
            if claim.status == 'submitted' and payload.draft is None:
                raise HTTPException(422, 'A submitted claim must keep its written request')
            if payload.draft is not None and claim.status != 'submitted' and claim.camera.retake_required:
                raise HTTPException(409, 'Mark at least one evidence item usable before saving a draft')
            details = CreateClaim(**payload.model_dump(include=set(CreateClaim.model_fields)))
            draft = Draft(**payload.draft.model_dump()) if payload.draft else None
            previous = CreateClaim(**claim.model_dump(include=set(CreateClaim.model_fields)))
            if previous == details and claim.draft == draft:
                return claim
            edited_at = now()
            claim.revisions.append(ClaimRevision(version=claim.version, edited_at=edited_at, previous_details=previous, previous_draft=claim.draft))
            for field in CreateClaim.model_fields:
                setattr(claim, field, getattr(details, field))
            claim.draft = draft
            claim.version += 1
            claim.edited_at = edited_at
            if claim.status != 'submitted':
                claim.status = 'ready' if draft else 'draft'
            # Dashboard edits never replace the historical submission or inbox receipt.
            return save(db, claim)

    @app.post('/api/claims/{claim_id}/evidence', response_model=Claim, status_code=201)
    async def upload(claim_id: str, file: UploadFile = File(...)):
        try:
            with store.connect() as db:
                editable(get(db, claim_id))
            if file.content_type not in MEDIA_TYPES:
                raise HTTPException(415, 'Supported media: JPEG, PNG, WebP, MP4, WebM')
            content = await file.read(MAX_UPLOAD + 1)
            if len(content) > MAX_UPLOAD:
                raise HTTPException(413, 'Evidence exceeds 10 MiB')
            if not content:
                raise HTTPException(422, 'Evidence file is empty')
            evidence = Evidence(id=str(uuid4()), filename=Path((file.filename or 'evidence').replace(chr(92), '/')).name, content_type=file.content_type, size_bytes=len(content), quality='unassessed', created_at=now())
            with store.connect() as db:
                claim = get(db, claim_id)
                editable(claim)
                db.execute('INSERT INTO evidence VALUES (?, ?, ?)', (evidence.id, claim_id, content))
                claim.evidence.append(evidence)
                claim.camera = camera(claim.evidence)
                claim.draft, claim.status = None, 'draft'
                return save(db, claim)
        finally:
            await file.close()

    @app.post('/api/claims/{claim_id}/evidence/{evidence_id}/assessment', response_model=Claim)
    def assess(claim_id: str, evidence_id: str, payload: Assessment):
        with store.connect() as db:
            claim = get(db, claim_id)
            editable(claim)
            evidence = next((e for e in claim.evidence if e.id == evidence_id), None)
            if evidence is None:
                raise HTTPException(404, 'Evidence not found')
            evidence.quality = payload.quality
            claim.camera = camera(claim.evidence)
            claim.draft, claim.status = None, 'draft'
            return save(db, claim)

    @app.get('/api/claims/{claim_id}/evidence/{evidence_id}/content')
    def evidence_content(claim_id: str, evidence_id: str):
        with store.connect() as db:
            claim = get(db, claim_id)
            evidence = next((e for e in claim.evidence if e.id == evidence_id), None)
            if evidence is None:
                raise HTTPException(404, 'Evidence not found')
            row = db.execute('SELECT content FROM evidence WHERE id = ? AND claim_id = ?', (evidence_id, claim_id)).fetchone()
            return Response(content=row[0], media_type=evidence.content_type,
                            headers={'Content-Disposition': 'attachment', 'X-Content-Type-Options': 'nosniff'})

    @app.put('/api/claims/{claim_id}/draft', response_model=Claim)
    def accept_draft(claim_id: str, payload: DraftInput):
        with store.connect() as db:
            claim = get(db, claim_id)
            editable(claim)
            if claim.camera.retake_required:
                raise HTTPException(409, 'Mark at least one evidence item usable before saving a draft')
            claim.draft = Draft(**payload.model_dump())
            claim.status = 'ready'
            return save(db, claim)

    @app.get('/api/claims/{claim_id}/camera', response_model=CameraInstructions)
    def instructions(claim_id: str):
        with store.connect() as db:
            return get(db, claim_id).camera

    @app.post('/api/claims/{claim_id}/generate', response_model=Claim)
    def generate(claim_id: str):
        with store.connect() as db:
            claim = get(db, claim_id)
            editable(claim)
            if claim.camera.retake_required:
                raise HTTPException(409, 'Upload evidence and mark at least one item usable before generating')
            body = (f'Hello Fictional Merchant,\n\nI am requesting a {claim.requested_resolution} for my {claim.product}.\n\nIssue: {claim.issue}\n\nI have provided {len(claim.evidence)} evidence item(s) for review. Please let me know the next steps.\n\nThank you.')
            claim.draft = Draft(subject=f'{claim.requested_resolution.capitalize()} request: {claim.product}', body=body, speech_text=body)
            claim.status = 'ready'
            return save(db, claim)

    @app.post('/api/claims/{claim_id}/submit', response_model=Submission)
    def submit(claim_id: str):
        with store.connect() as db:
            claim = get(db, claim_id)
            if claim.submission:
                return claim.submission
            if claim.draft is None or claim.status != 'ready':
                raise HTTPException(409, 'Generate a draft before submitting')
            submission = Submission(id=str(uuid4()), claim_id=claim.id, inbox='claims@fictional-merchant.invalid', submitted_at=now(), draft=claim.draft)
            db.execute('INSERT INTO inbox VALUES (?, ?, ?)', (submission.id, claim.id, submission.model_dump_json()))
            claim.submission, claim.status = submission, 'submitted'
            save(db, claim)
            return submission

    @app.post('/api/claims/{claim_id}/corrections', response_model=Claim, status_code=201)
    def request_correction(claim_id: str, payload: CorrectionInput):
        with store.connect() as db:
            claim = get(db, claim_id)
            if claim.status != 'submitted' or claim.submission is None:
                raise HTTPException(409, 'Corrections can only be requested after submission')
            correction_id = str(payload.request_id)
            existing = next((item for item in claim.corrections if item.id == correction_id), None)
            if existing:
                if existing.message != payload.message:
                    raise HTTPException(409, 'This request ID was already used for another correction')
                return claim
            claim.corrections.append(Correction(id=correction_id, message=payload.message, requested_at=now()))
            # Append a pending request; never rewrite the original draft, receipt, or inbox.
            return save(db, claim)

    @app.get('/api/merchant/inbox', response_model=list[Submission])
    def inbox():
        with store.connect() as db:
            return [Submission.model_validate_json(row[0]) for row in db.execute('SELECT data FROM inbox ORDER BY rowid DESC')]

    return app

app = create_app()
