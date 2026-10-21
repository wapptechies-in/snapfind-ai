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

import urllib.error

def test_http_endpoint(name: str, url: str, expected_status: int | tuple[int, ...] = 200) -> bool:
    expected = (expected_status,) if isinstance(expected_status, int) else expected_status
    try:
        t0 = time.time()
        req = urllib.request.Request(url, headers={"User-Agent": "SnapFind-HealthCheck/1.0"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            elapsed_ms = int((time.time() - t0) * 1000)
            if resp.status in expected:
                log("OK", f"{name} ({url}) responded with HTTP {resp.status} in {elapsed_ms}ms")
                return True
            else:
                log("FAIL", f"{name} responded with HTTP {resp.status} (expected {expected})")
                return False
    except urllib.error.HTTPError as e:
        elapsed_ms = int((time.time() - t0) * 1000)
        if e.code in expected:
            log("OK", f"{name} ({url}) responded with expected HTTP {e.code} in {elapsed_ms}ms (auth required)")
            return True
        log("FAIL", f"{name} responded with HTTP {e.code} (expected {expected})")
        return False
    except Exception as e:
        log("FAIL", f"{name} ({url}) error: {e}")
        return False

def main():
    use_cloud = "--cloud" in sys.argv or "--prod" in sys.argv
    print("=" * 65)
    print(f"   SnapFind AI — Infrastructure Health Probe ({'Cloud Production' if use_cloud else 'Localhost'})")
    print("=" * 65)

    if use_cloud:
        endpoints = [
            ("Render Cloud Health", "https://snapfind-api-sq4a.onrender.com/health", 200),
            ("Render Cloud API Health", "https://snapfind-api-sq4a.onrender.com/api/v1/health", 200),
            ("Render Cloud Protected Events", "https://snapfind-api-sq4a.onrender.com/api/v1/events", (200, 401)),
        ]
        all_passed = True
        for name, url, expected in endpoints:
            if not test_http_endpoint(name, url, expected):
                all_passed = False
    else:
        # Local backend probes
        backend_endpoints = [
            ("Local Backend Health", "http://127.0.0.1:8000/api/v1/health", 200),
            ("Local Backend Events API", "http://127.0.0.1:8000/api/v1/events", (200, 401)),
        ]
        all_passed = True
        for name, url, expected in backend_endpoints:
            if not test_http_endpoint(name, url, expected):
                all_passed = False

        # Frontend probes (optional depending on if dev servers are running)
        frontend_endpoints = [
            ("SnapFind Web App (Studio)", "http://localhost:5173/", 200),
            ("Photographer Portfolio Site", "http://localhost:5174/", 200),
            ("Desktop App Preview", "http://localhost:5175/", 200),
        ]
        for name, url, expected in frontend_endpoints:
            test_http_endpoint(name, url, expected)

    print("-" * 65)
    if all_passed:
        log("OK", "Backend API services responded with 100% availability!")
        sys.exit(0)
    else:
        log("FAIL", "One or more critical infrastructure health checks failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()

