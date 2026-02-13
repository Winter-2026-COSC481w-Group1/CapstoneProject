import json
import os
from typing import List
from app.schemas.assessment import AssessmentSchema
import google.generativeai as genai
from fastapi import HTTPException

class LLMService:
    def __init__(self):
       genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

       self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            #the model is pre-loaded to use json and our assessment scheme
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": AssessmentSchema
            }
        )

    #todo find out the format of context chunks
    def generate_assessment(self, context_chunks: list, difficulty: str, 
                            types: List[str]) -> AssessmentSchema:
        try:
            #Construct prompt with strict JSON formatting instructions
            prompt = f"""
            You are an exam writer. Based ONLY on the provided context, gernerate an assessment.

            CONTEXT: {chr(10).join(context_chunks)}

            DIFFICULTY: {difficulty}

            QUESTION TYPES: 
            Questions should only be of the types specified in this list:
            {', '.join(types)}

            OUTPUT INSTRUCTIONS:
            You must return ONLY a JSON object that matches the schema EXACTLY:

            Make sure that every question has a unique ID and accurately reflects the context.

            Set the source text and page number from the context for each question.
            """

            #call LLM
            raw_response = self.model.generate_content(prompt)

            #return json exam
            return AssessmentSchema.model_validate_json(raw_response)

        except Exception as e:
            # Handle retry logic or fallback if JSON is invalid
            print("exam invalid")