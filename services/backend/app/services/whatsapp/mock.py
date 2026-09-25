"""
Mock WhatsApp Provider for local development, staging, and automated test environments.
Logs payloads and simulates delivery without consuming real WhatsApp credits.
"""

import logging
import uuid
from app.services.whatsapp.base import WhatsAppDeliveryResult, WhatsAppProvider

logger = logging.getLogger("snapfind.whatsapp.mock")


class MockWhatsAppProvider(WhatsAppProvider):
    provider_name: str = "mock"

    def send_transactional_results(
        self,
        recipient_phone: str,
        guest_name: str,
        event_name: str,
        results_url: str,
    ) -> WhatsAppDeliveryResult:
        msg_id = f"mock_wa_tx_{uuid.uuid4().hex[:12]}"
        body = (
            f"Hi {guest_name}! 📸 Your personal photo gallery from {event_name} is ready. "
            f"View your matched photos here: {results_url}"
        )
        logger.info(
            f"[MOCK WHATSAPP TX] To: {recipient_phone} | Msg ID: {msg_id}\nContent: {body}"
        )
        return WhatsAppDeliveryResult(
            success=True,
            provider_message_id=msg_id,
            provider=self.provider_name,
            raw_response={"status": "delivered", "to": recipient_phone, "body": body},
        )

    def send_marketing_message(
        self,
        recipient_phone: str,
        guest_name: str,
        message_text: str,
    ) -> WhatsAppDeliveryResult:
        msg_id = f"mock_wa_mkt_{uuid.uuid4().hex[:12]}"
        logger.info(
            f"[MOCK WHATSAPP MKT] To: {recipient_phone} | Msg ID: {msg_id}\nContent: {message_text}"
        )
        return WhatsAppDeliveryResult(
            success=True,
            provider_message_id=msg_id,
            provider=self.provider_name,
            raw_response={"status": "delivered", "to": recipient_phone, "body": message_text},
        )

