"""
Live test script — run with:
python test_live.py

Prerequisites:
1. Next.js dev server running: npm run dev
2. Valid connect key in AGENTHELM_KEY env var
   OR replace the key below directly
"""

import os
import time
import agenthelm

KEY = os.getenv("AGENTHELM_KEY", "ahe_live_your-key-here")

print("Starting AgentHelm SDK live test...")
print(f"Using key: {KEY[:15]}...")

dock = agenthelm.connect(
    key=KEY,
    name="SDK Test Agent",
    agent_type="python",
    version="0.1.0",
    base_url="http://localhost:3000/api/sdk"
)

print("\nTest 1: Basic logging")
dock.log("SDK test started")
dock.log("This is an info message", level="info")
dock.log("This is a warning", level="warning")
dock.log("This is a success", level="success")
time.sleep(1)

print("\nTest 2: Error logging")
try:
    raise ValueError("Test error for AgentHelm")
except Exception as e:
    dock.error("Test error occurred", exception=e)
time.sleep(1)

print("\nTest 3: Token tracking")
dock.track_tokens(
    used=1500,
    model="gemini-2.0-flash",
    cost_per_1k=0.0001
)
dock.track_tokens(
    used=800,
    model="gemini-2.0-flash",
    prompt_tokens=500,
    completion_tokens=300
)
time.sleep(1)

print("\nTest 4: Structured output")
dock.output({
    "test": True,
    "items_processed": 42,
    "success_rate": 0.97,
    "timestamp": "2026-03-17"
})
time.sleep(1)

print("\nTest 5: Command handlers")

@dock.on_command("test_command")
def handle_test(payload):
    print(f"Received test command: {payload}")
    dock.reply("Test command received!")

@dock.on_chat
def handle_chat(message):
    print(f"Chat message: {message}")
    dock.reply(f"Echo: {message}")

print("\nTest 6: Context manager")
with agenthelm.connect(
    key=KEY,
    name="Context Test",
    base_url="http://localhost:3000/api/sdk",
    auto_ping=False
) as ctx_dock:
    ctx_dock.log("Inside context manager")
    ctx_dock.output({"context_test": True})

print("\n✅ All tests sent!")
print(f"Tokens tracked this session: {dock.tokens_session}")
print("\nCheck your AgentHelm dashboard:")
print("http://localhost:3000/dashboard")
print("\nListening for commands for 30 seconds...")
print("Go to dashboard and send a chat message!")

try:
    time.sleep(30)
except KeyboardInterrupt:
    pass

dock.stop()
print("\nTest complete!")
