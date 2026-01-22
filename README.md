Project Identity: AI Assessment Platform 

https://capstone-project-teal-delta.vercel.app/

Core Objective
The platform is a scalable educational tool designed to process PDF study materials using Retrieval-Augmented Generation (RAG). It automatically generates context-aware examinations, including Multiple Choice Questions (MCQs), short answers, and grading rubrics. The system architecture is designed to transition into a Data-as-a-Service (DaaS) model, exposing a public API for educational datasets.

Technical Stack
AI and Inference
Inference Engine: Llama 3 / 3.1 running locally via Ollama.

Embeddings Model: Nomic Embed Text (v1.5).

Vector Store: Supabase (PostgreSQL with pgvector extension).

Backend and Database
API Framework: Python (FastAPI).

Database: Supabase for relational data, metadata storage, and vector embeddings.

Authentication: Zero Auth for user identity management.

API Management: Kong Gateway for traffic control and future monetization.

Frontend and Deployment
Framework: React / Next.js.

Deployment: Dockerized container environment.

Data Logic and Privacy Constraints
1:1 Ownership Model
To maintain compliance with copyright regulations and ensure data privacy, the system enforces a strict isolation policy. Users are restricted to generating assessments only from documents they have personally uploaded. Access to other users' materials is prohibited.

Unified Storage and Deduplication
The backend implements SHA-256 hashing for file deduplication. Identical files uploaded by different users are stored as a single set of vector embeddings within Supabase to conserve resources. However, the system maintains distinct access control records in a junction table to preserve the 1:1 ownership rule, ensuring that a user can only query embeddings associated with their account.

Development Roadmap
Phase 1: MVP (Current Focus)
Enable pgvector on Supabase and configure vector tables.

Implementation of the RAG pipeline (Ingest, Chunk, Embed, Store).

PDF parsing and text extraction logic.

Generation of MCQs and one-word answer assessments.

Phase 2: Application Layer
User account differentiation (Teacher vs. Student) via Zero Auth integration.

Automated grading for objective question types.

Student mock examination mode.

Phase 3: API Economy
Exposure of classified question banks via Kong Gateway.

Third-party developer access to the DaaS ecosystem.
