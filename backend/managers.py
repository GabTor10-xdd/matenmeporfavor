import sqlite3

from models import Pelicula, PeliculaCreate, PeliculaUpdate


def _escapar_like(texto: str) -> str:
    return texto.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class PeliculaManager:
    _COLUMNAS = (
        "titulo", "director", "genero", "anio",
        "duracion_min", "calificacion", "vista", "sinopsis",
    )

    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn   

    @staticmethod
    def _a_modelo(fila: sqlite3.Row) -> Pelicula:
        datos = dict(fila)
        datos["vista"] = bool(datos["vista"])   
        return Pelicula(**datos)

    def get_all(
        self,
        q: str | None = None,
        genero: str | None = None,
        anio_min: int | None = None,
        anio_max: int | None = None,
        calificacion_min: float | None = None,
        vista: bool | None = None,
    ) -> list[Pelicula]:
        condiciones: list[str] = []
        parametros: list = []   

        if q:
            patron = f"%{_escapar_like(q)}%"
            condiciones.append("(titulo LIKE ? ESCAPE '\\' OR director LIKE ? ESCAPE '\\')")
            parametros += [patron, patron]
        if genero:
            condiciones.append("genero = ?")
            parametros.append(genero)
        if anio_min is not None:
            condiciones.append("anio >= ?")
            parametros.append(anio_min)
        if anio_max is not None:
            condiciones.append("anio <= ?")
            parametros.append(anio_max)
        if calificacion_min is not None:
            condiciones.append("calificacion >= ?")
            parametros.append(calificacion_min)
        if vista is not None:
            condiciones.append("vista = ?")
            parametros.append(int(vista))

        sql = "SELECT * FROM peliculas"
        if condiciones:
            sql += " WHERE " + " AND ".join(condiciones)
        sql += " ORDER BY titulo COLLATE NOCASE"

        filas = self._conn.execute(sql, parametros).fetchall()
        return [self._a_modelo(f) for f in filas]

    def get_by_id(self, id: int) -> Pelicula | None:
        fila = self._conn.execute("SELECT * FROM peliculas WHERE id = ?", (id,)).fetchone()
        return self._a_modelo(fila) if fila else None

    def create(self, data: PeliculaCreate) -> Pelicula:
        valores = data.model_dump()
        columnas = ", ".join(self._COLUMNAS)
        marcadores = ", ".join("?" for _ in self._COLUMNAS)
        cursor = self._conn.execute(
            f"INSERT INTO peliculas ({columnas}) VALUES ({marcadores})",
            [valores[c] for c in self._COLUMNAS],
        )
        self._conn.commit()
        return self.get_by_id(cursor.lastrowid)

    def update(self, id: int, data: PeliculaUpdate) -> Pelicula | None:
        actual = self.get_by_id(id)
        if actual is None:
            return None

        
        cambios = data.model_dump(exclude_unset=True)
        if not cambios:
            return actual

         
        columnas = [c for c in cambios if c in self._COLUMNAS]
        asignaciones = ", ".join(f"{c} = ?" for c in columnas)
        self._conn.execute(
            f"UPDATE peliculas SET {asignaciones} WHERE id = ?",
            [cambios[c] for c in columnas] + [id],
        )
        self._conn.commit()
        return self.get_by_id(id)

    def delete(self, id: int) -> bool:
        cursor = self._conn.execute("DELETE FROM peliculas WHERE id = ?", (id,))
        self._conn.commit()
        return cursor.rowcount > 0
