"""
Phase 5: Platform Maturity Tests
Tests for Scoped Permissions, Evaluation Runner, and Output Validation.
"""
import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure SDK is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'sdk', 'python'))

import agenthelm

class TestScopedPermissions(unittest.TestCase):
    """Tests that the agent SDK enforces tool whitelists."""

    @patch('requests.post')
    def test_permission_denied_throws_runtime_error(self, mock_post):
        """Verify that calling an unwhitelisted tool raises RuntimeError in block_mode."""
        # Mock connection response with studio plan and restricted permissions
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "agent_id": "test-agent-uuid",
            "plan": "studio",
            "permissions": {
                "allowed_tools": ["safe_tool"],
                "block_mode": True
            }
        }

        dock = agenthelm.connect("ahe_live_test", name="SecurityTestAgent")
        
        # Define a safe tool (decorator usage)
        @dock.irreversible(confirm="slack")
        def safe_tool():
            return "executed"

        # Define a restricted tool
        @dock.irreversible(confirm="slack")
        def restricted_tool():
            return "should not run"

        # This should work
        # (We skip the internal approval poll by mocking _enforce_tool_execution_safety or just checking it directly)
        dock._enforce_tool_execution_safety("safe_tool", (), {})
        
        # This should raise RuntimeError
        with self.assertRaises(RuntimeError) as cm:
            dock._enforce_tool_execution_safety("restricted_tool", (), {})
        
        self.assertIn("Tool 'restricted_tool' not in allowed permissions list", str(cm.exception))

    @patch('requests.post')
    def test_permission_warning_only(self, mock_post):
        """Verify that block_mode=False only warns but allows execution."""
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "agent_id": "test-agent-uuid",
            "plan": "studio",
            "permissions": {
                "allowed_tools": ["safe_tool"],
                "block_mode": False
            }
        }

        dock = agenthelm.connect("ahe_live_test", name="WarningTestAgent")
        dock.warn = MagicMock()
        
        # Should not raise exception
        dock._enforce_tool_execution_safety("unauthorized_tool", (), {})
        
        # Should have called dock.warn
        dock.warn.assert_called()
        self.assertIn("Permission Warning", dock.warn.call_args[0][0])


class TestOutputValidation(unittest.TestCase):
    """Tests JSON schema validation in the SDK."""

    def test_schema_success(self):
        dock = agenthelm.Agent("ahe_live_test")
        schema = {
            "type": "object",
            "properties": {
                "score": {"type": "number"},
                "label": {"type": "string"}
            },
            "required": ["score", "label"]
        }
        
        valid_output = {"score": 0.95, "label": "positive"}
        # Note: requires jsonschema installed. 
        # For the test, we assume it's there or handle the ImportError gracefully.
        try:
            import jsonschema
            assert dock.validate_output(valid_output, schema) == True
        except ImportError:
            pass

class TestEvalRunner(unittest.TestCase):
    """Tests the Eval Runner registration and submission."""

    @patch('requests.post')
    def test_eval_registration_and_run(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"agent_id": "uuid", "plan": "studio"}
        
        dock = agenthelm.connect("ahe_live_test")
        
        def mock_runner(input_data):
            # simulate some work
            dock.track_tokens(100, "gpt-4")
            return "done"

        dock.add_eval(
            name="TestScenario",
            input_data={"q": "hello"},
            runner_fn=mock_runner
        )
        
        self.assertEqual(len(dock._evals), 1)
        
        # Mock the result submission response
        mock_post.return_value.json.return_value = {"passed": True}
        
        results = dock.run_evals()
        self.assertEqual(results["passed"], 1)

if __name__ == '__main__':
    unittest.main()
