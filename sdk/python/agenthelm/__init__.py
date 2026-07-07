"""
AgentHelm SDK — Monitor your AI agents from one place.
https://agenthelm.dev
"""

from .client import (
    Agent, 
    connect, 
    HardLimitBreached, 
    LoopDetected, 
    InjectionDetected, 
    PermissionDenied
)
from .memory import MemoryEngine
from .swarms import SwarmCoordinator

# MVP Project Brain Modules
from .proposals import ProposalPublisher
from .contracts import ContractPublisher  # Backwards compat
from .injection import ContextInjector
from .presence import PresenceManager
from .timeline import TimelineBuffer

# Backward compatibility alias
AgentHelm = Agent

__version__ = "1.1.0"
__all__ = [
    "Agent", 
    "AgentHelm",
    "connect", 
    "MemoryEngine", 
    "SwarmCoordinator",
    "ProposalPublisher",
    "ContractPublisher",
    "ContextInjector",
    "PresenceManager",
    "TimelineBuffer",
    "HardLimitBreached",
    "LoopDetected",
    "InjectionDetected",
    "PermissionDenied"
]
