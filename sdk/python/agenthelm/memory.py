import os
import time
import uuid
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class MemoryEngine:
    """
    Implements a 3-layer Hierarchical Memory System to prevent context entropy.
    Tier 1: System prompt (Fixed)
    Tier 2: Index (MEMORY.md) - Capped pointer mapping.
    Tier 3: Episodic (daily-log/*.md) - Append-only loaded on demand.
    """
    
    def __init__(self, memory_dir: str = ".agenthelm/memory", index_file: str = "MEMORY.md", limit_lines: int = 200):
        self.memory_dir = memory_dir
        self.index_file = os.path.join(self.memory_dir, index_file)
        self.limit_lines = limit_lines
        self.daily_log_dir = os.path.join(self.memory_dir, "daily-log")
        
        # Ensure memory directories exist
        os.makedirs(self.memory_dir, exist_ok=True)
        os.makedirs(self.daily_log_dir, exist_ok=True)
        
        # Initialize MEMORY.md if missing
        if not os.path.exists(self.index_file):
            with open(self.index_file, "w", encoding="utf-8") as f:
                f.write("# AgentHelm Context Index\n\n")

    def log_episodic_event(self, event_type: str, details: Dict[str, Any]) -> str:
        """
        Records an append-only event into the daily log (Tier 3 memory).
        """
        today = time.strftime("%Y-%m-%d")
        log_path = os.path.join(self.daily_log_dir, f"{today}.md")
        timestamp = time.strftime("%H:%M:%S")
        
        event_entry = f"## [{timestamp}] {event_type}\n{details}\n\n"
        
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(event_entry)
            
        return log_path

    def update_index(self, topic: str, pointer: str, summary: str, is_verified: bool = False):
        """
        Applies "Strict Write Discipline".
        Updates the Tier 2 memory index ONLY if the action has been verified.
        Ensures the index file stays under the `limit_lines` cap.
        """
        if not is_verified:
            logger.warning(f"Index update rejected for '{topic}': Action not verified. Strict Write Discipline active.")
            return False

        # Read current index
        with open(self.index_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
            
        # Create new entry
        new_entry = f"- **{topic}**: {summary} (Ref: {pointer})\n"
        
        # We append, but we must enforce the line limit (e.g., 200 lines).
        # We keep the header lines (first 2) and prune the oldest entries.
        header = lines[:2]
        entries = lines[2:]
        
        entries.append(new_entry)
        
        # Prune if exceeding budget
        if len(entries) > (self.limit_lines - len(header)):
            # Prune oldest
            entries = entries[-(self.limit_lines - len(header)):]
            
        # Write back
        with open(self.index_file, "w", encoding="utf-8") as f:
            f.writelines(header)
            f.writelines(entries)
            
        return True

    def read_index(self) -> str:
        """Reads the current contents of the MEMORY.md index."""
        if not os.path.exists(self.index_file):
            return ""
        with open(self.index_file, "r", encoding="utf-8") as f:
            return f.read()

    def _auto_dream_consolidation(self, logs: List[str]) -> str:
        """
        Mock resolution for automated testing.
        Takes the 'last' state of a given conflicting entity.
        """
        resolved_state = {}
        for log in logs:
            if "Set API Key" in log:
                resolved_state['api_key'] = log.split('to')[-1].strip()
            elif "Update User ID" in log:
                resolved_state['user_id'] = log.split('to')[-1].strip()
        
        summary = "Consolidated State: " + ", ".join(f"{k}={v}" for k, v in resolved_state.items())
        return summary

    def auto_dream(self, llm_callable) -> str:
        """
        Performs "REM sleep" memory consolidation dynamically using a provided LLM.
        Reads unsummarized daily logs, feeds them to the LLM via `llm_callable(prompt)`,
        and updates the Tier 2 index.
        """
        logger.info("Initiating autoDream memory consolidation via local LLM callback...")
        
        # 1. Gather logs
        logs = []
        for file in os.listdir(self.daily_log_dir):
            if file.endswith(".md"):
                with open(os.path.join(self.daily_log_dir, file), "r", encoding="utf-8") as f:
                    logs.append(f.read())
        
        if not logs:
            return "No logs to summarize."
            
        # 2. Construct Prompt for LLM
        prompt = (
            "You are a memory consolidation engine evaluating episodic agent logs.\n"
            "Identify key decisions, resolve contradictions (preferring newer actions), "
            "and output a clean, chronological state summary of the agent's current 'brain'.\n"
            "RAW LOGS:\n" + "\n".join(logs)
        )
        
        # 3. Call user's LLM
        try:
            summary = llm_callable(prompt)
        except Exception as e:
            logger.error(f"Failed to execute LLM callback for autoDream: {e}")
            return False
            
        # 4. Prune logs & Update Index
        # Simplified: We just summarize and append one big update for demonstration
        self.update_index("autoDream Consolidation", "daily-log", summary, is_verified=True)
        return summary
