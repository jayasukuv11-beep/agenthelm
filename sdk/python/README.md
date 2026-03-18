# agenthelm-sdk

Monitor your AI agents from AgentHelm.
Add one line. See everything.

## Install

pip install agenthelm-sdk

## Quick Start

import agenthelm

# Connect your agent (one line):
dock = agenthelm.connect(
    "ahe_live_xxxxx",
    name="My Agent"
)

# Send logs:
dock.log("Agent started")
dock.log("Warning: rate limit", level="warning")
dock.log("Task complete", level="success")

# Track token usage:
dock.track_tokens(used=1500, model="gemini-flash")
dock.track_tokens(
    used=2000,
    model="gpt-4",
    cost_per_1k=0.03
)

# Send structured output:
dock.output({
    "leads_found": 12,
    "hot_leads": 5,
    "report_sent": True
})

# Report errors:
try:
    risky_operation()
except Exception as e:
    dock.error("Operation failed", exception=e)

# Handle dashboard commands:
@dock.on_command("stop")
def handle_stop(payload):
    dock.log("Stopping agent...")
    dock.stop()

@dock.on_command("run_now")
def handle_run(payload):
    # run_main_task()
    dock.reply("Task started!")

# Chat with your agent:
@dock.on_chat
def handle_chat(message: str):
    if "status" in message.lower():
        dock.reply("Running fine!")
    else:
        dock.reply(f"Received: {message}")

# Keep agent alive:
dock.listen()

## Context Manager

with agenthelm.connect("ahe_live_xxxxx") as dock:
    dock.log("Working...")
    # do_work()
    dock.output({"done": True})
# Agent auto-stops when block exits.

## Configuration

dock = agenthelm.connect(
    key="ahe_live_xxxxx",
    name="My Agent",
    agent_type="python",
    version="2.1.0",
    verbose=True,
    ping_interval=30,
    command_poll_interval=5,
    timeout=5
)

## Links

Dashboard: https://agenthelm.dev
Docs: https://agenthelm.dev/docs
Support: support@agenthelm.dev
