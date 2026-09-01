from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import admin, auth, courses, parents, public, sessions, students
from .seed import init_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Kinz Teacher Platform API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(parents.router, prefix="/api")
app.include_router(public.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
