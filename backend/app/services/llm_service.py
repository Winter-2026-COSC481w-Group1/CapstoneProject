import json
import os
from app.schemas.assessment import AssessmentSchema
import google.generativeai as genai
from fastapi import HTTPException


class LLMService:
    def __init__(self):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            # the model is pre-loaded to use json and our assessment scheme
            generation_config={
                "response_mime_type": "application/json",
                # "response_schema": AssessmentSchema
            },
        )

    # todo find out the format of context chunks
    async def generate_assessment(
        self,
        query: str,
        context: str,
        num_questions: int,
        difficulty: str,
        types: list[str],
    ) -> AssessmentSchema:
        try:
            schema_json = json.dumps(AssessmentSchema.model_json_schema(), indent=2)
            # Construct prompt with strict JSON formatting instructions
            prompt = f"""
                You are an expert exam generator. 
                Your goal is to generate an assessment covering the following TOPICS: "{query}".
                Based ONLY on the provided context, generate a complete JSON assessment.

                CONTEXT:
                {context}

                STRATEGY:
                - MULTI-TOPIC DISTRIBUTION: The user has provided topics: "{query}". You MUST distribute the {num_questions} questions as evenly as possible across these topics.
                - CONTEXT SEGMENTATION: Use the headers "=== TOPIC: [NAME] ===" in the CONTEXT to identify which information belongs to which topic.
                - RELEVANCE FIRST: For every question, ensure the fact used is directly relevant to one of the requested topics.
                - SKIP RULE: If a SOURCE does not contain information about any of the requested topics, skip it. Do not hallucinate or "stretch" a fact.
                - DIVERSITY (Bloom's Taxonomy): Vary the cognitive depth of the {num_questions} questions:
                    1. Factual: Direct definitions or syntax.
                    2. Conceptual: Explaining "How" or "Why".
                    3. Applied: Scenario-based problems or use-cases.
                - SELF-CONTAINMENT RULE: Every question must be answerable without referring to the "provided text," "source," or "context." 
                - NO DEICTIC REFERENCES: Avoid phrases like "according to the text," "as mentioned in the source," or "based on the figure above." 
                - FACT INCLUSION: If a question relies on a specific scenario from the text, include that scenario description within the question stem itself.
                - QUOTA: Aim for exactly {num_questions} questions total. Only stop early if the relevant CONTEXT for all topics is completely exhausted.
                - TRUE/FALSE RULE: For "true-false" types, "options" MUST be exactly ["True", "False"]. Index 0 is True, Index 1 is False.
                - SHORT ANSWER RULE: For "short-answer", "options" MUST contain exactly one string (the correct answer). "correctAnswer" index must be 0.
                
                INSTRUCTIONS:
                1. Generate a JSON object matching the REQUIRED STRUCTURE exactly.
                2. Ensure the "questions" list contains exactly {num_questions} items, balanced across the requested topics.
                3. Difficulty level: "{difficulty}".
                4. Question types allowed: {json.dumps(types)}.
                5. METADATA ATTRIBUTION: Every question MUST include the document_id and page_number. Look at the context header: --- SOURCE [Number] (ID: [UUID] | PAGE: [Number]) ---. Extract the UUID string for document_id and the integer for page_number.
                6. TOPIC TAGGING: Ensure each question is mapped to the correct topic from the provided list: "{query}".

                REQUIRED JSON STRUCTURE:
                {schema_json}
                """

            # call LLM
            raw_response = self.model.generate_content(prompt)

            # check that response text exists
            if not raw_response.text:
                raise ValueError("LLM returned an empty response")

            return AssessmentSchema.model_validate_json(raw_response.text)

        except Exception as e:
            # Handle retry logic or fallback if JSON is invalid
            print(f"LLM Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate assessment")
