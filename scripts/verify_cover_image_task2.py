"""
Verification script for Task 2: Custom cover image on Event creation
Tests:
1. Upload custom cover photo via POST /api/v1/events/upload-cover
2. Create Event with custom cover image URL
3. Fetch Event by ID and verify coverImage matches the custom uploaded image
4. Create Event without custom cover image and verify fallback behavior
"""

import io
import sys
import httpx

BASE_URL = "http://127.0.0.1:8000"

def main():
    print("=== Task 2 Verification: Custom Cover Image on Event Creation ===")
    
    with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
        # Step 0: Login
        login_res = client.post("/api/v1/auth/login", json={"email": "photographer@snapfind.ai", "password": "Snapfind2026!"})
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        client.headers["Authorization"] = f"Bearer {login_res.json()['access_token']}"

        # Step 1: Upload a custom cover photo
        print("[1] Testing POST /api/v1/events/upload-cover...")
        # Create a tiny 1x1 JPEG in-memory
        tiny_jpeg = (
            b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb"
            b"\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r"
            b"\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c"
            b" $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01"
            b"\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01"
            b"\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06"
            b"\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
        )
        files = {
            "file": ("custom_event_cover.jpg", io.BytesIO(tiny_jpeg), "image/jpeg")
        }
        res = client.post("/api/v1/events/upload-cover", files=files)
        if res.status_code != 200:
            print(f"FAILED upload-cover: status {res.status_code} - {res.text}")
            sys.exit(1)
        
        cover_data = res.json()
        print(f"Uploaded cover successfully: {cover_data}")
        custom_url = cover_data.get("url")
        storage_key = cover_data.get("storageKey")
        assert custom_url, "Missing url in upload-cover response"
        assert storage_key, "Missing storageKey in upload-cover response"
        print("[OK] Custom cover photo uploaded to storage.")

        # Step 2: Create an event specifying this custom cover
        print("\n[2] Creating Event with custom cover image...")
        create_payload = {
            "name": "Custom Cover Wedding 2026",
            "eventType": "Wedding",
            "date": "2026-11-20",
            "location": "Sunset Beach Resort",
            "description": "Event with custom uploaded cover image",
            "coverImage": custom_url,
            "status": "Active",
        }
        res = client.post("/api/v1/events", json=create_payload)
        if res.status_code != 201:
            print(f"FAILED create_event: status {res.status_code} - {res.text}")
            sys.exit(1)
        
        event_custom = res.json()
        print(f"Event created: id={event_custom['id']}, coverImage={event_custom.get('coverImage')}")
        assert event_custom.get("coverImage") == custom_url, (
            f"Expected coverImage {custom_url}, got {event_custom.get('coverImage')}"
        )
        print("[OK] Event created with custom cover image persisted.")

        # Step 3: Verify GET /api/v1/events/{id} returns custom cover
        print("\n[3] Fetching Event by ID to verify cover image persistence...")
        res = client.get(f"/api/v1/events/{event_custom['id']}")
        assert res.status_code == 200
        fetched = res.json()
        assert fetched.get("coverImage") == custom_url
        assert fetched.get("cover_photo_url") == custom_url
        print(f"[OK] Event fetched: coverImage={fetched.get('coverImage')}")

        # Step 4: Create an event without custom cover image (fallback test)
        print("\n[4] Creating Event with no custom cover image (testing fallback)...")
        fallback_payload = {
            "name": "Default Cover Gala 2026",
            "eventType": "Corporate",
            "date": "2026-12-05",
            "location": "Convention Hall",
            "description": "Event testing default fallback cover",
            "coverImage": None,
            "status": "Active",
        }
        res = client.post("/api/v1/events", json=fallback_payload)
        assert res.status_code == 201
        event_fallback = res.json()
        fallback_cover = event_fallback.get("coverImage")
        print(f"Fallback event created: coverImage={fallback_cover}")
        assert fallback_cover and "http" in fallback_cover, "Expected fallback cover URL"
        print("[OK] Fallback cover image provided when no custom image chosen.")

        # Cleanup test events
        print("\n[5] Cleaning up test events...")
        client.delete(f"/api/v1/events/{event_custom['id']}")
        client.delete(f"/api/v1/events/{event_fallback['id']}")
        print("[OK] Cleanup completed.")

    print("\n==================================================")
    print("ALL TASK 2 COVER IMAGE TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    main()
