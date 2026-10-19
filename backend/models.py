from pydantic import BaseModel, Field


class PeliculaBase(BaseModel):
    titulo: str = Field(min_length=1, max_length=150)
    director: str = Field(min_length=1, max_length=100)
    genero: str
    anio: int = Field(ge=1888, le=2100)
    duracion_min: int = Field(gt=0, le=600)
    calificacion: float = Field(default=0, ge=0, le=10)
    vista: bool = False
    sinopsis: str | None = None


class PeliculaCreate(PeliculaBase):
    pass


class PeliculaUpdate(BaseModel):
    titulo: str | None = None
    director: str | None = None
    genero: str | None = None
    anio: int | None = None
    duracion_min: int | None = None
    calificacion: float | None = None
    vista: bool | None = None
    sinopsis: str | None = None


class Pelicula(PeliculaBase):
    id: int
