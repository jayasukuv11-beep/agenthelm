import pytest
from unittest.mock import patch, MagicMock
from agenthelm import AgentHelm, connect

class TestAgentHelmInit:
    def test_invalid_key_raises_error(self):
        with pytest.raises(ValueError):
            AgentHelm(key="invalid_key", name="Test")
    
    def test_valid_key_accepted(self):
        with patch("requests.post") as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {
                "agent_id": "test-uuid-1234"
            }
            dock = AgentHelm(
                key="ahe_live_test123",
                name="Test Agent",
                auto_ping=False
            )
            assert dock.name == "Test Agent"
    
    def test_connect_shortcut(self):
        with patch("requests.post") as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {
                "agent_id": "test-uuid"
            }
            dock = connect(
                "ahe_live_test123",
                name="Test",
                auto_ping=False
            )
            assert isinstance(dock, AgentHelm)

class TestLogging:
    def setup_method(self):
        with patch("requests.post") as mock:
            mock.return_value.status_code = 200
            mock.return_value.json.return_value = {
                "agent_id": "test-id"
            }
            self.dock = AgentHelm(
                "ahe_live_test",
                auto_ping=False
            )
    
    def test_log_sends_request(self):
        with patch("requests.post") as mock:
            mock.return_value.status_code = 200
            self.dock.log("Test message")
            mock.assert_called_once()
    
    def test_track_tokens_accumulates(self):
        with patch("requests.post"):
            self.dock.track_tokens(500, "test-model")
            self.dock.track_tokens(300, "test-model")
            assert self.dock.tokens_session == 800
