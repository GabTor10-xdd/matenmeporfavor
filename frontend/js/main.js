(() => {
  let filtrosActuales = UI.leerFiltros(); 
  let idEnEdicion = null;                 
  let generosCargados = false;

  async function cargarGeneros() {
    if (generosCargados) return;
    try {
      UI.poblarGeneros(await Api.generos());
      generosCargados = true;
    } catch {
    }
  }

  async function cargarPeliculas() {
    UI.ocultarBanner();
    UI.mostrarCargando(true);
    try {
      await cargarGeneros();
      UI.renderLista(await Api.listar(filtrosActuales), filtrosActuales);
    } catch (error) {
      UI.vaciarLista();
      UI.mostrarBanner(error.message);
    } finally {
      UI.mostrarCargando(false);
    }
  }

  /* ---------- Filtros ---------- */

  UI.els.formFiltros.addEventListener("submit", (evento) => {
    evento.preventDefault();
    filtrosActuales = UI.leerFiltros();
    cargarPeliculas();
  });

  UI.els.btnLimpiar.addEventListener("click", () => {
    UI.limpiarFiltros();
    filtrosActuales = UI.leerFiltros();
    cargarPeliculas();
  });

  UI.els.btnReintentar.addEventListener("click", cargarPeliculas);

  /* ---------- Crear y editar ---------- */

  UI.els.btnNueva.addEventListener("click", () => {
    idEnEdicion = null;
    UI.abrirFormulario();
  });

  UI.els.btnCancelarForm.addEventListener("click", UI.cerrarFormulario);

  UI.els.formPelicula.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const datos = UI.leerFormulario();
    const editando = idEnEdicion !== null;

    UI.limpiarErroresFormulario();
    UI.setGuardando(true);
    try {
      if (editando) {
        await Api.actualizar(idEnEdicion, datos);
      } else {
        await Api.crear(datos);
      }
      UI.cerrarFormulario();
      UI.mostrarAviso(editando ? "Cambios guardados" : "Película guardada");
      await cargarPeliculas();
    } catch (error) {
      if (error.status === 422) {
        UI.mostrarErroresFormulario(error.erroresDeValidacion());
      } else if (error.status === 404) {
        UI.mostrarErroresFormulario({ campos: {}, generales: ["Esta película ya no existe. Cierra el formulario y actualiza la lista."] });
      } else {
        UI.mostrarErroresFormulario({ campos: {}, generales: [error.message] });
      }
    } finally {
      UI.setGuardando(false);
    }
  });

  async function iniciarEdicion(id) {
    try {
      const pelicula = await Api.obtener(id);
      idEnEdicion = id;
      UI.abrirFormulario(pelicula);
    } catch (error) {
      if (error.status === 404) await cargarPeliculas(); // la lista estaba desactualizada
      UI.mostrarBanner(error.message);
    }
  }

  /* ---------- Eliminar ---------- */

  async function iniciarEliminacion(id, titulo) {
    if (!(await UI.confirmarEliminacion(titulo))) return;
    try {
      await Api.eliminar(id);
      UI.mostrarAviso("Película eliminada");
      await cargarPeliculas();
    } catch (error) {
      if (error.status === 404) await cargarPeliculas(); // ya estaba borrada: solo refrescamos
      UI.mostrarBanner(error.message);
    }
  }

  /* ---------- Botones de cada tarjeta (delegación de eventos) ---------- */

  UI.els.lista.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-action]");
    if (!boton) return;
    const id = Number(boton.dataset.id);
    if (boton.dataset.action === "editar") iniciarEdicion(id);
    if (boton.dataset.action === "eliminar") iniciarEliminacion(id, boton.closest("li").dataset.titulo);
  });

  cargarPeliculas();
})();
