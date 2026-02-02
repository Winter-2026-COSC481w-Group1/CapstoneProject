import jwt  # This MUST be PyJWT
import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

load_dotenv()

security = HTTPBearer()
SUPABASE_URL = os.getenv("SUPABASE_URL")
JWT_SECRET = os.getenv("PGRST_JWT_SECRET")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

jwks_client = jwt.PyJWKClient(JWKS_URL)


async def get_current_user(auth: HTTPAuthorizationCredentials = Depends(security)):
    token = auth.credentials

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
        user_id = payload.get("sub")
        return {"user_id": user_id}
    except Exception as e:
        print(f"Auth Error: {type(e).__name__} - {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
