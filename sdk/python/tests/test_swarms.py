import unittest
import queue
from agenthelm.swarms import SwarmCoordinator

class TestSwarmCoordinator(unittest.TestCase):
    
    def setUp(self):
        self.coordinator = SwarmCoordinator(lead_name="LeadAgent")

    def test_spawn_team_and_broadcast(self):
        """Test spawning specialist agents and broadcasting task context."""
        worker1 = self.coordinator.spawn_team("DataParser", "parser", ["regex"])
        worker2 = self.coordinator.spawn_team("Verifier", "reviewer", ["lint"])
        
        # Verify they are tracked
        self.assertIn("DataParser", self.coordinator.workers)
        self.assertIn("Verifier", self.coordinator.workers)
        
        # Test broadcast payload sharing
        self.coordinator.broadcast("BEGIN_TASK", {"doc_id": "123"})
        
        # Pull message from the worker queues (simulate worker consuming payload)
        try:
            msg1 = worker1.queue.get(timeout=1)
            msg2 = worker2.queue.get(timeout=1)
        except queue.Empty:
            self.fail("Workers did not receive broadcast message.")
            
        self.assertIn("BEGIN_TASK", msg1)
        self.assertIn("123", msg2)

    def test_request_shutdown(self):
        """Test tearing down a specific worker."""
        worker1 = self.coordinator.spawn_team("DataParser", "parser", ["regex"])
        self.coordinator.request_shutdown("DataParser")
        
        # The worker should receive a SHUTDOWN signal
        msg = worker1.queue.get(timeout=1)
        self.assertEqual(msg, "SHUTDOWN")
        
        # It should be removed from the active swarms list
        self.assertNotIn("DataParser", self.coordinator.workers)

if __name__ == '__main__':
    unittest.main()
