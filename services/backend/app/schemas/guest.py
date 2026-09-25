"""
Pydantic schemas for Guest Registration and Marketing Leads.
"""

from typing import Any
from pydantic import BaseModel, ConfigDict, Field, AliasChoices


class GuestRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, validation_alias=AliasChoices("name", "full_name"))
    whatsapp_number: str = Field(..., description="E.164 or national phone number for WhatsApp delivery", validation_alias=AliasChoices("whatsapp_number", "whatsappNumber", "phone"))
    email: str | None = Field(None, max_length=255)
    event_id_or_token: str = Field(..., description="Public token or event ID to register under", validation_alias=AliasChoices("event_id_or_token", "event_token", "event_id", "eventId", "token"))
    consent_selfie_processing: bool = Field(False, validation_alias=AliasChoices("consent_selfie_processing", "consentSelfieProcessing"))
    consent_whatsapp_transactional: bool = Field(False, validation_alias=AliasChoices("consent_whatsapp_transactional", "consentWhatsappTransactional"))
    consent_marketing: bool = Field(False, validation_alias=AliasChoices("consent_marketing", "consentMarketing"))
    source: str | None = None


class GuestOut(BaseModel):
    id: str
    eventId: str
    name: str
    full_name: str | None = None
    whatsappNumber: str
    whatsapp_number: str | None = None
    email: str | None = None
    consentSelfieProcessing: bool
    consent_selfie_processing: bool | None = None
    consentWhatsappTransactional: bool
    consent_whatsapp_transactional: bool | None = None
    consentMarketing: bool
    consent_marketing: bool | None = None
    createdAt: str
    created_at: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class MarketingLeadOut(BaseModel):
    id: str
    eventId: str
    photographerId: str
    guestId: str
    name: str
    full_name: str | None = None
    phone: str
    whatsapp_number: str | None = None
    email: str | None = None
    source: str
    optedInAt: str
    opted_in_at: str | None = None
    createdAt: str
    created_at: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

