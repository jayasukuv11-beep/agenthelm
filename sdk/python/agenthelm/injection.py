import requests
from typing import Optional, Dict, Any

class ContextInjector:
    """
    Handles fetching and injecting Project Brain context into the agent.
    """
    def __init__(self, client):
        self.client = client
        self.current_context = None
        self.selection = {}

    def get_context(self, project: str, task_hint: Optional[str] = None, trusted_only: bool = True) -> Dict[str, Any]:
        """
        Retrieves relevant context from the Project Brain using Smart Context Selection.
        """
        if not self.client.auth_key:
            return {}

        payload = {
            "key": self.client.auth_key,
            "agent_id": self.client._agent_id,
            "project": project,
            "task_hint": task_hint,
            "trusted_only": trusted_only,
            "max_context_tokens": getattr(self.client, "_max_context_tokens", None),
            "timestamp": self.client._now()
        }

        try:
            response = requests.post(
                f"{self.client._base_url}/api/sdk/inject",
                json=payload,
                timeout=self.client._timeout
            )
            if response.status_code == 200:
                data = response.json()
                self.current_context = data.get("context", {})
                self.selection = data.get("selection", {})
                
                # Log injection success
                context_size = len(str(self.current_context))
                if context_size > 50:
                    selected = self.selection.get("entries_selected")
                    suffix = f", {selected} entries selected" if selected is not None else ""
                    
                    # Highlight if there are entries that need review
                    needs_review_count = sum(
                        1 for src in self.selection.get("sources", [])
                        if src.get("validity_status") == "NEEDS_REVIEW"
                    )
                    review_msg = f" ({needs_review_count} flagged for review)" if needs_review_count > 0 else ""
                    
                    self.client.log(f"Project Brain context injected ({context_size} bytes{suffix}){review_msg}.")
                
                return self.current_context
            else:
                self.client.warn(f"Failed to inject context: HTTP {response.status_code}")
                return {}
        except Exception as e:
            self.client.warn(f"Error fetching context: {e}")
            return {}

    def format_prompt_prefix(self) -> str:
        """
        Formats the current context as a string to prefix the agent's system prompt.
        """
        if not self.current_context:
            return ""
            
        lines = ["# PROJECT BRAIN CONTEXT"]
        
        arch = self.current_context.get("architecture")
        if arch:
            lines.append(f"\n## Architecture\n{arch}")
            
        decisions = self.current_context.get("decisions")
        if decisions:
            lines.append(f"\n## Key Decisions\n{decisions}")
            
        standards = self.current_context.get("standards")
        if standards:
            lines.append(f"\n## Standards\n{standards}")
            
        # Highlight warnings if any
        if any("_warning" in str(cat) for cat in self.current_context.values()):
            lines.append("\n> [!WARNING]\n> Some context above has been flagged for review due to recent project changes. Please verify its validity.")
            
        return "\n".join(lines)
