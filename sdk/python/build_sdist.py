import os
import tarfile
import shutil

VERSION = "0.2.1"
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
        tar.add(filename, arcname=f"{DIR_NAME}/{arcname or filename}")

with tarfile.open(tar_path, "w:gz") as tar:
    add_file(tar, "PKG-INFO")
    add_file(tar, "README.md")
    add_file(tar, "setup.py")
    add_file(tar, "pyproject.toml")
    add_file(tar, "LICENSE")
    add_file(tar, "agenthelm/__init__.py")
    add_file(tar, "agenthelm/client.py")

os.remove("PKG-INFO")
print("Successfully created", tar_path)
