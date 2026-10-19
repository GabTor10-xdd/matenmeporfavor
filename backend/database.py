import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "peliculas.db")

PELICULAS_EJEMPLO = [
    ("Nueve reinas", "Fabián Bielinsky", "Crimen", 2000, 114, 7.9, 1, "Dos estafadores se asocian por un día para vender una falsificación valiosa."),
    ("Pulp Fiction", "Quentin Tarantino", "Crimen", 1994, 154, 8.9, 1, "Historias cruzadas de delincuentes en Los Ángeles, contadas fuera de orden."),
    ("Mad Max: Furia en el camino", "George Miller", "Acción", 2015, 120, 8.1, 0, "Una huida desesperada por un desierto post-apocalíptico."),
    ("Toy Story", "John Lasseter", "Animación", 1995, 81, 8.3, 1, "Los juguetes de un niño cobran vida cuando no hay nadie mirando."),
    ("Indiana Jones y la última cruzada", "Steven Spielberg", "Aventura", 1989, 127, 8.2, 1, "Un arqueólogo busca a su padre y el Santo Grial."),
    ("Zombieland", "Ruben Fleischer", "Comedia", 2009, 88, 7.6, 0, "Un grupo de sobrevivientes intenta llegar a un parque de diversiones."),
    ("El padre", "Florian Zeller", "Drama", 2020, 97, 7.9, 1, "Un hombre mayor enfrenta la pérdida de su memoria."),
    ("El laberinto del fauno", "Guillermo del Toro", "Fantasía", 2006, 118, 8.2, 1, "Una niña descubre un mundo mágico en la España de posguerra."),
    ("Orgullo y prejuicio", "Joe Wright", "Romance", 2005, 129, 7.8, 0, "El choque entre Elizabeth Bennet y el señor Darcy."),
    ("Hereditary", "Ari Aster", "Terror", 2018, 127, 7.3, 0, "Una familia descubre secretos oscuros tras la muerte de la abuela."),
    ("Interstellar", "Christopher Nolan", "Ciencia ficción", 2014, 169, 8.6, 1, "Un grupo de astronautas busca un nuevo hogar para la humanidad."),
    ("Spider-Man: Un nuevo universo", "Bob Persichetti", "Animación", 2018, 117, 8.4, 1, "Miles Morales descubre que no es el único Spider-Man."),
]


def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS peliculas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            director TEXT NOT NULL,
            genero TEXT NOT NULL,
            anio INTEGER NOT NULL,
            duracion_min INTEGER NOT NULL,
            calificacion REAL NOT NULL DEFAULT 0,
            vista INTEGER NOT NULL DEFAULT 0,
            sinopsis TEXT
        )
    """)
    cantidad = conn.execute("SELECT COUNT(*) FROM peliculas").fetchone()[0]
    if cantidad == 0:
        conn.executemany(
            """INSERT INTO peliculas
               (titulo, director, genero, anio, duracion_min, calificacion, vista, sinopsis)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            PELICULAS_EJEMPLO,
        )
    conn.commit()
    conn.close()
