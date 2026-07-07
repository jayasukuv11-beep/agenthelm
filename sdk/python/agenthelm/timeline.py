import threading
import time
from typing import Dict, Any, Optional

class TimelineBuffer:
    """
    Batches timeline events (decisions, checkpoints) to reduce API load.
    """
    def __init__(self, client, flush_interval: int = 5, batch_size: int = 50):
        self.client = client
        self.flush_interval = flush_interval
        self.batch_size = batch_size
        self._buffer = []
        self._lock = threading.Lock()
        self._running = True
        self._flush_thread = threading.Thread(target=self._flush_loop, daemon=True)
        self._flush_thread.start()

    def record_event(self, event_type: str, title: str, details: Optional[Dict[str, Any]] = None):
        """
        Records an event to the timeline buffer.
        """
        event = {
            "event_type": event_type,
            "title": title,
            "details": details or {},
            "timestamp": self.client._now()
        }
        
        with self._lock:
            self._buffer.append(event)
            
        if len(self._buffer) >= self.batch_size:
            self.flush()

    def flush(self):
        """
        Flushes buffered events to the server.
        """
        with self._lock:
            if not self._buffer:
                return
            batch = self._buffer.copy()
            self._buffer.clear()

        try:
            payload = {
                "key": self.client.auth_key,
                "agent_id": self.client._agent_id,
                "project": self.client._project,
                "events": batch
            }
            # Fire and forget over async worker pool
            self.client._send_async("/api/sdk/timeline/batch", payload)
        except Exception as e:
            if self.client._verbose:
                print(f"[AgentHelm] ⚠️ Failed to flush timeline events: {e}")
            # Put them back if failed? For MVP we drop on error to prevent memory leaks
            
    def _flush_loop(self):
        """Background thread that flushes events periodically."""
        while self._running:
            time.sleep(self.flush_interval)
            self.flush()

    def stop(self):
        """Stops the background thread and does a final flush."""
        self._running = False
        self.flush()
