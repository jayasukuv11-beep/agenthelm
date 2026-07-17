import os
import tarfile
import shutil
import re

# Read version dynamically from agenthelm/__init__.py
with open("agenthelm/__init__.py", "r", encoding="utf-8") as f:
    version_match = re.search(r'__version__\s*=\s*["\']([^"\']+)["\']', f.read())
    if not version_match:
        raise ValueError("Could not find __version__ in agenthelm/__init__.py")
    VERSION = version_match.group(1)

NAME = "agenthelm-sdk"
DIR_NAME = f"{NAME}-{VERSION}"
FILE_NAME = f"{NAME.replace('-', '_')}-{VERSION}"

os.makedirs('dist', exist_ok=True)
tar_path = f"dist/{FILE_NAME}.tar.gz"

with open('README.md', 'r', encoding='utf-8') as f:
    readme = f.read()

pkg_info = f"""Metadata-Version: 2.1
Name: {NAME}
Version: {VERSION}
Summary: Python SDK for AgentHelm - AI Agent Control Plane
Home-page: https://agenthelm.vercel.app
Author: AgentHelm Team
Author-email: hello@agenthelm.dev
License: MIT
Project-URL: Repository, https://github.com/jayasukuv11-beep/agenthelm
Description-Content-Type: text/markdown

{readme}
"""

with open("PKG-INFO", "w", encoding="utf-8") as f:
    f.write(pkg_info)

def add_file(tar, filename, arcname=None):
    if os.path.exists(filename):
        # Normalize paths to use forward slashes in tar archive
        arc = f"{DIR_NAME}/{arcname or filename}".replace("\\", "/")
        tar.add(filename, arcname=arc)

with tarfile.open(tar_path, "w:gz") as tar:
    add_file(tar, "PKG-INFO")
    add_file(tar, "README.md")
    add_file(tar, "setup.py")
    add_file(tar, "pyproject.toml")
    add_file(tar, "LICENSE")
    
    # Recursively find and add all Python files in the agenthelm module
    for root, dirs, files in os.walk("agenthelm"):
        for file in files:
            if file.endswith(".py"):
                filepath = os.path.join(root, file)
                add_file(tar, filepath)

os.remove("PKG-INFO")
print("Successfully created", tar_path)
