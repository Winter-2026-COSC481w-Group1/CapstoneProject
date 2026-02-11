import json
from typing import List
from app.schemas.assessment import AssessmentSchema

class AssessmentService:
    def generate_assessment(self, context_chunks: list, difficulty: str, 
                            types: List[str]) -> AssessmentSchema:
        
        #Get the schema format to send to the LLM
        schema_format = AssessmentSchema.model_json_schema()
        #Construct prompt with strict JSON formatting instructions
        prompt = f"""
        You are an exam writer. Based ONLY on the provided context, gernerate an assessment.
        
        CONTEXT: {chr(10).join(context_chunks)}

        DIFFICULTY: {difficulty}

        QUESTION TYPES: 
        Questions should only be of the types specified in this list:
        {', '.join(types)}

        OUTPUT INSTRUCTIONS:
        You must return ONLY a JSON object that matches this schema EXACTLY:
        {schema_format}

        Make sure that every question has a unique ID and accurately reflects the context.
        """
        
        # 2. call LLM
        raw_response = self.call_llm(prompt) # Placeholder for your Ollama logic
        
        try:
            # 3. SCHEMA ENFORCEMENT
            # This will raise an error if LLM misses a field or hallucinate a type
            return AssessmentSchema.model_validate_json(raw_response)
        except Exception as e:
            # Handle retry logic or fallback if JSON is invalid
            print(f"Schema Validation Failed: {e}")

    def call_llm(prompt):
        #code to make the actual api call here
        print(f"api_call {prompt}")