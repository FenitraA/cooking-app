from datetime import  timedelta, timezone, datetime
import time
from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.decorators import handle_endpoint_errors
from app.core.security import get_current_user, require_roles
from app.services.general_service import get_cloudinary_config
from fastapi import status
from app.core.config import settings
import cloudinary.utils

router = APIRouter(tags=["Cloudinary"])

@handle_endpoint_errors()
@router.get("/sign")
def sign_upload(
    folder: str = Query(default="lots"),
    current_user=Depends(require_roles(settings.READ_ONLY_ROLE_DENOMINATION))
):
    
    try:
        cloud_name, api_key, api_secret = get_cloudinary_config()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Timestamp must be included in the signature
    timestamp = int(time.time())

    # These params must match what the client sends to Cloudinary
    params_to_sign = {
        "timestamp": timestamp,
        "folder": folder,
        # Add more params here ONLY if your client will also send them
        # "overwrite": True,
        # "public_id": "some/path",
    }

    signature = cloudinary.utils.api_sign_request(params_to_sign, api_secret)

    return {
        "cloudName": cloud_name,
        "apiKey": api_key,
        "timestamp": timestamp,
        "signature": signature,
        "folder": folder,
    }