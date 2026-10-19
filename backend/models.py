import pydantic 

class PeliculaBase(pydantic.BaseModel):
    titulo: str
    año: int
    genero_id: int