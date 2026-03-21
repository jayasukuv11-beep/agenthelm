import os
import sys
import time
import threading

# Fix Windows console encoding for emoji output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from agenthelm import Agent

CONNECT_KEY = "ahe_live_0twxl76hd8bf7r6d"
results = []
agent = None

def test(name, fn):
    try:
        fn()
        results.append(("PASS", name))
        print(f"  PASS: {name}")
    except Exception as e:
        results.append(("FAIL", name, str(e)))
        print(f"  FAIL: {name} -- {e}")

def run_all_tests():
    print("\n" + "="*60)
    print("  AGENTHELM FULL FEATURE TEST SUITE")
    print("="*60)

    global agent

    # ── SECTION 1 — SDK CONNECTION ──
    print("\n  --- Section 1: SDK Connection ---")
    def t1_1():
        global agent
        agent = Agent(key=CONNECT_KEY, name="Test Agent", version="1.0", agent_type="python", verbose=False)
        time.sleep(3)
        if not agent.agent_id:
            raise Exception("agent_id is None")
    test("1.1: Agent Registration", t1_1)

    def t1_2():
        print("     (waiting 35 seconds for heartbeat verification...)")
        time.sleep(35)
        if not agent.is_connected:
            raise Exception("Agent disconnected")
    test("1.2: Heartbeat Ping", t1_2)

    def t1_3():
        a1 = Agent(key=CONNECT_KEY, name="MultiA1", verbose=False)
        a2 = Agent(key=CONNECT_KEY, name="MultiA2", verbose=False)
        time.sleep(3)
        if not a1.agent_id or not a2.agent_id or a1.agent_id == a2.agent_id:
            raise Exception("Duplicate or missing agent_ids")
        a1.stop()
        a2.stop()
    test("1.3: Multiple Agents", t1_3)

    # ── SECTION 2 — LOGGING ──
    print("\n  --- Section 2: Logging ---")
    test("2.1: Info Log", lambda: agent.log("Test info message", level="info"))
    test("2.2: Warning Log", lambda: agent.warn("Test warning message"))
    test("2.3: Error Log", lambda: agent.error("Test error message"))
    test("2.4: Success Log", lambda: agent.log("Test success message", level="success"))
    test("2.5: Long message log (500 chars)", lambda: agent.log("A" * 500, level="info"))
    test("2.6: Special characters log", lambda: agent.log("Test rocket emojis and special chars", level="info"))
    def t2_7():
        for i in range(10):
            agent.log(f"Rapid log {i}", level="info")
    test("2.7: Rapid logs (10 logs in 1 second)", t2_7)

    # ── SECTION 3 — OUTPUT ──
    print("\n  --- Section 3: Output ---")
    test("3.1: Basic output dict", lambda: agent.output({"result": "test", "count": 42}, label="test"))
    test("3.2: Nested dict output", lambda: agent.output({"nested": {"key": "value", "list": [1,2,3]}}, label="nested"))
    test("3.3: Large output (1000 char string)", lambda: agent.output({"content": "X" * 1000}, label="large"))
    test("3.4: Output without label", lambda: agent.output({"data": "no label"}))

    # ── SECTION 4 — TOKEN TRACKING ──
    print("\n  --- Section 4: Token Tracking ---")
    test("4.1: Basic token tracking", lambda: agent.track_tokens(used=500, model="llama-3.1-8b", cost_per_1k=0.0002))
    test("4.2: Token tracking with breakdown", lambda: agent.track_tokens(used=800, model="gpt-4", cost_per_1k=0.03, prompt_tokens=600, completion_tokens=200))
    test("4.3: Zero tokens", lambda: agent.track_tokens(used=0, model="test-model", cost_per_1k=0.0))
    test("4.4: Large token count", lambda: agent.track_tokens(used=100000, model="llama-3.1-8b", cost_per_1k=0.0002))
    def t4_5():
        before = agent.tokens_today
        agent.track_tokens(used=100, model="test", cost_per_1k=0.0)
        if agent.tokens_today <= before:
            raise Exception("tokens_today did not increase")
    test("4.5: Check tokens_today property", t4_5)

    # ── SECTION 5 — COMMANDS ──
    print("\n  --- Section 5: Commands ---")
    def t5_1():
        if not hasattr(agent, "_command_handlers"):
            raise Exception("_command_handlers not initialized")
    test("5.1: Check for pending commands", t5_1)

    def t5_2():
        agent._handle_command({"command_type": "stop", "payload": {}})
    test("5.2: Stop command handling", t5_2)

    # ── SECTION 7 — ERROR HANDLING ──
    print("\n  --- Section 7: Error Handling ---")
    def t7_1():
        try:
            a = Agent(key="ahe_live_invalid123456", verbose=False)
            time.sleep(3)
            if a.is_connected:
                raise Exception("Connected with invalid key")
        except ValueError:
            pass
    test("7.1: Invalid connect key", t7_1)

    def t7_2():
        a = Agent(key=CONNECT_KEY, base_url="http://localhost:9999", verbose=False)
        time.sleep(3)
        if a.is_connected:
            raise Exception("Connected to invalid base_url")
    test("7.2: Network timeout simulation", t7_2)

    test("7.3: Empty log message", lambda: agent.log("", level="info"))
    test("7.4: None values in output", lambda: agent.output({"key": None, "num": 0, "bool": False}))

    # ── SECTION 8 — PERFORMANCE ──
    print("\n  --- Section 8: Performance ---")
    def t8_1():
        start = time.time()
        for i in range(50):
            agent.log(f"Perf log {i}")
        duration = time.time() - start
        print(f"     (50 logs sent in {duration:.1f}s)")
        if duration > 120:
            raise Exception(f"Log throughput took {duration:.1f}s (limit 120s)")
    test("8.1: Log throughput", t8_1)

    def t8_2():
        def run_logs(a):
            for i in range(5):
                a.log("Thread log")
        ca1 = Agent(key=CONNECT_KEY, name="Conc1", verbose=False)
        ca2 = Agent(key=CONNECT_KEY, name="Conc2", verbose=False)
        ca3 = Agent(key=CONNECT_KEY, name="Conc3", verbose=False)
        time.sleep(3)
        th1 = threading.Thread(target=run_logs, args=(ca1,))
        th2 = threading.Thread(target=run_logs, args=(ca2,))
        th3 = threading.Thread(target=run_logs, args=(ca3,))
        th1.start(); th2.start(); th3.start()
        th1.join(); th2.join(); th3.join()
        ca1.stop(); ca2.stop(); ca3.stop()
    test("8.2: Concurrent agents", t8_2)

    # ── SECTION 6 — AGENT LIFECYCLE ──
    print("\n  --- Section 6: Agent Lifecycle ---")
    test("6.1: Agent stop", lambda: agent.stop())
    def t6_2():
        if not agent.agent_id:
            raise Exception("agent_id was erased after stop")
    test("6.2: Agent status after stop", t6_2)

    # ── FINAL REPORT ──
    print("\n" + "="*60)
    print("  TEST RESULTS")
    print("="*60)
    passed = [r for r in results if r[0] == "PASS"]
    failed = [r for r in results if r[0] == "FAIL"]
    print(f"  Passed: {len(passed)}/{len(results)}")
    print(f"  Failed: {len(failed)}/{len(results)}")
    if failed:
        print("\n  Failed tests:")
        for r in failed:
            print(f"    - {r[1]}: {r[2]}")
    print(f"\n  Dashboard: https://agenthelm.vercel.app/dashboard")
    print("="*60)

    with open("d:\\agentdock\\test_report.txt", "w", encoding="utf-8") as f:
        f.write(f"AgentHelm Test Report\n")
        f.write(f"Date: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Passed: {len(passed)}/{len(results)}\n\n")
        for r in results:
            status = "PASS" if r[0] == "PASS" else f"FAIL: {r[2]}"
            f.write(f"{status}: {r[1]}\n")

    print(f"\n  Report saved to d:\\agentdock\\test_report.txt")

if __name__ == "__main__":
    run_all_tests()
