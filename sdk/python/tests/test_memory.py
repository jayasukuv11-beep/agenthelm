import os
import shutil
import unittest
import tempfile
from agenthelm.memory import MemoryEngine

class TestMemoryEngine(unittest.TestCase):
    
    def setUp(self):
        # Create a temporary directory for memory files
        self.test_dir = tempfile.mkdtemp()
        self.engine = MemoryEngine(memory_dir=self.test_dir, limit_lines=10) # Small limit for testing

    def tearDown(self):
        # Remove the directory after the test
        shutil.rmtree(self.test_dir)

    def test_strict_write_discipline(self):
        """Test that unverified actions are rejected from MEMORY.md."""
        res = self.engine.update_index("Test Topic", "daily-log/01.md", "Action failed", is_verified=False)
        self.assertFalse(res)
        
        with open(self.engine.index_file, "r") as f:
            content = f.read()
        self.assertNotIn("Test Topic", content)

    def test_memory_line_limits(self):
        """Test that MEMORY.md respects the line limit and prunes old entries."""
        # limit is 10. Header takes 2 lines. So 8 entries max.
        for i in range(15):
            self.engine.update_index(f"Topic {i}", "daily-log/01.md", f"Summary {i}", is_verified=True)
            
        with open(self.engine.index_file, "r") as f:
            lines = f.readlines()
            
        self.assertEqual(len(lines), 10)
        # Oldest topics should be pruned. Topic 0 to 6 should be gone, Topic 7 to 14 should remain.
        content = "".join(lines)
        self.assertNotIn("Topic 0", content)
        self.assertIn("Topic 14", content)

    def test_auto_dream_contradiction_resolution(self):
        """Stress test: simulating KAIROS daemon resolving contradictory logs."""
        logs = [
            "08:00 - Set API Key to openai-1234",
            "08:05 - Agent attempted task",
            "08:10 - Update User ID to tharagesh11",
            "08:15 - User complained key is wrong",
            "08:20 - Set API Key to anthropic-5678"
        ]
        
        summary = self.engine._auto_dream_consolidation(logs)
        
        # Ensure the final resolved state has the updated key and retains the user ID
        self.assertIn("api_key=anthropic-5678", summary)
        self.assertIn("user_id=tharagesh11", summary)
        
        # Ensure it didn't keep the contradictory old key
        self.assertNotIn("openai-1234", summary)
        
if __name__ == '__main__':
    unittest.main()
