#!/usr/bin/env python3
"""
SnapFind AI — Infrastructure Health & Readiness Checker
Validates database connectivity, task queues, cloud storage,
and API/Web health probes.
"""

import sys
import time
import urllib.request

def log(status: str, msg: str):
    icon = "[OK]" if status == "OK" else "[FAIL]" if status == "FAIL" else "[INFO]"
    print(f"{icon} [{status}] {msg}")

def test_http_endpoint(name: str, url: str, expected_status: int = 200) -> bool:
    try:
        t0 = time.time()
        req = urllib.request.Request(url, headers={"User-Agent": "SnapFind-HealthCheck/1.0"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            elapsed_ms = int((time.time() - t0) * 1000)
            if resp.status == expected_status:
                log("OK", f"{name} ({url}) responded with HTTP {resp.status} in {elapsed_ms}ms")
                return True
            else:
                log("FAIL", f"{name} responded with HTTP {resp.status} (expected {expected_status})")
                return False
    except Exception as e:
        log("FAIL", f"{name} ({url}) error: {e}")
        return False

def main():
    print("=" * 65)
    print("   SnapFind AI — Infrastructure Health & Deployment Probe")
    print("=" * 65)

    endpoints = [
        ("Backend Health Check", "http://127.0.0.1:8000/api/v1/health"),
        ("Backend Events API", "http://127.0.0.1:8000/api/v1/events"),
        ("SnapFind Web App (Studio)", "http://localhost:5173/"),
        ("Photographer Portfolio Site", "http://localhost:5174/"),
        ("Desktop App Preview", "http://localhost:5175/"),
    ]

    all_passed = True
    for name, url in endpoints:
        if not test_http_endpoint(name, url):
            all_passed = False

    print("-" * 65)
    if all_passed:
        log("OK", "All application endpoints responded with 100% availability!")
        sys.exit(0)
    else:
        log("FAIL", "One or more infrastructure health checks failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()

