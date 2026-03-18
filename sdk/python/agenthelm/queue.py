import threading
from typing import Tuple, Any
from collections import deque

class OfflineQueue:
    """
    Thread-safe queue for storing failed API requests.
    Retries automatically when connection is restored.
    Max size: 1000 items to prevent memory issues.
    """
    
    def __init__(self, maxsize: int = 1000):
        self._queue: deque = deque(maxlen=maxsize)
        self._lock = threading.Lock()
    
    def push(self, endpoint: str, payload: dict) -> None:
        with self._lock:
            self._queue.append((endpoint, payload))
    
    def pop(self) -> Tuple[str, dict] | None:
        with self._lock:
            if self._queue:
                return self._queue.popleft()
            return None
    
    def size(self) -> int:
        with self._lock:
            return len(self._queue)
    
    def is_empty(self) -> bool:
        with self._lock:
            return len(self._queue) == 0
