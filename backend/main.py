import sqlite3
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware

from database import get_db, init_db
from managers import PeliculaManager
from models import GENEROS, Genero, Pelicula, PeliculaCreate, PeliculaUpdate


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()  
    yield


app = FastAPI(
    title="Cartelera de películas",
    description="API REST para administrar un catálogo personal de películas.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en producción: el origen específico del frontend
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_manager(db: sqlite3.Connection = Depends(get_db)) -> PeliculaManager:
    return PeliculaManager(db)


def _pelicula_o_404(pelicula: Pelicula | None, id: int) -> Pelicula:
    if pelicula is None:
        raise HTTPException(status_code=404, detail=f"No existe la película con id {id}")
    return pelicula


@app.get("/generos", response_model=list[str])
def listar_generos():
    return GENEROS


@app.get("/peliculas", response_model=list[Pelicula])
def listar_peliculas(
    q: str | None = Query(None, max_length=100, description="Texto contenido en título o director"),
    genero: Genero | None = Query(None, description="Género exacto"),
    anio_min: int | None = Query(None, ge=1888, description="Año de estreno desde"),
    anio_max: int | None = Query(None, ge=1888, description="Año de estreno hasta"),
    calificacion_min: float | None = Query(None, ge=0, le=10, description="Calificación mínima"),
    vista: bool | None = Query(None, description="true = vistas, false = pendientes"),
    manager: PeliculaManager = Depends(get_manager),
):
    return manager.get_all(
        q=q, genero=genero, anio_min=anio_min, anio_max=anio_max,
        calificacion_min=calificacion_min, vista=vista,
    )


@app.get("/peliculas/{id}", response_model=Pelicula)
def obtener_pelicula(id: int, manager: PeliculaManager = Depends(get_manager)):
    return _pelicula_o_404(manager.get_by_id(id), id)


@app.post("/peliculas", response_model=Pelicula, status_code=201)
def crear_pelicula(data: PeliculaCreate, manager: PeliculaManager = Depends(get_manager)):
    return manager.create(data)  # si el body es inválido, FastAPI responde 422 antes de llegar acá


@app.put("/peliculas/{id}", response_model=Pelicula)
def actualizar_pelicula(
    id: int, data: PeliculaUpdate, manager: PeliculaManager = Depends(get_manager)
):
    return _pelicula_o_404(manager.update(id, data), id)


@app.delete("/peliculas/{id}", status_code=204)
def eliminar_pelicula(id: int, manager: PeliculaManager = Depends(get_manager)):
    if not manager.delete(id):
        raise HTTPException(status_code=404, detail=f"No existe la película con id {id}")
    return Response(status_code=204)
