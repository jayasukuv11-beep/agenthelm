import requests
from typing import Optional

class PresenceManager:
    """
    Handles live agent presence and file ownership locking.
    """
    def __init__(self, client):
        self.client = client

    def update_status(self, status: str, current_file: Optional[str] = None) -> None:
        """
        Updates the agent's current status and working file.
        """
        try:
            payload = {
                "key": self.client.auth_key,
                "agent_id": self.client._agent_id,
                "status": status,
                "current_file": current_file,
                "timestamp": self.client._now()
            }
            # Fire and forget
            self.client._send_async("/api/sdk/state", payload)
        except Exception as e:
            if self.client._verbose:
                print(f"[AgentHelm] ⚠️ Failed to update presence: {e}")

    def claim_file(self, file_path: str) -> bool:
        """
        Attempts to acquire an exclusive lock on a file.
        Returns True if successful, False if blocked by another agent.
        """
        try:
            payload = {
                "key": self.client.auth_key,
                "agent_id": self.client._agent_id,
                "file": file_path,
                "timestamp": self.client._now()
            }
            response = requests.post(
                f"{self.client._base_url}/api/sdk/presence/claim",
                json=payload,
                timeout=self.client._timeout
            )
            if response.status_code == 200:
                data = response.json()
                if not data.get("claimed"):
                    self.client.warn(f"Conflict: File {file_path} is locked by {data.get('owner')}")
                return data.get("claimed", False)
            return False
        except Exception as e:
            if self.client._verbose:
                print(f"[AgentHelm] ⚠️ Failed to claim file {file_path}: {e}")
            return False
