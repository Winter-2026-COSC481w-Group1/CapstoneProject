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
            #the model is pre-loaded to use json and our assessment scheme
            generation_config={
                "response_mime_type": "application/json",
                #"response_schema": AssessmentSchema
            }
        )

    #todo find out the format of context chunks
    async def generate_assessment(
            self, 
            context: str, 
            num_questions: int, 
            difficulty: str, 
            types: list[str]
    ) -> AssessmentSchema:
        try:
            schema_json = json.dumps(AssessmentSchema.model_json_schema(), indent=2)
            #Construct prompt with strict JSON formatting instructions
            prompt = f"""
                You are an expert exam generator. 
                Based ONLY on the provided context, generate a complete JSON assessment.

                CONTEXT:
                {context}

                INSTRUCTIONS:
                1. Generate a JSON object that matches the structure below EXACTLY.
                2. You MUST include "difficulty" and "questions". Do not stop early.
                3. For "questions", generate exactly {num_questions} items.
                4. Use the difficulty level: "{difficulty}".
                5. Use these question types: {json.dumps(types)}.

                REQUIRED JSON STRUCTURE:
                {schema_json}
                """

            #call LLM
            raw_response = self.model.generate_content(prompt)

            #check that response text exists
            if not raw_response.text:
             raise ValueError("LLM returned an empty response")
            
            #print(f"{raw_response}")
            print(f"{raw_response.text}")

            return AssessmentSchema.model_validate_json(raw_response.text)

        except Exception as e:
            # Handle retry logic or fallback if JSON is invalid
            print(f"LLM Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate assessment")