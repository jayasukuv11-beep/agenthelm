import pytest
from agenthelm.reasoning import ReasoningCapture

class MockResponseMessage:
    def __init__(self, content):
        self.content = content
        self.tool_calls = None

class MockChoice:
    def __init__(self, content):
        self.message = MockResponseMessage(content)

class MockUsage:
    def __init__(self, tokens):
        self.total_tokens = tokens

class MockOpenAIResult:
    def __init__(self, content, tokens):
        self.choices = [MockChoice(content)]
        self.usage = MockUsage(tokens)

def test_reasoning_capture_openai():
    captured_steps = []
    
    def mock_send(data):
        captured_steps.append(data)

    capture = ReasoningCapture(send_fn=mock_send, agent_id="test_agent", verbose=False)
    
    kwargs = {
        "model": "gpt-4-turbo",
        "messages": [{"role": "user", "content": "Hello compute 2+2"}]
    }
    
    result = MockOpenAIResult("The answer is 4.", 15)
    
    capture._record_openai_step(kwargs, result, 120)
    
    assert len(captured_steps) == 1
    step = captured_steps[0]
    
    assert step["model"] == "gpt-4-turbo"
    assert step["latency_ms"] == 120
    assert step["tokens_used"] == 15
    assert step["decision"] == "direct_response"
    assert "The answer is 4." in step["model_response_summary"]
    assert "Hello compute 2+2" in step["prompt_summary"]
