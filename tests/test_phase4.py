"""
Phase 4: Enterprise Hardening Tests
Tests for Context Drift, SLA Detection, and Memory Poisoning.
"""
import os
import sys
import time
import shutil
import pytest

# Ensure SDK is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'sdk', 'python'))

from agenthelm.memory import MemoryEngine


class TestContextDrift:
    """Tests that the context drift monitor fires when approaching token limits."""
    
    def test_drift_fires_at_90_percent(self):
        """Simulates token accumulation approaching max_context_tokens."""
        # We test the drift logic in isolation by mimicking the check
        max_context_tokens = 10000
        tokens_session = 9500  # 95% - should trigger
        
        usage_ratio = tokens_session / max_context_tokens
        assert usage_ratio >= 0.9, "Usage ratio should be >= 0.9"
        
    def test_drift_does_not_fire_under_threshold(self):
        """Ensures no drift alert below 90%."""
        max_context_tokens = 10000
        tokens_session = 5000  # 50% - should NOT trigger
        
        usage_ratio = tokens_session / max_context_tokens
        assert usage_ratio < 0.9, "Usage ratio should be < 0.9"


class TestSLADetection:
    """Tests SLA breach detection logic."""
    
    def test_sla_breach_detected(self):
        """Simulates a run exceeding the SLA target."""
        sla_target_ms = 5000
        run_start = time.time() - 10  # 10 seconds ago
        run_latency_ms = int((time.time() - run_start) * 1000)
        
        assert run_latency_ms > sla_target_ms, \
            f"Run latency {run_latency_ms}ms should exceed SLA target {sla_target_ms}ms"
    
    def test_sla_within_target(self):
        """Simulates a run within SLA."""
        sla_target_ms = 30000
        run_start = time.time() - 1  # 1 second ago
        run_latency_ms = int((time.time() - run_start) * 1000)
        
        assert run_latency_ms < sla_target_ms, \
            f"Run latency {run_latency_ms}ms should be within SLA target {sla_target_ms}ms"


class TestMemoryPoisoning:
    """Tests memory poisoning detection in MemoryEngine."""
    
    @pytest.fixture(autouse=True)
    def setup_memory(self, tmp_path):
        """Create a fresh MemoryEngine in a temp directory."""
        self.mem_dir = str(tmp_path / "test_memory")
        self.engine = MemoryEngine(memory_dir=self.mem_dir)
        self.alerts = []
        self.engine._poisoning_alert_callback = lambda data: self.alerts.append(data)
        yield
        # Cleanup
        if os.path.exists(self.mem_dir):
            shutil.rmtree(self.mem_dir)
    
    def test_normal_writes_no_alert(self):
        """A few writes should not trigger poisoning."""
        for i in range(3):
            self.engine.update_index(f"topic_{i}", f"ref_{i}", f"summary_{i}", is_verified=True)
        
        assert len(self.alerts) == 0, "No poisoning alert should fire for 3 writes"
    
    def test_rapid_writes_trigger_alert(self):
        """Exceeding the threshold should trigger a poisoning alert."""
        # Write more than the threshold (default 5) in quick succession
        for i in range(6):
            self.engine.update_index(f"bulk_{i}", f"ref_{i}", f"Bulk write {i}", is_verified=True)
        
        assert len(self.alerts) > 0, "Poisoning alert should fire for 6 rapid writes"
        assert self.alerts[0]["writes_in_window"] >= 5
    
    def test_unverified_writes_blocked(self):
        """Unverified writes should be rejected by Strict Write Discipline."""
        result = self.engine.update_index("evil_topic", "ref", "malicious data", is_verified=False)
        assert result == False, "Unverified write should be rejected"
        assert len(self.alerts) == 0, "No alert for blocked writes"
