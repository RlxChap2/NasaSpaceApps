from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import analytics, astronauts, health, osdr, thresholds, vitals
from app.seed import auto_seed_if_empty


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    auto_seed_if_empty()
    yield


app = FastAPI(title="Astronaut Health Monitoring API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(astronauts.router)
app.include_router(vitals.router)
app.include_router(thresholds.router)
app.include_router(analytics.router)
app.include_router(osdr.router)
