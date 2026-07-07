import hashlib
import json
import subprocess
import uuid
import requests
from typing import List, Dict, Optional, Any


class ProposalPublisher:
    """
    Handles publishing Knowledge Proposals to the Brain Compiler.
    
    Agents do NOT publish truth — they publish proposed knowledge.
    The Brain Compiler detects conflicts and decides what to merge.
    """
    def __init__(self, client):
        self.client = client

    def _hash_content(self, payload: Dict[str, Any]) -> str:
        """Deterministically hash the proposal payload for integrity verification."""
        content_str = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(content_str.encode("utf-8")).hexdigest()

    def _git(self, *args: str) -> Optional[str]:
        try:
            result = subprocess.run(
                ["git", *args],
                capture_output=True,
                text=True,
                timeout=2,
                check=True
            )
            value = result.stdout.strip()
            return value or None
        except Exception:
            return None

    def _git_changed_files(self) -> List[str]:
        output = self._git("status", "--short")
        if not output:
            return []

        files: List[str] = []
        for line in output.splitlines():
            path = line[3:].strip()
            if " -> " in path:
                path = path.split(" -> ", 1)[1]
            if path:
                files.append(path)
        return files

    def publish(
        self,
        summary: str,
        decisions: Optional[List[Dict[str, Any]]] = None,
        files: Optional[List[str]] = None,
        apis: Optional[List[Dict[str, Any]]] = None,
        db_changes: Optional[List[Dict[str, Any]]] = None,
        known_limitations: Optional[List[str]] = None,
        next_steps: Optional[List[str]] = None,
        commit_sha: Optional[str] = None,
        branch: Optional[str] = None,
        author: Optional[str] = None,
        tests_passed: bool = False,
        issue_linked: Optional[str] = None
    ) -> str:
        """
        Publishes a Knowledge Proposal to the Brain Compiler.
        
        The proposal is NOT truth. It enters a queue where the Brain Compiler
        will detect conflicts, calculate evidence-based confidence, and decide
        whether to auto-merge, auto-supersede, or pause for human review.
        
        Returns:
            proposal_id if successful, empty string on failure.
        """
        if not self.client._project:
            self.client.warn("Cannot publish proposal: Agent is not connected to a project.")
            return ""

        detected_branch = branch or self._git("branch", "--show-current")
        detected_commit = commit_sha or self._git("rev-parse", "--short=12", "HEAD")
        detected_files = files if files is not None else self._git_changed_files()

        payload = {
            "summary": summary,
            "decisions": decisions or [],
            "files_modified": detected_files,
            "apis_affected": apis or [],
            "db_changes": db_changes or [],
            "known_limitations": known_limitations or [],
            "next_steps": next_steps or [],
            "tests_passed": tests_passed,
            "commit_sha": detected_commit,
            "branch": detected_branch,
            "author": author or self.client._name,
            "issue_linked": issue_linked
        }

        content_hash = self._hash_content(payload)

        request_data = {
            "key": self.client.auth_key,
            "agent_id": self.client._agent_id,
            "project": self.client._project,
            "content_hash": content_hash,
            "payload": payload,
            "timestamp": self.client._now()
        }

        try:
            response = requests.post(
                f"{self.client._base_url}/api/sdk/proposals",
                json=request_data,
                timeout=self.client._timeout
            )
            if response.status_code == 200:
                data = response.json()
                proposal_id = data.get("proposal_id", str(uuid.uuid4()))
                status = data.get("status", "submitted")
                self.client.log(f"Knowledge Proposal {status} (hash: {content_hash[:8]})")
                return proposal_id
            else:
                self.client.error(f"Failed to submit proposal: HTTP {response.status_code}")
                return ""
        except Exception as e:
            self.client.error("Error publishing Knowledge Proposal", exception=e)
            return ""
