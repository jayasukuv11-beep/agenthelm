from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as f:
    long_description = f.read()

setup(
    name="agenthelm-sdk",
    version="0.1.0",
    author="AgentHelm",
    author_email="support@agenthelm.dev",
    description="Monitor your AI agents from one place",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://agenthelm.dev",
    project_urls={
        "Documentation": "https://agenthelm.dev/docs",
        "Bug Reports": "https://github.com/agenthelm/sdk/issues",
        "Source": "https://github.com/agenthelm/sdk",
    },
    packages=find_packages(exclude=["tests*"]),
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.28.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-mock>=3.10.0",
        ]
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    keywords=[
        "ai", "agents", "monitoring", 
        "observability", "agenthelm", "llm"
    ],
)
