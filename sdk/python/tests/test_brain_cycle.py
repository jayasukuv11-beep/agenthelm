import unittest
from unittest.mock import patch, MagicMock
from agenthelm.client import Agent

class TestBrainCycle(unittest.TestCase):
    def setUp(self):
        self.key = "ahe_live_test_key"
        self.project = "test-project"

    @patch("requests.post")
    def test_connect_and_inject(self, mock_post):
        # We need to handle /ping, /register and /inject
        # So we'll provide side effects or a generic return value that works
        def mock_post_side_effect(url, **kwargs):
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            if "ping" in url:
                mock_resp.json.return_value = {"status": "ok"}
            elif "inject" in url:
                mock_resp.json.return_value = {
                    "context": {"architecture": ["Microservices"]},
                    "brain_version": 2
                }
            else:
                mock_resp.json.return_value = {"agent_id": "agent-123"}
            return mock_resp

        mock_post.side_effect = mock_post_side_effect

        agent = Agent(
            key=self.key,
            project=self.project,
            auto_inject=True,
            auto_ping=False,
            task_hint="Build API"
        )

        # Verify context is loaded
        self.assertIsNotNone(agent.context)
        self.assertEqual(agent.context["architecture"], ["Microservices"])
        
        # Verify inject URL was called
        inject_calls = [call for call in mock_post.call_args_list if "inject" in call[0][0]]
        self.assertEqual(len(inject_calls), 1)
        self.assertEqual(inject_calls[0][1]["json"]["project"], self.project)
        self.assertEqual(inject_calls[0][1]["json"]["task_hint"], "Build API")

    @patch("requests.post")
    def test_publish_contract_aliases_to_proposal(self, mock_post):
        def mock_post_side_effect(url, **kwargs):
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            if "proposals" in url:
                mock_resp.json.return_value = {"proposal_id": "p-456", "status": "submitted"}
            else:
                mock_resp.json.return_value = {"agent_id": "agent-123"}
            return mock_resp

        mock_post.side_effect = mock_post_side_effect

        agent = Agent(key=self.key, project=self.project, auto_ping=False)

        proposal_id = agent.publish_contract(
            summary="Added tests",
            confidence=95,
            files=["test_api.py"],
            tests_passed=True
        )

        self.assertEqual(proposal_id, "p-456")
        
        proposal_calls = [call for call in mock_post.call_args_list if "proposals" in call[0][0]]
        self.assertEqual(len(proposal_calls), 1)
        payload = proposal_calls[0][1]["json"]["payload"]
        self.assertEqual(payload["summary"], "Added tests")
        self.assertEqual(payload["files_modified"], ["test_api.py"])
        self.assertTrue(payload["tests_passed"])
        self.assertNotIn("confidence", payload)
        self.assertIn("content_hash", proposal_calls[0][1]["json"])

    @patch("requests.post")
    def test_file_claim(self, mock_post):
        def mock_post_side_effect(url, **kwargs):
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            if "claim" in url:
                mock_resp.json.return_value = {"claimed": True}
            else:
                mock_resp.json.return_value = {"agent_id": "agent-123"}
            return mock_resp
            
        mock_post.side_effect = mock_post_side_effect

        agent = Agent(key=self.key, project=self.project, auto_ping=False)
        claimed = agent.claim_file("src/main.py")

        self.assertTrue(claimed)
        claim_calls = [call for call in mock_post.call_args_list if "claim" in call[0][0]]
        self.assertEqual(len(claim_calls), 1)
        self.assertEqual(claim_calls[0][1]["json"]["file"], "src/main.py")

if __name__ == "__main__":
    unittest.main()
