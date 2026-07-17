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

class TestSafetyFirewall:
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

    def test_read_decorator_without_parentheses(self):
        @self.dock.read
        def test_fn(x):
            return x + 1
        assert test_fn(5) == 6

    def test_read_decorator_with_parentheses(self):
        @self.dock.read()
        def test_fn(x):
            return x + 2
        assert test_fn(5) == 7

    def test_side_effect_decorator(self):
        call_count = 0
        @self.dock.side_effect(max_retries=2)
        def test_fn():
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise ValueError("temporary error")
            return "success"
        assert test_fn() == "success"
        assert call_count == 2

