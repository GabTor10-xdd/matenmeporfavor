const UI = (() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    btnNueva: $("btn-nueva"),
    formFiltros: $("form-filtros"),
    btnLimpiar: $("btn-limpiar"),
    filtroGenero: $("f-genero"),
    banner: $("banner-error"),
    bannerTexto: $("banner-error-texto"),
    btnReintentar: $("btn-reintentar"),
    resumenTitulo: $("resumen-titulo"),
    resumenFiltros: $("resumen-filtros"),
    cargando: $("cargando"),
    lista: $("lista"),
    vacio: $("vacio"),
    dlgPelicula: $("dlg-pelicula"),
    dlgPeliculaTitulo: $("dlg-pelicula-titulo"),
    formPelicula: $("form-pelicula"),
    formGenero: $("p-genero"),
    formErrorGeneral: $("form-error-general"),
    btnCancelarForm: $("btn-cancelar-form"),
    btnGuardar: $("btn-guardar"),
    dlgEliminar: $("dlg-eliminar"),
    dlgEliminarTitulo: $("dlg-eliminar-titulo"),
    aviso: $("aviso"),
  };

  function crear(etiqueta, clase, texto) {
    const nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  }

  /* ---------- Filtros ---------- */

  function poblarGeneros(generos) {
    for (const select of [els.filtroGenero, els.formGenero]) {
      for (const g of generos) select.append(new Option(g, g));
    }
  }

  function leerFiltros() {
    const f = els.formFiltros.elements;
    return {
      q: f.q.value.trim(),
      genero: f.genero.value,
      anio_min: f.anio_min.value,
      anio_max: f.anio_max.value,
      calificacion_min: f.calificacion_min.value,
      vista: f.vista.value,
    };
  }

  function limpiarFiltros() {
    els.formFiltros.reset();
  }

  function describirFiltros(filtros) {
    const partes = [];
    if (filtros.q) partes.push(`título o director con «${filtros.q}»`);
    if (filtros.genero) partes.push(`género ${filtros.genero}`);
    if (filtros.anio_min) partes.push(`desde ${filtros.anio_min}`);
    if (filtros.anio_max) partes.push(`hasta ${filtros.anio_max}`);
    if (filtros.calificacion_min) partes.push(`calificación de ${filtros.calificacion_min} o más`);
    if (filtros.vista === "true") partes.push("solo vistas");
    if (filtros.vista === "false") partes.push("solo pendientes");
    return partes.length ? `Filtros aplicados: ${partes.join(", ")}.` : "Sin filtros aplicados.";
  }

  /* ---------- Estados de la lista ---------- */

  function mostrarCargando(activo) {
    els.cargando.hidden = !activo;
    els.lista.setAttribute("aria-busy", String(activo));
    els.formFiltros.querySelector('button[type="submit"]').disabled = activo;
  }

  function mostrarBanner(mensaje) {
    els.bannerTexto.textContent = mensaje;
    els.banner.hidden = false;
  }

  function ocultarBanner() {
    els.banner.hidden = true;
  }

  function crearTicket(p) {
    const item = crear("li", "ticket");
    item.dataset.id = p.id;
    item.dataset.titulo = p.titulo;

    const talon = crear("div", "ticket__talon");
    talon.append(crear("span", "ticket__nota", p.calificacion.toFixed(1)), crear("span", "ticket__sobre", "de 10"));

    const cuerpo = crear("div", "ticket__cuerpo");
    cuerpo.append(
      crear("h3", "ticket__titulo", p.titulo),
      crear("p", "ticket__meta", `${p.director}, ${p.anio}, ${p.duracion_min} min`)
    );
    if (p.sinopsis) cuerpo.append(crear("p", "ticket__sinopsis", p.sinopsis));

    const pie = crear("div", "ticket__pie");
    const etiquetas = crear("div", "ticket__etiquetas");
    etiquetas.append(
      crear("span", "etiqueta", p.genero),
      crear("span", p.vista ? "estado estado--vista" : "estado estado--pendiente", p.vista ? "Vista" : "Pendiente")
    );

    const acciones = crear("div", "ticket__acciones");
    const editar = crear("button", "btn btn--chico", "Editar");
    editar.type = "button";
    editar.dataset.action = "editar";
    editar.dataset.id = p.id;
    editar.setAttribute("aria-label", `Editar ${p.titulo}`);
    const eliminar = crear("button", "btn btn--chico btn--borde-peligro", "Eliminar");
    eliminar.type = "button";
    eliminar.dataset.action = "eliminar";
    eliminar.dataset.id = p.id;
    eliminar.setAttribute("aria-label", `Eliminar ${p.titulo}`);
    acciones.append(editar, eliminar);

    pie.append(etiquetas, acciones);
    cuerpo.append(pie);
    item.append(talon, cuerpo);
    return item;
  }

  function renderLista(peliculas, filtros) {
    els.lista.replaceChildren(...peliculas.map(crearTicket));

    const n = peliculas.length;
    els.resumenTitulo.textContent = n === 1 ? "1 película" : `${n} películas`;
    els.resumenFiltros.textContent = describirFiltros(filtros);

    const hayFiltros = Object.values(filtros).some((v) => v !== "");
    els.vacio.hidden = n > 0;
    els.vacio.textContent = hayFiltros
      ? "Ninguna película coincide con estos filtros. Prueba con otros valores o limpia los filtros."
      : "Todavía no hay películas. Usa «Agregar película» para cargar la primera.";
  }

  function vaciarLista() {
    els.lista.replaceChildren();
    els.vacio.hidden = true;
    els.resumenTitulo.textContent = "Películas";
    els.resumenFiltros.textContent = "";
  }

  /* ---------- Formulario de película ---------- */

  function limpiarErroresFormulario() {
    els.formErrorGeneral.hidden = true;
    els.formErrorGeneral.textContent = "";
    for (const p of els.formPelicula.querySelectorAll("[data-error-de]")) p.textContent = "";
    for (const campo of els.formPelicula.elements) campo.removeAttribute?.("aria-invalid");
  }

  function abrirFormulario(pelicula = null) {
    const f = els.formPelicula.elements;
    limpiarErroresFormulario();
    els.formPelicula.reset();
    if (pelicula) {
      els.dlgPeliculaTitulo.textContent = "Editar película";
      els.btnGuardar.textContent = "Guardar cambios";
      f.titulo.value = pelicula.titulo;
      f.director.value = pelicula.director;
      f.genero.value = pelicula.genero;
      f.anio.value = pelicula.anio;
      f.duracion_min.value = pelicula.duracion_min;
      f.calificacion.value = pelicula.calificacion;
      f.vista.checked = pelicula.vista;
      f.sinopsis.value = pelicula.sinopsis ?? "";
    } else {
      els.dlgPeliculaTitulo.textContent = "Nueva película";
      els.btnGuardar.textContent = "Guardar película";
      f.calificacion.value = 0;
    }
    els.dlgPelicula.showModal();
    f.titulo.focus();
  }
 
  function cerrarFormulario() {
    els.dlgPelicula.close();
  }

  const aNumero = (texto) => (texto.trim() === "" ? null : Number(texto));

  function leerFormulario() {
    const f = els.formPelicula.elements;
    return {
      titulo: f.titulo.value,
      director: f.director.value,
      genero: f.genero.value,
      anio: aNumero(f.anio.value),
      duracion_min: aNumero(f.duracion_min.value),
      calificacion: aNumero(f.calificacion.value),
      vista: f.vista.checked,
      sinopsis: f.sinopsis.value,
    };
  }

  function mostrarErroresFormulario({ campos, generales }) {
    limpiarErroresFormulario();
    for (const [nombre, mensajes] of Object.entries(campos)) {
      const contenedor = els.formPelicula.querySelector(`[data-error-de="${nombre}"]`);
      if (contenedor) {
        contenedor.textContent = mensajes.join(". ");
        els.formPelicula.elements[nombre]?.setAttribute("aria-invalid", "true");
      } else {
        generales.push(`${nombre}: ${mensajes.join(". ")}`);
      }
    }
    if (generales.length) {
      els.formErrorGeneral.textContent = generales.join(" ");
      els.formErrorGeneral.hidden = false;
    }
    const primerInvalido = els.formPelicula.querySelector('[aria-invalid="true"]');
    primerInvalido?.focus();
  }

  function setGuardando(guardando) {
    els.btnGuardar.disabled = guardando;
    if (guardando) {
      els.btnGuardar.dataset.texto = els.btnGuardar.textContent;
      els.btnGuardar.textContent = "Guardando…";
    } else if (els.btnGuardar.dataset.texto) {
      els.btnGuardar.textContent = els.btnGuardar.dataset.texto;
    }
  }

  /* ---------- Confirmación y avisos ---------- */

  function confirmarEliminacion(titulo) {
    els.dlgEliminarTitulo.textContent = `¿Eliminar «${titulo}»?`;
    return new Promise((resolve) => {
      els.dlgEliminar.returnValue = "";
      els.dlgEliminar.addEventListener("close", () => resolve(els.dlgEliminar.returnValue === "ok"), { once: true });
      els.dlgEliminar.showModal();
    });
  }

  let temporizadorAviso;
  function mostrarAviso(texto) {
    els.aviso.textContent = texto;
    els.aviso.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => (els.aviso.hidden = true), 3500);
  }

  return {
    els,
    poblarGeneros,
    leerFiltros,
    limpiarFiltros,
    mostrarCargando,
    mostrarBanner,
    ocultarBanner,
    renderLista,
    vaciarLista,
    abrirFormulario,
    cerrarFormulario,
    leerFormulario,
    mostrarErroresFormulario,
    limpiarErroresFormulario,
    setGuardando,
    confirmarEliminacion,
    mostrarAviso,
  };
})();
