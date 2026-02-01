Project Identity: AI Assessment Platform 

https://capstone-project-teal-delta.vercel.app/

## Core Objective
The platform is a scalable educational tool designed to process PDF study materials using Retrieval-Augmented Generation (RAG). It automatically generates context-aware examinations, including Multiple Choice Questions (MCQs), short answers, and grading rubrics.


## Developer Prerequisites
To ensure consistency across the team, all developers **must** use the following stack:
* **OS:** Windows Subsystem for Linux (WSL2 - Ubuntu)
* **Language:** Python 3.10+ & Node.js 18+
* **IDE:** VS Code with the following extensions:
    * `Python` (Microsoft)
    * `Ruff` (Astral Software)

---

## Quick Start: Backend Setup

The backend logic resides in the `/backend` directory. We use a hidden virtual environment (`.venv`) and **Ruff** for automated linting and formatting.

### 1. Initialize the Environment
Open your WSL terminal and run:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt