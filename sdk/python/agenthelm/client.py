"""
AgentHelm Python SDK Client
"""

import os
import time
import json
import threading
import traceback
from datetime import datetime, timezone
from typing import Optional, Callable, Any, Dict

import requests

from .queue import OfflineQueue

# Default API URL — can be overridden for self-hosted
DEFAULT_BASE_URL = "https://agenthelm.online"


class Agent:
    """
    AgentHelm SDK — Connect any Python agent to AgentHelm.
    
    Usage:
        import agenthelm
        dock = agenthelm.connect("ahe_live_xxxxx", name="My Agent")
        dock.log("Agent started")
        dock.track_tokens(used=1500, model="gemini-flash")
    """
    
    def __init__(
        self,
        key: str,
        name: str = "Python Agent",
        agent_type: str = "python",
        version: str = "1.0.0",
        base_url: str = DEFAULT_BASE_URL,
        auto_ping: bool = True,
        ping_interval: int = 30,
        command_poll_interval: int = 5,
        verbose: bool = True,
        timeout: int = 10
    ):
        """
        Initialize AgentHelm connection.
        
        Args:
            key: Your AgentHelm connect key (ahe_live_xxxxx)
            name: Display name for this agent in dashboard
            agent_type: Type of agent ("python", "node", "other")
            version: Your agent's version string
            base_url: API base URL (change for self-hosted)
            auto_ping: Automatically send heartbeat pings
            ping_interval: Seconds between heartbeat pings
            command_poll_interval: Seconds between command polls
            verbose: Print connection status to console
            timeout: HTTP request timeout in seconds
        """
        if not key or not key.startswith("ahe_live_"):
            raise ValueError(
                "Invalid AgentHelm key. "
                "Keys must start with 'ahe_live_'. "
                "Get your key at agenthelm.dev/dashboard/settings"
            )
        
        self._key = key
        self._name = name
        self._agent_type = agent_type
        self._version = version
        self._base_url = base_url.rstrip("/")
        self._verbose = verbose
        self._timeout = 10
        self._ping_interval = ping_interval
        self._command_poll_interval = command_poll_interval
        
        # State
        self._agent_id: Optional[str] = None
        self._agent_token: Optional[str] = None
        self._running = True
        self._connected = False
        self._tokens_today = 0
        self._tokens_session = 0
        self._ping_timer: Optional[threading.Timer] = None
        
        # Concurrency
        self._active_tasks = 0
        self._task_lock = threading.Lock()
        
        # Command + chat handlers
        self._command_handlers: Dict[str, Callable] = {}
        self._chat_handler: Optional[Callable] = None
        self._dispatch_handler: Optional[Callable[[str], Any]] = None
        
        # Offline queue
        self._queue = OfflineQueue(maxsize=1000)
        
        # Register agent on startup
        self._register()
        
        # Start background threads (all daemon=True)
        if auto_ping:
            self._start_ping_timer()
        
        threading.Thread(
            target=self._command_loop,
            daemon=True,
            name="agenthelm-commands"
        ).start()
        
        threading.Thread(
            target=self._flush_loop,
            daemon=True,
            name="agenthelm-flush"
        ).start()
    
    # ─── PUBLIC METHODS ───────────────────────────────────
    
    def log(
        self,
        message: str,
        level: str = "info",
        data: Optional[dict] = None
    ) -> None:
        """
        Send a log message to AgentHelm dashboard.
        
        Args:
            message: The log message to display
            level: One of "info", "warning", "error", "success"
            data: Optional structured data (JSON-serializable dict)
        
        Example:
            dock.log("Processing started")
            dock.log("Warning: rate limit approaching", level="warning")
            dock.log("Error occurred", level="error")
        """
        try:
            payload = {
                "key": self._key,
                "agent_id": self._agent_id,
                "type": "log",
                "level": level,
                "message": str(message),
                "data": data,
                "timestamp": self._now()
            }
            self._send("/api/sdk/log", payload)
        except Exception as e:
            if self._verbose:
                print(f"[AgentHelm] ⚠️ Failed to log: {e}")
    
    def output(
        self,
        data: dict,
        label: str = "output"
    ) -> None:
        """
        Send structured output/results to dashboard.
        
        Args:
            data: Dictionary of results (must be JSON-serializable)
            label: Optional label for this output
        
        Example:
            dock.output({"leads_found": 12, "hot_leads": 5})
            dock.output({"orders": 3, "revenue": 1499}, label="daily_summary")
        """
        try:
            payload = {
                "key": self._key,
                "agent_id": self._agent_id,
                "type": "output",
                "level": "success",
                "message": f"[{label}] {json.dumps(data, default=str)}",
                "data": data,
                "label": label,
                "timestamp": self._now()
            }
            self._send("/api/sdk/output", payload)
        except Exception as e:
            if self._verbose:
                print(f"[AgentHelm] ⚠️ Failed to output: {e}")

    def progress(
        self,
        message: str,
        step: Optional[int] = None,
        total_steps: Optional[int] = None,
        percent: Optional[int] = None,
    ) -> None:
        """
        Send a progress update (e.g. during task execution).
        Use inside @dock.on_dispatch handlers.
        Sends type="progress" to /log with prefix [1/3] or [50%].

        Args:
            message: Progress message to display
            step: Current step (1-based)
            total_steps: Total number of steps
            percent: Progress percentage (0-100)

        Example:
            dock.progress("Starting task")
            dock.progress("Searching...", step=1, total_steps=3)
            dock.progress("Processing...", percent=50)
        """
        try:
            prefix = ""
            if step is not None and total_steps is not None and total_steps > 0:
                prefix = f"[{step}/{total_steps}] "
            elif percent is not None:
                prefix = f"[{percent}%] "
            full_message = f"{prefix}{message}"
            payload = {
                "key": self._key,
                "agent_id": self._agent_id,
                "type": "progress",
                "level": "info",
                "message": full_message,
                "data": {
                    k: v
                    for k, v in [
                        ("step", step),
                        ("total_steps", total_steps),
                        ("percent", percent),
                    ]
                    if v is not None
                },
                "timestamp": self._now(),
            }
            self._send("/api/sdk/log", payload)
        except Exception as e:
            if self._verbose:
                print(f"[AgentHelm] ⚠️ Failed to progress: {e}")

    def warn(
        self,
        message: str,
        data: Optional[dict] = None
    ) -> None:
        """Report a warning to AgentHelm dashboard."""
        try:
            payload = {
                "key": self._key,
                "agent_id": self._agent_id,
                "type": "log",
                "level": "warn",
                "message": str(message),
                "data": data,
                "timestamp": self._now()
            }
            self._send("/api/sdk/log", payload)
        except Exception as e:
            if self._verbose:
                print(f"[AgentHelm] ⚠️ Failed to warn: {e}")
    
    def error(
        self,
        message: str,
        exception: Optional[Exception] = None,
        include_traceback: bool = True
    ) -> None:
        """
        Report an error to AgentHelm dashboard.
        Automatically updates agent status to 'error'.
        
        Args:
            message: Human-readable error description
            exception: Optional exception object
            include_traceback: Whether to include full traceback
        
        Example:
            try:
                risky_operation()
            except Exception as e:
                dock.error("Operation failed", exception=e)
        """
        try:
            error_data = {"message": message}
            
            if exception:
                error_data["exception_type"] = type(exception).__name__
                error_data["exception_message"] = str(exception)
                
                if include_traceback:
                    error_data["traceback"] = traceback.format_exc()
            
            payload = {
                "key": self._key,
                "agent_id": self._agent_id,
                "type": "log",
                "level": "error",
                "message": message,
                "data": error_data,
                "timestamp": self._now()
            }
            self._send("/api/sdk/log", payload)
        except Exception as e:
            if self._verbose:
                print(f"[AgentHelm] ⚠️ Failed to error: {e}")
    
    def track_tokens(
        self,
        used: int,
        model: str,
        cost_per_1k: float = 0.0,
        prompt_tokens: Optional[int] = None,
        completion_tokens: Optional[int] = None
    ) -> None:
        """
        Track token usage for credits dashboard.
        
        Args:
            used: Total tokens used in this call
            model: Model name (e.g., "gemini-flash", "gpt-4", "claude-sonnet")
            cost_per_1k: Cost in USD per 1000 tokens (optional)
            prompt_tokens: Input tokens (optional breakdown)
            completion_tokens: Output tokens (optional breakdown)
        
        Example:
            dock.track_tokens(used=1500, model="gemini-flash")
            dock.track_tokens(
                used=2000, model="gpt-4",
                cost_per_1k=0.03,
                prompt_tokens=1200,
                completion_tokens=800
            )
        """
        cost_usd = round((used / 1000.0) * cost_per_1k, 8)
        self._tokens_today += used
        self._tokens_session += used
        
        payload = {
            "key": self._key,
            "agent_id": self._agent_id,
            "type": "tokens",
            "level": "info",
            "message": f"Token usage: {used:,} tokens ({model})",
            "tokens_used": used,
            "model": model,
            "cost_usd": cost_usd,
            "data": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": used,
                "model": model,
                "cost_usd": cost_usd
            },
            "timestamp": self._now()
        }
        self._send("/api/sdk/log", payload)
    
    def reply(self, message: str) -> None:
        """
        Send a reply back to a dashboard/Telegram chat message.
        Called inside @dock.on_chat handlers.
        
        Args:
            message: The reply message to send
        
        Example:
            @dock.on_chat
            def handle(msg):
                dock.reply(f"I received: {msg}")
        """
        payload = {
            "key": self._key,
            "agent_id": self._agent_id,
            "type": "chat_reply",
            "level": "info",
            "message": message,
            "timestamp": self._now()
        }
        self._send("/api/sdk/log", payload)
    
    def stop(self) -> None:
        """
        Gracefully stop the agent and notify dashboard.
        
        Example:
            @dock.on_command("stop")
            def handle_stop(payload):
                dock.log("Stopping gracefully...")
                dock.stop()
        """
        try:
            self._running = False
            if hasattr(self, '_ping_timer') and self._ping_timer:
                self._ping_timer.cancel()
                
            self._send("/api/sdk/ping", {
                "key": self._key,
                "agent_id": self._agent_id,
                "status": "stopped",
                "timestamp": self._now()
            })
            if self._verbose:
                print(f"[AgentHelm] ⏹  {self._name} stopped")
        except Exception as e:
            if self._verbose:
                print(f"[AgentHelm] ⚠️ Failed to stop: {e}")
    
    def listen(self) -> None:
        """
        Block the main thread and keep the agent running.
        Handles KeyboardInterrupt (Ctrl+C) gracefully.
        """
        if self._verbose:
            print(f"[AgentHelm] 👂 {self._name} listening for commands...")
        try:
            while self._running:
                time.sleep(1)
        except KeyboardInterrupt:
            if self._verbose:
                print(f"\n[AgentHelm] 🛑 Shutdown requested")
            self.stop()
            
        # Graceful Shutdown
        if self._active_tasks > 0 and self._verbose:
            print(f"[AgentHelm] ⏳ Waiting for {self._active_tasks} active task(s) to finish...")
        while self._active_tasks > 0:
            time.sleep(1)
        if self._verbose:
            print(f"[AgentHelm] 💤 Graceful shutdown complete.")
    
    # ─── DECORATORS ───────────────────────────────────────
    
    def on_command(self, command_type: str):
        """
        Decorator to handle commands from dashboard/Telegram.
        
        Args:
            command_type: Command name to listen for
                         ("stop", "start", "restart", or custom)
        
        Example:
            @dock.on_command("stop")
            def handle_stop(payload):
                cleanup()
                dock.stop()
            
            @dock.on_command("run_report")
            def handle_run(payload):
                run_report()
                dock.reply("Report generated!")
        """
        def decorator(func: Callable) -> Callable:
            self._command_handlers[command_type] = func
            return func
        return decorator
    
    def on_chat(self, func: Callable) -> Callable:
        """
        Decorator to handle chat messages from dashboard/Telegram.
        Use dock.reply() to respond.
        
        Example:
            @dock.on_chat
            def handle_chat(message: str):
                if "status" in message.lower():
                    dock.reply("All good!")
                else:
                    dock.reply(f"Got: {message}")
        """
        self._chat_handler = func
        return func

    def on_dispatch(self, func: Callable[[str], Any]) -> Callable[[str], Any]:
        """
        Decorator to handle dispatch tasks from Telegram/dashboard.
        Handler runs in a safe background thread. Use dock.progress() and
        dock.output() inside; dock.error() is called on exception.

        Example:
            @dock.on_dispatch
            def handle_task(task: str):
                dock.progress("Starting task")
                result = process(task)
                dock.output({"result": result})
        """
        self._dispatch_handler = func
        return func
    
    # ─── PROPERTIES ───────────────────────────────────────
    
    @property
    def auth_key(self) -> str:
        """The authentication key to use for API requests."""
        return self._agent_token or self._key
        
    @property
    def tokens_today(self) -> int:
        """Total tokens tracked today in this session."""
        return self._tokens_today
    
    @property
    def tokens_session(self) -> int:
        """Total tokens tracked in this session."""
        return self._tokens_session
    
    @property
    def agent_id(self) -> Optional[str]:
        """AgentHelm agent UUID."""
        return self._agent_id
    
    @property
    def is_connected(self) -> bool:
        """Whether agent is connected to AgentHelm."""
        return self._connected
    
    @property
    def name(self) -> str:
        """Agent display name."""
        return self._name
    
    # ─── PRIVATE METHODS ──────────────────────────────────
    
    def _register(self) -> None:
        """Register agent with AgentHelm on startup."""
        try:
            response = requests.post(
                f"{self._base_url}/api/sdk/ping",
                json={
                    "key": self.auth_key,
                    "name": self._name,
                    "agent_type": self._agent_type,
                    "version": self._version,
                    "status": "running",
                    "started_at": self._now()
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self._agent_id = data.get("agent_id")
                if data.get("agent_token"):
                    self._agent_token = data.get("agent_token")
                self._connected = True
                if self._verbose:
                    agent_short = "unknown"
                    if self._agent_id:
                        agent_short = str(self._agent_id)[:8] + "..."
                    print(
                        f"[AgentHelm] ✅ Connected: "
                        f"{self._name} ({agent_short})"
                    )
            elif response.status_code == 401:
                if self._verbose:
                    print("[AgentHelm] ❌ Invalid connect key.")
            else:
                if self._verbose:
                    print(f"[AgentHelm] ⚠️ HTTP {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            if self._verbose:
                print("[AgentHelm] ⚠️  Offline mode — will retry connection...")
        except Exception as e:
            if self._verbose:
                print(f"[AgentHelm] ⚠️  Connection failed: {e}")
    
    def _send(self, endpoint: str, payload: dict) -> bool:
        """
        Send request to AgentHelm API.
        Falls back to offline queue on failure.
        """
        payload["key"] = self.auth_key
        try:
            response = requests.post(
                f"{self._base_url}{endpoint}",
                json=payload,
                timeout=self._timeout
            )
            return response.status_code == 200
        except Exception:
            # Queue for retry when back online
            if self._queue.size() < 1000:
                self._queue.push(endpoint, payload)
            return False
    
    def _start_ping_timer(self) -> None:
        """Start the heartbeat timer."""
        if self._running:
            self._ping_timer = threading.Timer(self._ping_interval, self._ping_loop)
            if self._ping_timer:
                self._ping_timer.daemon = True
                self._ping_timer.start()

    def _ping_loop(self) -> None:
        """Send heartbeat."""
        if not self._running:
            return
        try:
            response = requests.post(
                f"{self._base_url}/api/sdk/ping",
                json={
                    "key": self.auth_key,
                    "agent_id": self._agent_id,
                    "status": "running",
                    "timestamp": self._now()
                },
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                if not self._agent_id and data.get("agent_id"):
                    self._agent_id = data.get("agent_id")
                if data.get("agent_token"):
                    self._agent_token = data.get("agent_token")
        except Exception:
            pass
        self._start_ping_timer()
    
    def _command_loop(self) -> None:
        """Poll for commands every command_poll_interval seconds."""
        while self._running:
            try:
                response = requests.get(
                    f"{self._base_url}/api/sdk/command",
                    params={
                        "key": self.auth_key,
                        "agent_id": self._agent_id
                    },
                    timeout=self._timeout
                )
                
                if response.status_code == 200:
                    data = response.json()
                    commands = data.get("commands", [])
                    
                    for cmd in commands:
                        self._handle_command(cmd)
                        
            except Exception:
                pass
            
            time.sleep(self._command_poll_interval)
    
    def _handle_command(self, cmd: dict) -> None:
        """Route command to correct handler."""
        command_type = cmd.get("command_type", "")
        payload = cmd.get("payload", {})
        
        try:
            if command_type == "chat":
                # Route to chat handler
                if self._chat_handler:
                    message = payload.get("message", "")
                    threading.Thread(
                        target=self._chat_handler,
                        args=(message,),
                        daemon=True
                    ).start()

            elif command_type == "dispatch":
                # Route to dispatch handler (runs in safe background thread)
                task = payload.get("task", "")
                if self._dispatch_handler:
                    threading.Thread(
                        target=self._run_dispatch_safe,
                        args=(task,),
                        daemon=True
                    ).start()
                elif self._verbose:
                    print(f"[AgentHelm] ⚠️ No @on_dispatch handler for task: {task}")
                    
            elif command_type in self._command_handlers:
                # Route to registered command handler
                handler = self._command_handlers[command_type]
                threading.Thread(
                    target=handler,
                    args=(payload,),
                    daemon=True
                ).start()
                
        except Exception as e:
            print(f"[AgentHelm] ❌ Command handler error: {e}")

    def _run_dispatch_safe(self, task: str) -> None:
        """Run dispatch handler with progress/output/error wrapping."""
        with self._task_lock:
            self._active_tasks += 1
            
        try:
            if not self._dispatch_handler:
                return
            
            try:
                self.progress("Starting task")
                result = self._dispatch_handler(task)
                if isinstance(result, dict):
                    self.output(result)
                else:
                    self.output({"result": result})
            except Exception as e:
                # self.error isn't defined, using log/warn pattern or just printing for now
                if self._verbose:
                    print(f"[AgentHelm] ❌ Task failed: {e}")
                self.log(f"Task failed: {e}", level="error")
        finally:
            with self._task_lock:
                self._active_tasks -= 1
    
    def _flush_loop(self) -> None:
        """Retry failed requests from offline queue."""
        while self._running:
            if not self._queue.is_empty():
                item = self._queue.pop()
                if item:
                    endpoint, payload = item
                    self._send(endpoint, payload)
            time.sleep(10)
    
    @staticmethod
    def _now() -> str:
        """Return current UTC timestamp as ISO string."""
        return datetime.now(timezone.utc).isoformat()
    
    def __repr__(self) -> str:
        return (
            f"AgentHelm(name='{self._name}', "
            f"connected={self._connected}, "
            f"agent_id='{self._agent_id}')"
        )
    
    def __enter__(self):
        """Support using as context manager."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Auto-stop when used as context manager."""
        self.stop()


def connect(
    key: str,
    name: str = "Python Agent",
    **kwargs
) -> Agent:
    """
    One-line shortcut to connect an agent to AgentHelm.
    
    Args:
        key: Your AgentHelm connect key (ahe_live_xxxxx)
        name: Display name for this agent
        **kwargs: Additional options passed to AgentHelm()
    
    Returns:
        Connected Agent instance
    
    Example:
        import agenthelm
        dock = agenthelm.connect("ahe_live_xxxxx", name="My Agent")
    """
    return Agent(key=key, name=name, **kwargs)
