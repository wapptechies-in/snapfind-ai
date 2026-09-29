#!/usr/bin/env python3
"""
SnapFind AI — Operator Trial Provisioning Script.
Provisions a dedicated, pre-approved, time-limited trial photographer account
and an isolated event for controlled client pilots.

Usage:
  python scripts/provision_trial.py --email client@example.com --studio "Acme Studios"
  python scripts/provision_trial.py --email client@example.com --status
  python scripts/provision_trial.py --email client@example.com --revoke
  python scripts/provision_trial.py --list
"""

import argparse
from datetime import date, datetime, timedelta, timezone
import os
import secrets
import string
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import func, select
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.event import Event, generate_event_id, generate_public_token
from app.models.photo import Photo
from app.models.photographer import Photographer, generate_photographer_id


def generate_secure_password(length: int = 16) -> str:
    """Generate a random cryptographically secure password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
    # Ensure at least one upper, lower, digit, and special char
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice("!@#$%^&*"),
    ]
    password += [secrets.choice(alphabet) for _ in range(length - 4)]
    secrets.SystemRandom().shuffle(password)
    return "".join(password)


def check_status(db, email: str):
    photographer = db.scalar(select(Photographer).where(Photographer.email == email.strip().lower()))
    if not photographer:
        print(f"[-] No photographer found with email: {email}")
        return

    events = db.scalars(select(Event).where(Event.photographer_id == photographer.id)).all()
    now = datetime.now(timezone.utc)
    trial_exp = photographer.trial_expires_at
    if trial_exp and trial_exp.tzinfo is None:
        trial_exp = trial_exp.replace(tzinfo=timezone.utc)

    is_expired = trial_exp and now > trial_exp

    print("=" * 80)
    print(f"SNAPFIND AI — ACCOUNT STATUS FOR: {photographer.email}")
    print("=" * 80)
    print(f"Photographer ID:    {photographer.id}")
    print(f"Studio Name:        {photographer.studio_name}")
    print(f"Role:               {photographer.role}")
    print(f"Approval Status:    {photographer.approval_status}")
    print(f"Account Active:     {photographer.is_active}")
    print(f"Subscription Tier:  {photographer.subscription_tier} ({photographer.subscription_status})")
    print(f"Trial Expires At:   {trial_exp.isoformat() if trial_exp else 'No limit'}")
    print(f"Trial Expired:      {'YES (ACCESS BLOCKED)' if is_expired else 'NO (Active)'}")
    print(f"Events Total:       {len(events)}")
    for ev in events:
        photo_count = db.scalar(select(func.count(Photo.id)).where(Photo.event_id == ev.id)) or 0
        print(f"  - Event: {ev.name} (ID: {ev.id}) | Token: {ev.public_token} | Status: {ev.status} | Photos: {photo_count}")
    print("=" * 80)


def revoke_account(db, email: str):
    photographer = db.scalar(select(Photographer).where(Photographer.email == email.strip().lower()))
    if not photographer:
        print(f"[-] No photographer found with email: {email}")
        return

    photographer.is_active = False
    photographer.approval_status = "suspended"
    photographer.trial_expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()

    print("=" * 80)
    print(f"[+] Successfully REVOKED trial account: {photographer.email}")
    print(f"    Account active: False, Status: suspended, Trial expired immediately.")
    print("=" * 80)


def list_trials(db):
    photographers = db.scalars(
        select(Photographer).order_by(Photographer.created_at.desc())
    ).all()

    now = datetime.now(timezone.utc)
    print("=" * 90)
    print(f"{'EMAIL':<30} {'STUDIO':<20} {'TIER':<8} {'EXPIRES AT':<20} {'EXPIRED?':<8}")
    print("=" * 90)
    for p in photographers:
        trial_exp = p.trial_expires_at
        if trial_exp and trial_exp.tzinfo is None:
            trial_exp = trial_exp.replace(tzinfo=timezone.utc)
        expired = "YES" if (trial_exp and now > trial_exp) else "NO"
        exp_str = trial_exp.strftime("%Y-%m-%d %H:%M") if trial_exp else "None"
        print(f"{p.email:<30} {p.studio_name[:18]:<20} {p.subscription_tier:<8} {exp_str:<20} {expired:<8}")
    print("=" * 90)


def provision_trial(db, args):
    email = args.email.strip().lower()
    studio_name = (args.studio or args.name or "Pilot Studio").strip()
    event_name = (args.event_name or f"{studio_name} Pilot Showcase").strip()
    event_date = args.event_date or date.today().isoformat()
    days = args.days or 14
    password = args.password or generate_secure_password(16)

    # Check if photographer already exists
    photographer = db.scalar(select(Photographer).where(Photographer.email == email))
    is_new = False
    if not photographer:
        is_new = True
        photographer = Photographer(
            id=generate_photographer_id(),
            email=email,
            studio_name=studio_name,
            display_name=studio_name,
            role="photographer",
            approval_status="approved",
            auth_provider="email",
            subscription_tier="free",
            subscription_status="active",
            max_active_events=5,
            max_photos_per_event=1000,
            hashed_password=hash_password(password),
            trial_expires_at=datetime.now(timezone.utc) + timedelta(days=days),
        )
        db.add(photographer)
        db.commit()
        db.refresh(photographer)
    else:
        # Update existing
        photographer.studio_name = studio_name
        photographer.approval_status = "approved"
        photographer.is_active = True
        photographer.subscription_tier = "free"
        photographer.subscription_status = "active"
        photographer.hashed_password = hash_password(password)
        photographer.trial_expires_at = datetime.now(timezone.utc) + timedelta(days=days)
        db.commit()
        db.refresh(photographer)

    # Provision isolated event for this photographer
    token = generate_public_token()
    event_id = generate_event_id()
    event = Event(
        id=event_id,
        photographer_id=photographer.id,
        name=event_name,
        event_type="Wedding",
        event_date=event_date,
        location="Pilot Client Venue",
        description="Controlled single-event client pilot with face search and guest gallery.",
        public_token=token,
        status="Active",
        is_active=True,
        face_search_enabled=True,
        downloads_enabled=True,
        original_downloads_enabled=True,
        watermark_enabled=False,
        paywall_enabled=False,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    expires_str = photographer.trial_expires_at.strftime("%Y-%m-%d %H:%M:%S UTC")

    print("\n" + "=" * 80)
    print("SNAPFIND AI — PILOT PROVISIONING CREDENTIALS (CONFIDENTIAL)")
    print("=" * 80)
    print(f"Action:             {'CREATED NEW PILOT ACCOUNT' if is_new else 'UPDATED PILOT ACCOUNT'}")
    print(f"Photographer ID:    {photographer.id}")
    print(f"Studio Name:        {photographer.studio_name}")
    print(f"Login Email:        {photographer.email}")
    print(f"Temporary Password: {password}")
    print(f"Trial Period:       {days} Days (Expires: {expires_str})")
    print(f"Tier:               Free Tier (No payment required, AI enabled)")
    print("-" * 80)
    print(f"Dedicated Event:    {event.name}")
    print(f"Event ID:           {event.id}")
    print(f"Public Token:       {event.public_token}")
    print(f"Client Gallery:     https://staging.snapfind.ai/event/{event.public_token}/gallery")
    print(f"API Endpoint:       https://staging-api.snapfind.ai")
    print("=" * 80)
    print("OPERATOR PRIVATE HANDOFF INSTRUCTIONS:")
    print("1. Deliver these credentials directly to the pilot client via private channel")
    print("   (e.g., encrypted chat, secure one-time link, or in person).")
    print("2. DO NOT commit, log, or save this password to disk or source control.")
    print("3. Ensure the client installs the SnapFind Desktop Windows pilot build.")
    print("4. Upon launch, verify connection to https://staging-api.snapfind.ai.")
    print(f"5. To revoke pilot access anytime: python scripts/provision_trial.py --email {email} --revoke")
    print("=" * 80 + "\n")


def main():
    parser = argparse.ArgumentParser(description="SnapFind AI Pilot Trial Provisioning Tool")
    parser.add_argument("--email", help="Client login email address")
    parser.add_argument("--studio", "--name", dest="studio", help="Photographer or Studio Name")
    parser.add_argument("--event-name", help="Name for dedicated pilot event")
    parser.add_argument("--event-date", help="Event date (YYYY-MM-DD)")
    parser.add_argument("--days", type=int, default=14, help="Trial duration in days (default: 14)")
    parser.add_argument("--password", help="Custom password (if omitted, secure password generated)")
    parser.add_argument("--status", action="store_true", help="Inspect status of client account")
    parser.add_argument("--revoke", action="store_true", help="Immediately revoke client pilot access")
    parser.add_argument("--list", action="store_true", help="List all trial accounts")

    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.list:
            list_trials(db)
        elif args.status:
            if not args.email:
                print("[-] --email is required with --status")
                sys.exit(1)
            check_status(db, args.email)
        elif args.revoke:
            if not args.email:
                print("[-] --email is required with --revoke")
                sys.exit(1)
            revoke_account(db, args.email)
        else:
            if not args.email:
                print("[-] --email is required to provision a trial account.")
                parser.print_help()
                sys.exit(1)
            provision_trial(db, args)
    finally:
        db.close()


if __name__ == "__main__":
    main()
