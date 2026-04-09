import sys
import os
import json
from unittest.mock import MagicMock, patch

# Adjust path
sys.path.append(r"d:\agentdock\sdk\python")
import agenthelm
from agenthelm.client import HardLimitBreached, LoopDetected, InjectionDetected

def debug_pillar_1():
    print("--- Debug Pillar 1 ---")
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.ok = True
    mock_resp.json.return_value = {
        "agent_id": "test-agent-uuid",
        "agent_token": "ahe_tok_123",
        "plan": "studio",
        "permissions": {"allowed_tools": ["tick", "repeat_tool"], "block_mode": True}
    }

    with patch("requests.post", return_value=mock_resp):
        d = agenthelm.connect("ahe_live_test", name="SafetyAgent", 
                             max_iterations=5, auto_ping=False, 
                             command_poll_interval=0, verbose=True)
        
        print("\nChecking Hard Limit...")
        try:
            for i in range(1, 10):
                print(f"  Tick {i}...")
                d._enforce_tool_execution_safety("tick", (), {})
            print("  FAIL: No exception raised")
        except HardLimitBreached as e:
            print(f"  SUCCESS: Caught {e}")
        except Exception as e:
            print(f"  UNEXPECTED: Caught {type(e).__name__}: {e}")

        print("\nChecking Loop Detection...")
        d2 = agenthelm.connect("ahe_live_test", name="LoopAgent", 
                              loop_detection=True, loop_max_repeats=3, 
                              auto_ping=False, command_poll_interval=0, verbose=True)
        try:
            for i in range(1, 10):
                print(f"  Call {i}...")
                d2._enforce_tool_execution_safety("repeat_tool", ("arg1",), {})
            print("  FAIL: No exception raised")
        except LoopDetected as e:
            print(f"  SUCCESS: Caught {e}")
        except Exception as e:
            print(f"  UNEXPECTED: Caught {type(e).__name__}: {e}")

if __name__ == "__main__":
    debug_pillar_1()
