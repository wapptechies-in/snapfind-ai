"""
Pydantic schemas for WhatsApp messaging and delivery logs.
"""

from pydantic import BaseModel, ConfigDict, Field, AliasChoices


class WhatsAppSendRequest(BaseModel):
    message_type: str = Field("transactional", validation_alias=AliasChoices("message_type", "messageType"))
    template_name: str | None = Field(None, validation_alias=AliasChoices("template_name", "templateName"))
    custom_message: str | None = Field(None, validation_alias=AliasChoices("custom_message", "customMessage", "message"))
    results_url: str | None = Field(None, validation_alias=AliasChoices("results_url", "resultsUrl"))


class WhatsAppSendResponse(BaseModel):
    success: bool
    providerMessageId: str | None = Field(None, validation_alias=AliasChoices("providerMessageId", "provider_message_id"))
    provider_message_id: str | None = None
    provider: str
    status: str
    message: str | None = None
    direct_share_url: str | None = None
    directShareUrl: str | None = Field(None, validation_alias=AliasChoices("direct_share_url", "directShareUrl"))

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class WhatsAppLogOut(BaseModel):
    id: str
    eventId: str
    guestId: str
    recipientPhone: str
    messageType: str
    provider: str
    status: str
    sentAt: str | None = None
    createdAt: str
    errorMessage: str | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

