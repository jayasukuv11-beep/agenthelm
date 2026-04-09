import sys
import os
import warnings

# Ensure we use local SDK instead of pip installed
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../sdk/python")))

import agenthelm

def test_otel_soft_import():
    print("\n--- Test: OpenTelemetry Soft Import Fallback ---")
    
    agent_key = "ahe_live_test123"
    
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        
        dock = agenthelm.connect(
            agent_key, 
            name="Test OTP Agent", 
            auto_ping=False,
            otel_export=True,
            verbose=False
        )
        
        # Initialize OTELExporter directly to trigger the warning regardless of network auth
        # It's an internal class but perfect for this unit test logic.
        from agenthelm.otel import OTELExporter
        exporter = OTELExporter(endpoint=None, agent_name="Test", version="1")
        dock._otel_exporter = exporter
        
        otel_warning_found = False
        for warning in w:
            if "OpenTelemetry" in str(warning.message):
                otel_warning_found = True
                print(f"✅ Soft-import warning intercepted: {warning.message}")
                break
                
        if not otel_warning_found:
            print("⚠️ No warning found! Is opentelemetry installed?")
                
        # Now test decorator
        @dock.side_effect(max_retries=1, dedup=False)
        def test_tool(msg: str):
            return f"Processed: {msg}"
            
        print("Testing decorator execution with otel_export=True...")
        try:
            res = test_tool("Hello Phase 2")
            if res == "Processed: Hello Phase 2":
                print("✅ Decorator execution succeeded securely through OTEL logic block.")
            else:
                print(f"❌ Decorator execution failed, unexpected result: {res}")
        except Exception as e:
            print(f"❌ Decorator execution failed with Exception: {e}")

if __name__ == "__main__":
    print("Starting Phase 2 Tests...")
    test_otel_soft_import()
    print("Done.")
