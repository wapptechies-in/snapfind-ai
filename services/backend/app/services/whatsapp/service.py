"""
High-level WhatsApp Service.
Orchestrates messaging delivery, strictly verifies user consents,
logs transmission records, and updates event metrics.
"""

from datetime import datetime, timezone
import logging
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.event import Event
from app.models.guest import Guest
from app.models.whatsapp import WhatsAppMessageLog
from app.services.whatsapp.base import WhatsAppDeliveryResult, WhatsAppProvider
from app.services.whatsapp.mock import MockWhatsAppProvider
from app.services.whatsapp.twilio import TwilioWhatsAppProvider

logger = logging.getLogger("snapfind.whatsapp.service")
settings = get_settings()


class WhatsAppService:
    def __init__(self, provider: WhatsAppProvider | None = None):
        if provider:
            self.provider = provider
        else:
            p_name = settings.WHATSAPP_PROVIDER.lower().strip()
            if p_name == "twilio":
                self.provider = TwilioWhatsAppProvider()
            else:
                self.provider = MockWhatsAppProvider()

    def send_results_link(
        self,
        guest: Guest,
        event: Event,
        results_url: str | None = None,
        db: Session | None = None,
    ) -> WhatsAppDeliveryResult:
        """
        Sends transactional personal album link to a registered guest.
        Strictly requires explicit consent: guest.consent_whatsapp_transactional == True.
        """
        if not guest.consent_whatsapp_transactional:
            logger.warning(
                f"Blocked WhatsApp transactional dispatch: Guest {guest.id} has not consented."
            )
            raise PermissionError(
                f"Guest '{guest.id}' has not consented to WhatsApp transactional messages."
            )

        if not results_url:
            results_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/event/{event.public_token}/results?guest={guest.id}"

        result = self.provider.send_transactional_results(
            recipient_phone=guest.whatsapp_number,
            guest_name=guest.name,
            event_name=event.name,
            results_url=results_url,
        )

        if db:
            log_entry = WhatsAppMessageLog(
                event_id=event.id,
                guest_id=guest.id,
                recipient_phone=guest.whatsapp_number,
                message_type="transactional",
                provider=result.provider,
                template_name="results_link",
                payload_text=f"Event: {event.name} | Results: {results_url}",
                status="delivered" if result.success else "failed",
                provider_message_id=result.provider_message_id,
                error_message=result.error,
                sent_at=datetime.now(timezone.utc) if result.success else None,
            )
            db.add(log_entry)

            if result.success:
                event.total_whatsapp_sent += 1

            db.commit()

        return result

    def send_marketing_message(
        self,
        guest: Guest,
        event: Event,
        message_text: str,
        db: Session | None = None,
    ) -> WhatsAppDeliveryResult:
        """
        Sends promotional or follow-up messaging to a registered guest.
        Strictly requires explicit consent: guest.consent_marketing == True.
        """
        if not guest.consent_marketing:
            logger.warning(
                f"Blocked WhatsApp marketing dispatch: Guest {guest.id} has not consented to marketing."
            )
            raise PermissionError(
                f"Guest '{guest.id}' has not consented to marketing communications."
            )

        result = self.provider.send_marketing_message(
            recipient_phone=guest.whatsapp_number,
            guest_name=guest.name,
            message_text=message_text,
        )

        if db:
            log_entry = WhatsAppMessageLog(
                event_id=event.id,
                guest_id=guest.id,
                recipient_phone=guest.whatsapp_number,
                message_type="marketing",
                provider=result.provider,
                template_name="promotional_followup",
                payload_text=message_text,
                status="delivered" if result.success else "failed",
                provider_message_id=result.provider_message_id,
                error_message=result.error,
                sent_at=datetime.now(timezone.utc) if result.success else None,
            )
            db.add(log_entry)
            db.commit()

        return result

