"""
Base abstractions and interfaces for WhatsApp messaging providers.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
import re
from typing import Any


@dataclass
class WhatsAppDeliveryResult:
    success: bool
    provider_message_id: str | None = None
    error: str | None = None
    provider: str = "mock"
    raw_response: dict[str, Any] | None = None


def normalize_e164_phone(phone: str) -> str:
    """
    Validates and normalizes phone number to standard E.164 format (+[1-9][0-9]{7,14}).
    Raises ValueError on invalid numbers.
    """
    if not phone or not isinstance(phone, str):
        raise ValueError("Phone number must be a non-empty string.")

    # Remove whitespace, parentheses, dashes, dots
    cleaned = re.sub(r"[\s\(\)\-\.]+", "", phone.strip())

    if not cleaned:
        raise ValueError("Phone number contains no valid digits.")

    # Ensure leading '+'
    if not cleaned.startswith("+"):
        if len(cleaned) == 10:
            cleaned = "+91" + cleaned
        else:
            cleaned = "+" + cleaned

    # E.164 pattern: + followed by 7 to 15 digits
    pattern = r"^\+[1-9]\d{6,14}$"
    if not re.match(pattern, cleaned):
        raise ValueError(
            f"Invalid phone number '{phone}'. Expected E.164 international format (e.g. +14155552671)."
        )

    return cleaned


class WhatsAppProvider(ABC):
    """Abstract interface for WhatsApp providers (Mock, Twilio, Meta Cloud API)."""

    provider_name: str = "base"

    @abstractmethod
    def send_transactional_results(
        self,
        recipient_phone: str,
        guest_name: str,
        event_name: str,
        results_url: str,
    ) -> WhatsAppDeliveryResult:
        """
        Sends transactional personal album results link to an event attendee.
        """
        pass

    @abstractmethod
    def send_marketing_message(
        self,
        recipient_phone: str,
        guest_name: str,
        message_text: str,
    ) -> WhatsAppDeliveryResult:
        """
        Sends promotional or follow-up communication to an opted-in guest.
        """
        pass
