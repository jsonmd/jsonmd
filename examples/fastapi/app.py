from fastapi import FastAPI
from jsonmd import enable

app = FastAPI()
enable(app)


@app.get("/api/users")
async def get_users():
    return [
        {"id": 1, "name": "Alice", "role": "admin"},
        {"id": 2, "name": "Bob", "role": "editor"},
    ]


@app.get("/api/config")
async def get_config():
    return {"theme": "dark", "lang": "en", "notifications": True}
