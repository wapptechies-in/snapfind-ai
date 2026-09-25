"""
Twilio WhatsApp Provider for production messaging delivery.
"""

import logging
from app.core.config import get_settings
from app.services.whatsapp.base import WhatsAppDeliveryResult, WhatsAppProvider

logger = logging.getLogger("snapfind.whatsapp.twilio")


class TwilioWhatsAppProvider(WhatsAppProvider):
    provider_name: str = "twilio"

    def __init__(self):
        self.settings = get_settings()
        self.account_sid = self.settings.TWILIO_ACCOUNT_SID
        self.auth_token = self.settings.TWILIO_AUTH_TOKEN
        self.from_number = self.settings.TWILIO_WHATSAPP_NUMBER

    def send_transactional_results(
        self,
        recipient_phone: str,
        guest_name: str,
        event_name: str,
        results_url: str,
    ) -> WhatsAppDeliveryResult:
        if not self.account_sid or not self.auth_token:
            logger.warning("Twilio credentials not configured; falling back to simulated send.")
            return WhatsAppDeliveryResult(
                success=True,
                provider_message_id=f"tw_sim_{recipient_phone[-4:]}",
                provider="twilio_simulated",
                raw_response={"notice": "Simulated send due to missing credentials"},
            )

        try:
            from twilio.rest import Client
            client = Client(self.account_sid, self.auth_token)

            body = (
                f"Hi {guest_name}! 📸 Your photos from {event_name} are ready. "
                f"View and download them here: {results_url}"
            )
            message = client.messages.create(
                from_=f"whatsapp:{self.from_number}",
                to=f"whatsapp:{recipient_phone}",
                body=body,
            )
            return WhatsAppDeliveryResult(
                success=True,
                provider_message_id=message.sid,
                provider=self.provider_name,
                raw_response={"sid": message.sid, "status": message.status},
            )
        except Exception as e:
            logger.error(f"Failed to send Twilio WhatsApp message to {recipient_phone}: {e}")
            return WhatsAppDeliveryResult(
                success=False,
                error=str(e),
                provider=self.provider_name,
            )

    def send_marketing_message(
        self,
        recipient_phone: str,
        guest_name: str,
        message_text: str,
    ) -> WhatsAppDeliveryResult:
        if not self.account_sid or not self.auth_token:
            logger.warning("Twilio credentials not configured; falling back to simulated send.")
            return WhatsAppDeliveryResult(
                success=True,
                provider_message_id=f"tw_mkt_sim_{recipient_phone[-4:]}",
                provider="twilio_simulated",
                raw_response={"notice": "Simulated send due to missing credentials"},
            )

        try:
            from twilio.rest import Client
            client = Client(self.account_sid, self.auth_token)

            message = client.messages.create(
                from_=f"whatsapp:{self.from_number}",
                to=f"whatsapp:{recipient_phone}",
                body=message_text,
            )
            return WhatsAppDeliveryResult(
                success=True,
                provider_message_id=message.sid,
                provider=self.provider_name,
                raw_response={"sid": message.sid, "status": message.status},
            )
        except Exception as e:
            logger.error(f"Failed to send Twilio marketing WhatsApp to {recipient_phone}: {e}")
            return WhatsAppDeliveryResult(
                success=False,
                error=str(e),
                provider=self.provider_name,
            )

