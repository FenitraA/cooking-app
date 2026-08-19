import uvicorn
from app.core.config import settings
import asyncio
from app.db.database import init_models,ENGINES

async def init_db_for_env():
    match settings.ENVIRONMENT:
        case "dev":
            print("Initializing DEV database...")
            await init_models(ENGINES["dev"])
        case "online_dev":
            print("Initializing STAGING database...")
            await init_models(ENGINES["online_dev"])
        case "online_prod":
            print("Skipping DB initialization on PROD")
        case _:
            raise RuntimeError(f"Unknown environment: {settings.ENVIRONMENT}")
        
if __name__ == "__main__":
    url = f"http://{settings.HOST}:{settings.PORT}"
    asyncio.run(init_db_for_env())
    
    # Open the default browser with the app's URL
    # webbrowser.open(url)
    
    # Run the FastAPI app
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT,reload=True)
