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
        
        # Phase 4: Memory Poisoning Monitor
        self._write_timestamps: list = []  # Track recent write times
        self._poisoning_threshold_count = 5  # Max writes per window
        self._poisoning_window_seconds = 60  # Sliding window
        self._poisoning_alert_callback = None  # Set by Agent client
        self._last_index_size = 0
        self._poisoning_alerted = False
        
        # Ensure memory directories exist
        os.makedirs(self.memory_dir, exist_ok=True)
        os.makedirs(self.daily_log_dir, exist_ok=True)
        
        # Initialize MEMORY.md if missing
        if not os.path.exists(self.index_file):
            with open(self.index_file, "w", encoding="utf-8") as f:
                f.write("# AgentHelm Context Index\n\n")
        
        # Snapshot initial index size
        try:
            self._last_index_size = os.path.getsize(self.index_file)
        except OSError:
            self._last_index_size = 0

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
        
        # Phase 4: Memory Poisoning Anomaly Detection
        self._check_memory_poisoning(topic)
            
        return True
    
    def _check_memory_poisoning(self, topic: str):
        """Detects anomalous memory write patterns that may indicate poisoning."""
        now = time.time()
        self._write_timestamps.append(now)
        # Slide window
        self._write_timestamps = [
            t for t in self._write_timestamps
            if now - t < self._poisoning_window_seconds
        ]
        
        writes_in_window = len(self._write_timestamps)
        
        # Check for file size explosion (>300% growth)
        try:
            current_size = os.path.getsize(self.index_file)
        except OSError:
            current_size = 0
        
        size_ratio = (current_size / max(self._last_index_size, 1))
        
        is_anomalous = (
            writes_in_window >= self._poisoning_threshold_count or
            size_ratio > 3.0
        )
        
        if is_anomalous and not self._poisoning_alerted:
            self._poisoning_alerted = True
            alert_data = {
                "writes_in_window": writes_in_window,
                "window_seconds": self._poisoning_window_seconds,
                "threshold": self._poisoning_threshold_count,
                "index_size_before": self._last_index_size,
                "index_size_after": current_size,
                "size_growth_ratio": round(size_ratio, 2),
                "last_topic": topic
            }
            logger.warning(f"MEMORY POISONING ALERT: {alert_data}")
            if self._poisoning_alert_callback:
                try:
                    self._poisoning_alert_callback(alert_data)
                except Exception as e:
                    logger.error(f"Failed to send poisoning alert: {e}")
        
        self._last_index_size = current_size

    def remember(self, topic: str, content: str) -> bool:
        """
        Shorthand for storing a validated memory into the index.
        Ideal for agents to call when they learn something new.
        """
        # For 'remember', we assume the agent itself is verifying this is worth indexing
        return self.update_index(
            topic=topic,
            pointer="agent-recall",
            summary=content,
            is_verified=True
        )

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
