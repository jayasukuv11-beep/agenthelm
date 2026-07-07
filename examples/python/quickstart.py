#!/usr/bin/env python3
"""
AgentHelm Python SDK Compatibility Quickstart Example
Verifies both modern Agent class and deprecated AgentHelm class alias.
"""

import sys
import os

# Adjust path to import local agenthelm first
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../sdk/python')))

import agenthelm

def main():
    print("Testing AgentHelm Python SDK initialization...")

    connect_key = "ahe_live_test_key"
    
    # 1. Test using the modern Agent class
    print("\nInitializing using Agent...")
    agent_modern = agenthelm.Agent(
        key=connect_key,
        name="Python Modern Agent",
        project="agenthelm-core",
        auto_ping=False
    )
    print(f"Modern Agent name: {agent_modern.name}")
    
    # 2. Test using the deprecated AgentHelm class alias
    print("\nInitializing using deprecated AgentHelm...")
    # This should trigger a DeprecationWarning
    agent_legacy = agenthelm.AgentHelm(
        key=connect_key,
        name="Python Legacy Agent",
        project="agenthelm-core",
        auto_ping=False
    )
    print(f"Legacy Agent name: {agent_legacy.name}")
    
    print("\nPython SDK Compatibility Test passed successfully!")

if __name__ == "__main__":
    main()
