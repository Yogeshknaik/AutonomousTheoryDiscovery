import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database.database import engine, Base
from app.api import (
    auth,
    projects,
    documents,
    knowledge,
    hypotheses,
    theories,
    experiments,
    validation,
    memory,
    discovery,
    reports
)

# Initialize Database tables
Base.metadata.create_all(bind=engine)

with engine.begin() as _conn:
    _conn.exec_driver_sql("UPDATE research_projects SET status = 'failed' WHERE status = 'running'")

app = FastAPI(
    title="Autonomous Theory Discovery API",
    description="Backend service for Autonomous Theory Discovery using Foundation Models (Closed-loop AI Pipeline)",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(documents.router)
app.include_router(knowledge.router)
app.include_router(hypotheses.router)
app.include_router(theories.router)
app.include_router(experiments.router)
app.include_router(validation.router)
app.include_router(memory.router)
app.include_router(discovery.router)
app.include_router(reports.router)

# Mount Static Frontend Files
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            return {"error": "API route not found"}
        file_p = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_p) and os.path.isfile(file_p):
            return FileResponse(file_p)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {
            "status": "online",
            "system": "Autonomous Theory Discovery System",
            "version": "1.0.0",
            "docs": "/docs"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
