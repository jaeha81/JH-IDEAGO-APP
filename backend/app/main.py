import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import auth, projects, agents, canvas, assets, ai, detail_view, export, events

app = FastAPI(
    title="IDEAGO API",
    description="Backend API for IDEAGO (MultiGenius) — visual ideation platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # specific origin required for credentials+cookies
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(agents.router, prefix="/api/v1/projects", tags=["agents"])
app.include_router(canvas.router, prefix="/api/v1/projects", tags=["canvas"])
app.include_router(assets.router, prefix="/api/v1/projects", tags=["assets"])
app.include_router(ai.router, prefix="/api/v1/projects", tags=["ai"])
app.include_router(detail_view.router, prefix="/api/v1/projects", tags=["detail-view"])
app.include_router(export.router, prefix="/api/v1/projects", tags=["export"])
app.include_router(events.router, prefix="/api/v1/projects", tags=["events"])


@app.exception_handler(Exception)
async def debug_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": str(exc), "type": type(exc).__name__, "trace": traceback.format_exc()})


@app.get("/health")
async def health():
    return {"status": "ok"}
