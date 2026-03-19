import time
from agenthelm import Agent, connect

def test_agent():
    print("Testing Agent SDK Initialization...")
    dock = Agent(key="ahe_live_testkey1234567", name="Test SDK Python")
    
    print("Testing log()...")
    dock.log("Test log message")
    
    print("Testing warn()...")
    dock.warn("Test warning message")
    
    print("Testing error()...")
    dock.error("Test error message")
    
    print("Testing output()...")
    dock.output({"status": "ok", "value": 42}, label="test_output")
    
    print("Testing stop()...")
    dock.stop()

    print("Success: All methods called.")

if __name__ == "__main__":
    test_agent()
