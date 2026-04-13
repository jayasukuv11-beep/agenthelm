from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="agenthelm-sdk",
    version="1.0.0",
    author="AgentHelm Team",
    author_email="hello@agenthelm.dev",
    description="Python SDK for AgentHelm — AI Agent Control Plane",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://agenthelm.vercel.app",
    project_urls={
        "Repository": "https://github.com/jayasukuv11-beep/agenthelm",
    },
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.28.0"
    ],
)
