#!/usr/bin/env python3
"""
AgentHelm Production Smoke Test
Automatically verifies key user-facing and SDK endpoints.
Run:
    export SMOKE_TEST_BASE_URL=http://localhost:3000
    export SMOKE_TEST_KEY=ahe_live_...
    python tests/smoke_test.py
"""

import os
import sys
import requests

BASE_URL = os.getenv("SMOKE_TEST_BASE_URL", "http://localhost:3000").rstrip("/")
CONNECT_KEY = os.getenv("SMOKE_TEST_KEY")

print(f"Starting production smoke test against: {BASE_URL}")

def test_endpoint(method, path, headers=None, json=None, expected_status=200):
    url = f"{BASE_URL}{path}"
    try:
        response = requests.request(method, url, headers=headers, json=json, timeout=10)
        if response.status_code == expected_status:
            print(f"  [PASS] {method} {path} -> {response.status_code}")
            return response
        else:
            print(f"  [FAIL] {method} {path} -> Expected {expected_status}, got {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            sys.exit(1)
    except Exception as e:
        print(f"  [ERROR] {method} {path} -> Connection failed: {e}")
        sys.exit(1)

# 1. Verify Homepage
print("\n1. Verifying Homepage...")
test_endpoint("GET", "/")

# 2. Verify Health endpoints
print("\n2. Verifying Public Infrastructure Health...")
test_endpoint("GET", "/api/health")
test_endpoint("GET", "/api/ready")

# 3. Verify SDK Connection & Registration (requires Key)
if CONNECT_KEY:
    print("\n3. Verifying SDK Ping/Registration...")
    headers = {"Authorization": f"Bearer {CONNECT_KEY}"}
    ping_payload = {
        "key": CONNECT_KEY,
        "name": "Smoke Test Agent",
        "agent_type": "python",
        "version": "1.1.0"
    }
    resp = test_endpoint("POST", "/api/sdk/ping", headers=headers, json=ping_payload)
    data = resp.json()
    agent_id = data.get("agent_id")
    print(f"  Agent registered: {agent_id}")

    # 4. Verify Context Injection
    print("\n4. Verifying Context Injection...")
    inject_payload = {
        "project": "AgentHelm Platform",
        "agent_id": agent_id,
        "task_hint": "database connection"
    }
    test_endpoint("POST", "/api/sdk/inject", headers=headers, json=inject_payload)

    # 5. Verify Proposal Publishing
    print("\n5. Verifying Proposal Publishing...")
    proposal_payload = {
        "project": "AgentHelm Platform",
        "content_hash": "smoke_test_hash_123",
        "payload": {
            "summary": "Verified system integration during smoke test",
            "decisions": ["Integrate smoke test automation into deploy process"],
            "files_modified": ["tests/smoke_test.py"],
            "tests_passed": True
        }
    }
    test_endpoint("POST", "/api/sdk/proposals", headers=headers, json=proposal_payload)
else:
    print("\nSkipping SDK & authenticated checks (SMOKE_TEST_KEY not set).")

print("\nSmoke test completed successfully!")
sys.exit(0)
