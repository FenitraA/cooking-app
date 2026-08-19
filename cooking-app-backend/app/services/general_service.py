from zoneinfo import ZoneInfo
from app.core.config import settings
import cloudinary

def format_currency(amount, symbol="Ar", decimal_places=2):
    formatted_amount = f"{amount:,.{decimal_places}f}"
    # formatted_amount = formatted_amount.replace(',', ' ')
    formatted_amount = f"{formatted_amount} {symbol}"
    return formatted_amount


def format_date(date, user_tz_name: str = "Africa/Nairobi"):
    user_tz = ZoneInfo(user_tz_name)
    utc_date = date
    local_date = utc_date.astimezone(user_tz)
    return local_date.strftime("%d-%m-%Y %H:%M:%S")

def get_cloudinary_config():
    cloud_name = settings.CLOUDINARY_CLOUD_NAME
    api_key = settings.CLOUDINARY_API_KEY
    api_secret = settings.CLOUDINARY_API_SECRET

    if not cloud_name or not api_key or not api_secret:
        raise RuntimeError("Cloudinary env vars are missing")

    return cloud_name, api_key, api_secret