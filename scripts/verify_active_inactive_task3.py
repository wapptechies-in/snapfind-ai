"""
Verification script for Task 3: Active / Inactive toggle for Events.
Tests:
1. Create Event -> Verify is_active=True and status="Active"
2. Guest public access while Active -> Returns 200 OK
3. Toggle Event to Inactive -> Verify is_active=False and status="Inactive"
4. Guest public access while Inactive -> Returns 403 Forbidden ("This event is currently unavailable")
5. Face search while Inactive -> Returns 403 Forbidden ("This event is currently unavailable")
6. Toggle Event back to Active -> Returns 200 OK again
"""

import httpx
import sys

BASE_URL = "http://127.0.0.1:8000"


def main():
    print("=== Task 3 Verification: Active / Inactive Toggle for Events ===")

    with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
        # Step 1: Create an Event
        print("[1] Creating new Event...")
        create_payload = {
            "name": "Task 3 Active Test Gala",
            "eventType": "Corporate",
            "date": "2026-10-15",
            "location": "Skyline Convention Center",
            "status": "Active",
            "isActive": True,
        }
        res = client.post("/api/v1/events", json=create_payload)
        if res.status_code != 201:
            print(f"FAILED create_event: {res.status_code} - {res.text}")
            sys.exit(1)

        event = res.json()
        event_id = event["id"]
        token = event["token"]
        print(f"Event created: id={event_id}, token={token}, status={event.get('status')}, isActive={event.get('isActive')}")
        assert event.get("isActive") is True, f"Expected isActive=True, got {event.get('isActive')}"
        assert event.get("status") == "Active", f"Expected status='Active', got {event.get('status')}"
        print("[OK] Event initialized with Active status.")

        # Step 2: Public gallery access while Active
        print("\n[2] Checking public gallery access while Active...")
        res = client.get(f"/api/v1/events/{token}/public-photos")
        assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}: {res.text}"
        print("[OK] Public gallery accessible while event is Active.")

        # Step 3: Toggle Event to Inactive
        print("\n[3] Toggling Event to Inactive via PATCH /api/v1/events/{id}...")
        res = client.patch(f"/api/v1/events/{event_id}", json={"isActive": False})
        assert res.status_code == 200, f"Failed patch: {res.status_code} - {res.text}"
        updated = res.json()
        assert updated.get("isActive") is False, f"Expected isActive=False, got {updated.get('isActive')}"
        assert updated.get("status") == "Inactive", f"Expected status='Inactive', got {updated.get('status')}"
        print(f"[OK] Event status successfully updated: status={updated.get('status')}, isActive={updated.get('isActive')}")

        # Step 4: Verify public gallery access while Inactive
        print("\n[4] Checking public gallery access while Inactive...")
        res = client.get(f"/api/v1/events/{token}/public-photos")
        print(f"Public gallery response status: {res.status_code} - {res.json()}")
        assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}"
        assert "This event is currently unavailable" in res.json().get("detail", ""), (
            f"Expected 'This event is currently unavailable' detail, got: {res.json()}"
        )
        print("[OK] Public gallery blocked with 'This event is currently unavailable'.")

        # Step 5: Verify AI face search while Inactive
        print("\n[5] Checking AI selfie search endpoint while Inactive...")
        tiny_jpeg = (
            b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb"
            b"\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r"
            b"\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c"
            b" $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01"
            b"\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01"
            b"\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06"
            b"\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
        )
        files = {"selfie": ("selfie.jpg", tiny_jpeg, "image/jpeg")}
        data = {"token": token}
        res = client.post("/api/v1/ai/search", data=data, files=files)
        assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}"
        assert "This event is currently unavailable" in res.json().get("detail", "")
        print("[OK] Selfie search blocked with 'This event is currently unavailable'.")

        # Step 6: Toggle back to Active
        print("\n[6] Toggling Event back to Active...")
        res = client.patch(f"/api/v1/events/{event_id}", json={"isActive": True})
        assert res.status_code == 200
        reactivated = res.json()
        assert reactivated.get("isActive") is True
        assert reactivated.get("status") == "Active"

        res = client.get(f"/api/v1/events/{token}/public-photos")
        assert res.status_code == 200
        print("[OK] Event reactivated successfully and public gallery is restored.")

        # Cleanup
        print("\n[7] Cleaning up test event...")
        client.delete(f"/api/v1/events/{event_id}")
        print("[OK] Cleanup completed.")

    print("\n========================================================")
    print("ALL TASK 3 ACTIVE / INACTIVE TOGGLE TESTS PASSED (100%)!")
    print("========================================================")


if __name__ == "__main__":
    main()

