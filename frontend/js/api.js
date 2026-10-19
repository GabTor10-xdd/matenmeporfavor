
const Api = (() => {
  const BASE_URL = "http://localhost:8000"; // cambiar acá si el backend corre en otro lugar


  class ApiError extends Error {
    constructor({ status, detail, esRed = false }) {
      super(ApiError.textoDe(detail, status, esRed));
      this.status = status;   // 0 si nunca hubo respuesta
      this.esRed = esRed;     // true si la API no respondió
      this.detail = detail;   // lo que devolvió el backend (string o lista de errores de Pydantic)
    }

    static textoDe(detail, status, esRed) {
      if (esRed) {
        return `No se pudo conectar con la API (${BASE_URL}). Verifica que el servidor esté corriendo.`;
      }
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) return detail.map((e) => e.msg).join(". ");
      return `Error inesperado del servidor (código ${status}).`;
    }

    

    erroresDeValidacion() {
      const resultado = { campos: {}, generales: [] };
      if (!Array.isArray(this.detail)) {
        resultado.generales.push(this.message);
        return resultado;
      }
      for (const error of this.detail) {
        const campo = error.loc.length > 1 ? String(error.loc[error.loc.length - 1]) : null;
        if (campo) {
          (resultado.campos[campo] ||= []).push(error.msg);
        } else {
          resultado.generales.push(error.msg);
        }
      }
      return resultado;
    }
  }

  async function request(ruta, { method = "GET", body } = {}) {
    const opciones = { method };
    if (body !== undefined) {
      // Este header solo se manda cuando hay body: en un GET evita un preflight CORS innecesario.
      opciones.headers = { "Content-Type": "application/json" };
      opciones.body = JSON.stringify(body);
    }

    let respuesta;
    try {
      respuesta = await fetch(BASE_URL + ruta, opciones);
    } catch {
      // fetch solo rechaza la promesa cuando no hay respuesta (servidor caído, sin red, CORS bloqueado)
      throw new ApiError({ status: 0, esRed: true });
    }

    if (respuesta.status === 204) return null; // sin contenido (DELETE exitoso)

    let datos = null;
    try {
      datos = await respuesta.json();
    } catch {
      /* la respuesta no era JSON */
    }

    if (!respuesta.ok) {
      throw new ApiError({ status: respuesta.status, detail: datos?.detail ?? respuesta.statusText });
    }
    return datos;
  }


  function queryString(filtros) {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== "" && valor !== null && valor !== undefined) params.append(clave, valor);
    }
    const texto = params.toString();
    return texto ? `?${texto}` : "";
  }

  return {
    ApiError,
    generos: () => request("/generos"),
    listar: (filtros = {}) => request(`/peliculas${queryString(filtros)}`),
    obtener: (id) => request(`/peliculas/${id}`),
    crear: (datos) => request("/peliculas", { method: "POST", body: datos }),
    actualizar: (id, datos) => request(`/peliculas/${id}`, { method: "PUT", body: datos }),
    eliminar: (id) => request(`/peliculas/${id}`, { method: "DELETE" }),
  };
})();
