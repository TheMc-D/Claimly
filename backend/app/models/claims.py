from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class InputModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class CreateClaim(InputModel):
    product: str = Field(min_length=1, max_length=200)
    issue: str = Field(min_length=1, max_length=4000)
    requested_resolution: Literal["replacement", "refund", "repair"]


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


class Claim(CreateClaim):
    id: str
    status: Literal["draft", "ready", "submitted"]
    created_at: datetime
    evidence: list[Evidence] = Field(default_factory=list)
    camera: CameraInstructions
    draft: Draft | None = None
    submission: Submission | None = None
