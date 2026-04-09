"""
AgentHelm Reasoning Chain Capture

Monkey-patches supported LLM client libraries to auto-capture reasoning steps
(prompts, decisions, latencies) without requiring manual instrumentation.

Supported providers:
  - openai  (client.chat.completions.create)
  - anthropic (client.messages.create)

Studio-only feature.
"""

import time
import hashlib
import functools
import warnings
from typing import Optional, Callable, Dict, Any, List


class ReasoningCapture:
    """
    Intercepts LLM calls and captures reasoning chain telemetry.
    
    Usage (internal — initialized by Agent.__init__):
        capture = ReasoningCapture(send_fn=agent._log_reasoning_step)
        capture.patch_providers(["openai", "anthropic"])
    """

    def __init__(self, send_fn: Callable[[dict], None], agent_id: str, verbose: bool = True):
        self._send_fn = send_fn
        self._agent_id = agent_id
        self._verbose = verbose
        self._step_counter = 0
        self._patched_providers: List[str] = []

    def patch_providers(self, providers: List[str]) -> None:
        """Attempt to monkey-patch each requested provider."""
        for provider in providers:
            try:
                if provider == "openai":
                    self._patch_openai()
                elif provider == "anthropic":
                    self._patch_anthropic()
                else:
                    if self._verbose:
                        print(f"[AgentHelm] ⚠️ Unknown reasoning provider: {provider}")
                    continue
                self._patched_providers.append(provider)
            except ImportError:
                if self._verbose:
                    print(f"[AgentHelm] ⚠️ Provider '{provider}' not installed — skipping reasoning capture for it.")
            except Exception as e:
                if self._verbose:
                    print(f"[AgentHelm] ⚠️ Failed to patch '{provider}': {e}")

    # ─── OpenAI Patch ────────────────────────────────────────

    def _patch_openai(self) -> None:
        """Wrap openai.resources.chat.completions.Completions.create"""
        import openai
        from openai.resources.chat import completions as chat_mod

        original_create = chat_mod.Completions.create
        capture = self  # closure ref

        @functools.wraps(original_create)
        def patched_create(self_inner, *args, **kwargs):
            start = time.time()
            result = original_create(self_inner, *args, **kwargs)
            latency_ms = int((time.time() - start) * 1000)

            try:
                capture._record_openai_step(kwargs, result, latency_ms)
            except Exception:
                pass  # never crash the user's LLM call

            return result

        chat_mod.Completions.create = patched_create
        if self._verbose:
            print("[AgentHelm] 🧠 Patched openai.chat.completions.create for reasoning capture")

    def _record_openai_step(self, kwargs: dict, result: Any, latency_ms: int) -> None:
        messages = kwargs.get("messages", [])
        model = kwargs.get("model", "unknown")

        # Hash the full prompt for privacy
        prompt_text = str(messages)
        prompt_hash = hashlib.sha256(prompt_text.encode()).hexdigest()
        prompt_summary = prompt_text[:200]

        # Extract response
        response_text = ""
        decision = "direct_response"
        tokens_used = 0

        try:
            choice = result.choices[0]
            response_text = choice.message.content or ""
            if choice.message.tool_calls:
                tool_names = [tc.function.name for tc in choice.message.tool_calls]
                decision = f"tool_call:{','.join(tool_names)}"
            
            if hasattr(result, 'usage') and result.usage:
                tokens_used = result.usage.total_tokens or 0
        except (AttributeError, IndexError):
            pass

        self._emit_step(
            prompt_hash=prompt_hash,
            prompt_summary=prompt_summary,
            model_response_summary=response_text[:500],
            decision=decision,
            model=model,
            tokens_used=tokens_used,
            latency_ms=latency_ms,
        )

    # ─── Anthropic Patch ─────────────────────────────────────

    def _patch_anthropic(self) -> None:
        """Wrap anthropic.resources.messages.Messages.create"""
        import anthropic
        from anthropic.resources import messages as msg_mod

        original_create = msg_mod.Messages.create
        capture = self

        @functools.wraps(original_create)
        def patched_create(self_inner, *args, **kwargs):
            start = time.time()
            result = original_create(self_inner, *args, **kwargs)
            latency_ms = int((time.time() - start) * 1000)

            try:
                capture._record_anthropic_step(kwargs, result, latency_ms)
            except Exception:
                pass

            return result

        msg_mod.Messages.create = patched_create
        if self._verbose:
            print("[AgentHelm] 🧠 Patched anthropic.messages.create for reasoning capture")

    def _record_anthropic_step(self, kwargs: dict, result: Any, latency_ms: int) -> None:
        messages = kwargs.get("messages", [])
        model = kwargs.get("model", "unknown")
        system = kwargs.get("system", "")

        prompt_text = f"system:{system}\n{str(messages)}"
        prompt_hash = hashlib.sha256(prompt_text.encode()).hexdigest()
        prompt_summary = prompt_text[:200]

        response_text = ""
        decision = "direct_response"
        tokens_used = 0

        try:
            for block in result.content:
                if hasattr(block, 'text'):
                    response_text += block.text
                elif hasattr(block, 'type') and block.type == 'tool_use':
                    decision = f"tool_call:{block.name}"

            if hasattr(result, 'usage') and result.usage:
                tokens_used = (result.usage.input_tokens or 0) + (result.usage.output_tokens or 0)
        except (AttributeError, IndexError):
            pass

        self._emit_step(
            prompt_hash=prompt_hash,
            prompt_summary=prompt_summary,
            model_response_summary=response_text[:500],
            decision=decision,
            model=model,
            tokens_used=tokens_used,
            latency_ms=latency_ms,
        )

    # ─── Common emit ─────────────────────────────────────────

    def _emit_step(self, **kwargs) -> None:
        self._step_counter += 1
        step = {
            "step_index": self._step_counter,
            **kwargs,
        }
        if self._verbose:
            print(f"[AgentHelm] 🧠 Reasoning step {self._step_counter}: {kwargs.get('decision', '?')} via {kwargs.get('model', '?')}")
        self._send_fn(step)
