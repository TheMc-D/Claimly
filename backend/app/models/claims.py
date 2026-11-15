from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class InputModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class CreateClaim(InputModel):
    product: str = Field(min_length=1, max_length=200)
    issue: str = Field(min_length=1, max_length=4000)
    requested_resolution: Literal["replacement", "refund", "repair"]
    customer_name: str = Field(default="", max_length=200)
    brand_model: str = Field(default="", max_length=200)
    retailer: str = Field(default="", max_length=200)
    order_number: str = Field(default="", max_length=200)
    purchase_date: date | None = None
    problem_noticed_date: date | None = None


class Assessment(InputModel):
    quality: Literal["usable", "blurry", "too_dark", "damage_not_visible"]


class CameraInstructions(BaseModel):
    retake_required: bool
    instructions: list[str]
    speech_text: str


class Evidence(BaseModel):
    id: str
    filename: str
    content_type: str
    size_bytes: int
    quality: Literal["unassessed", "usable", "blurry", "too_dark", "damage_not_visible"]
    created_at: datetime


class Draft(BaseModel):
    subject: str
    body: str
    speech_text: str


class DraftInput(InputModel):
    subject: str = Field(min_length=1, max_length=300)
    body: str = Field(min_length=1, max_length=12000)
    speech_text: str = Field(min_length=1, max_length=12000)


class Submission(BaseModel):
    id: str
    claim_id: str
    inbox: str
    submitted_at: datetime
    draft: Draft


class CorrectionInput(InputModel):
    message: str = Field(min_length=1, max_length=4000)
    request_id: UUID


class Correction(BaseModel):
    id: str
    message: str
    requested_at: datetime
    status: Literal["pending"] = "pending"


class EditClaim(CreateClaim):
    draft: DraftInput | None = None
    version: int = Field(ge=0)


class ClaimRevision(BaseModel):
    version: int
    edited_at: datetime
    previous_details: CreateClaim
    previous_draft: Draft | None = None


class Claim(CreateClaim):
    id: str
    status: Literal["draft", "ready", "submitted"]
    created_at: datetime
    evidence: list[Evidence] = Field(default_factory=list)
    camera: CameraInstructions
    draft: Draft | None = None
    submission: Submission | None = None
    corrections: list[Correction] = Field(default_factory=list)
    version: int = 0
    edited_at: datetime | None = None
    revisions: list[ClaimRevision] = Field(default_factory=list)
