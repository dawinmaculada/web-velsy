/*
 * Velsy · Encuentra tu servicio
 * search.js — lógica del buscador y listado de resultados (/encuentra-tu-servicio/).
 * Vanilla JS, sin dependencias. Todos los datos proceden de /data/*.json.
 */
(function () {
  'use strict';

  var V = window.Velsy;

  var els = {
    form: document.getElementById('search-form'),
    qTratamiento: document.getElementById('q-tratamiento'),
    qUbicacion: document.getElementById('q-ubicacion'),
    autocompleteList: document.getElementById('autocomplete-list'),
    btnGeoloc: document.getElementById('btn-geoloc'),
    geolocMsg: document.getElementById('geoloc-msg'),
    destacadosSection: document.getElementById('destacados-section'),
    destacadosGrid: document.getElementById('destacados-grid'),
    resultsTitle: document.getElementById('results-title'),
    resultsControls: document.getElementById('results-controls'),
    btnFiltros: document.getElementById('btn-filtros'),
    filtrosPanel: document.getElementById('filtros-panel'),
    ordenSelect: document.getElementById('orden-select'),
    fTratamiento: document.getElementById('f-tratamiento'),
    fCiudad: document.getElementById('f-ciudad'),
    fCp: document.getElementById('f-cp'),
    fPrecio: document.getElementById('f-precio'),
    fValoracion: document.getElementById('f-valoracion'),
    fDisponibilidad: document.getElementById('f-disponibilidad'),
    btnLimpiarFiltros: document.getElementById('btn-limpiar-filtros'),
    stateInitial: document.getElementById('state-initial'),
    stateEmpty: document.getElementById('state-empty'),
    stateError: document.getElementById('state-error'),
    resultsGrid: document.getElementById('results-grid'),
    categoriaChips: document.getElementById('categoria-chips')
  };

  var DATA = { categorias: [], tratamientos: [], profesionales: [] };
  var tratamientosBySlug = {};
  var categoriasBySlug = {};

  var state = {
    tratamiento: '',
    ciudad: '',
    cp: '',
    categoria: '',
    precioMax: '',
    valoracionMin: '',
    soloDisponibilidad: false,
    orden: 'relevancia',
    userCoords: null
  };
  var hasSearched = false;

  // ── Carga de datos ───────────────────────────────────────────────────
  Promise.all([
    V.fetchJSON('data/categorias.json'),
    V.fetchJSON('data/tratamientos.json'),
    V.fetchJSON('data/profesionales.json')
  ]).then(function (results) {
    DATA.categorias = results[0];
    DATA.tratamientos = results[1];
    DATA.profesionales = results[2];
    DATA.categorias.forEach(function (c) { categoriasBySlug[c.slug] = c; });
    DATA.tratamientos.forEach(function (t) { tratamientosBySlug[t.slug] = t; });

    buildCategoriaChips();
    buildTratamientoFilterOptions();
    applyStateFromURL();
    renderDestacados();
    runSearch({ fromInit: true });
  }).catch(function () {
    show(els.stateError);
  });

  function buildCategoriaChips() {
    els.categoriaChips.innerHTML = '';
    DATA.categorias.forEach(function (c) {
      var chip = V.h('button', {
        type: 'button', class: 'categoria-chip',
        onclick: function () {
          state.categoria = c.slug;
          hasSearched = true;
          syncURL();
          runSearch();
          V.track('filter_service', { categoria: c.slug });
        }
      }, [c.icono + ' ' + c.nombre]);
      els.categoriaChips.appendChild(chip);
    });
  }

  function buildTratamientoFilterOptions() {
    DATA.tratamientos.forEach(function (t) {
      var opt = document.createElement('option');
      opt.value = t.slug;
      opt.textContent = t.nombre;
      els.fTratamiento.appendChild(opt);
    });
  }

  // ── URL <-> estado ───────────────────────────────────────────────────
  function applyStateFromURL() {
    var params = new URLSearchParams(window.location.search);
    state.tratamiento = params.get('tratamiento') || '';
    state.ciudad = params.get('ciudad') || '';
    state.cp = params.get('cp') || '';
    state.categoria = params.get('categoria') || '';
    state.precioMax = params.get('precioMax') || '';
    state.valoracionMin = params.get('valoracion') || '';
    state.soloDisponibilidad = params.get('disponibilidad') === '1';
    state.orden = params.get('orden') || 'relevancia';

    if (state.tratamiento) els.qTratamiento.value = state.tratamiento;
    if (state.ciudad) els.qUbicacion.value = state.ciudad;
    else if (state.cp) els.qUbicacion.value = state.cp;
    els.fTratamiento.value = tratamientosBySlug[state.tratamiento] ? state.tratamiento : '';
    els.fCiudad.value = state.ciudad;
    els.fCp.value = state.cp;
    els.fPrecio.value = state.precioMax;
    els.fValoracion.value = state.valoracionMin;
    els.fDisponibilidad.checked = state.soloDisponibilidad;
    els.ordenSelect.value = state.orden;

    hasSearched = !!(state.tratamiento || state.ciudad || state.cp || state.categoria ||
      state.precioMax || state.valoracionMin || state.soloDisponibilidad);
  }

  function syncURL() {
    var params = new URLSearchParams();
    if (state.tratamiento) params.set('tratamiento', state.tratamiento);
    if (state.ciudad) params.set('ciudad', state.ciudad);
    if (state.cp) params.set('cp', state.cp);
    if (state.categoria) params.set('categoria', state.categoria);
    if (state.precioMax) params.set('precioMax', state.precioMax);
    if (state.valoracionMin) params.set('valoracion', state.valoracionMin);
    if (state.soloDisponibilidad) params.set('disponibilidad', '1');
    if (state.orden && state.orden !== 'relevancia') params.set('orden', state.orden);
    var qs = params.toString();
    var newUrl = window.location.pathname + (qs ? '?' + qs : '');
    window.history.replaceState(null, '', newUrl);
  }

  // ── Autocompletado de tratamientos ──────────────────────────────────
  var acIndex = -1;
  els.qTratamiento.addEventListener('input', function () {
    var value = els.qTratamiento.value;
    if (V.normalize(value).length < 2) { closeAutocomplete(); return; }
    var matches = DATA.tratamientos.filter(function (t) {
      return V.textIncludes(t.nombre, value);
    }).slice(0, 8);
    renderAutocomplete(matches);
  });
  els.qTratamiento.addEventListener('keydown', function (e) {
    var items = els.autocompleteList.querySelectorAll('li');
    if (!items.length || els.autocompleteList.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); acIndex = Math.min(acIndex + 1, items.length - 1); highlightAutocomplete(items); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); acIndex = Math.max(acIndex - 1, 0); highlightAutocomplete(items); }
    else if (e.key === 'Enter' && acIndex >= 0) { e.preventDefault(); items[acIndex].dispatchEvent(new Event('velsy:pick')); }
    else if (e.key === 'Escape') { closeAutocomplete(); }
  });
  document.addEventListener('click', function (e) {
    if (!els.autocompleteList.contains(e.target) && e.target !== els.qTratamiento) closeAutocomplete();
  });

  function renderAutocomplete(matches) {
    els.autocompleteList.innerHTML = '';
    acIndex = -1;
    if (!matches.length) { closeAutocomplete(); return; }
    matches.forEach(function (t) {
      var li = V.h('li', { role: 'option', text: t.nombre });
      li.addEventListener('mousedown', function (e) { e.preventDefault(); selectTratamiento(t); });
      li.addEventListener('velsy:pick', function () { selectTratamiento(t); });
      els.autocompleteList.appendChild(li);
    });
    els.autocompleteList.hidden = false;
    els.qTratamiento.setAttribute('aria-expanded', 'true');
  }

  function highlightAutocomplete(items) {
    items.forEach(function (li, i) { li.setAttribute('aria-selected', i === acIndex ? 'true' : 'false'); });
    if (items[acIndex]) items[acIndex].scrollIntoView({ block: 'nearest' });
  }

  function closeAutocomplete() {
    els.autocompleteList.hidden = true;
    els.autocompleteList.innerHTML = '';
    els.qTratamiento.setAttribute('aria-expanded', 'false');
  }

  function selectTratamiento(t) {
    els.qTratamiento.value = t.nombre;
    closeAutocomplete();
    els.form.requestSubmit ? els.form.requestSubmit() : els.form.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  // ── Geolocalización (solo al pulsar el botón) ───────────────────────
  els.btnGeoloc.addEventListener('click', function () {
    setGeolocMsg('Buscando tu ubicación…', '');
    V.getUserLocation().then(function (coords) {
      state.userCoords = coords;
      setGeolocMsg('Ubicación detectada. Ya puedes ordenar los resultados por cercanía.', 'is-ok');
      V.track('use_location', {});
      if (hasSearched) runSearch();
    }).catch(function (msg) {
      setGeolocMsg(msg, 'is-error');
    });
  });

  function setGeolocMsg(text, cls) {
    els.geolocMsg.hidden = false;
    els.geolocMsg.textContent = text;
    els.geolocMsg.className = 'geoloc-msg' + (cls ? ' ' + cls : '');
  }

  // ── Formulario principal ─────────────────────────────────────────────
  els.form.addEventListener('submit', function (e) {
    e.preventDefault();
    state.tratamiento = els.qTratamiento.value.trim();
    var ubic = els.qUbicacion.value.trim();
    if (/^\d{4,5}$/.test(ubic)) { state.cp = ubic; state.ciudad = ''; }
    else { state.ciudad = ubic; state.cp = ''; }
    els.fCiudad.value = state.ciudad;
    els.fCp.value = state.cp;
    hasSearched = true;
    syncURL();
    runSearch();
    V.track('search_service', { tratamiento: state.tratamiento, ciudad: state.ciudad, cp: state.cp });
  });

  // ── Panel de filtros ─────────────────────────────────────────────────
  els.btnFiltros.addEventListener('click', function () {
    var open = els.filtrosPanel.hidden;
    els.filtrosPanel.hidden = !open;
    els.btnFiltros.setAttribute('aria-expanded', String(open));
  });

  [els.fTratamiento, els.fCiudad, els.fCp, els.fPrecio, els.fValoracion, els.fDisponibilidad].forEach(function (el) {
    el.addEventListener('change', function () {
      if (el === els.fTratamiento) { state.tratamiento = el.value ? tratamientosBySlug[el.value].nombre : ''; els.qTratamiento.value = state.tratamiento; }
      if (el === els.fCiudad) state.ciudad = el.value.trim();
      if (el === els.fCp) state.cp = el.value.trim();
      if (el === els.fPrecio) state.precioMax = el.value;
      if (el === els.fValoracion) state.valoracionMin = el.value;
      if (el === els.fDisponibilidad) state.soloDisponibilidad = el.checked;
      hasSearched = true;
      syncURL();
      runSearch();
      V.track('filter_service', { field: el.id, value: el.value !== undefined ? el.value : el.checked });
    });
  });

  els.btnLimpiarFiltros.addEventListener('click', function () {
    state.tratamiento = ''; state.ciudad = ''; state.cp = ''; state.categoria = '';
    state.precioMax = ''; state.valoracionMin = ''; state.soloDisponibilidad = false;
    els.qTratamiento.value = ''; els.qUbicacion.value = '';
    els.fTratamiento.value = ''; els.fCiudad.value = ''; els.fCp.value = '';
    els.fPrecio.value = ''; els.fValoracion.value = ''; els.fDisponibilidad.checked = false;
    syncURL();
    runSearch();
  });

  els.ordenSelect.addEventListener('change', function () {
    if (els.ordenSelect.value === 'cercania' && !state.userCoords) {
      setGeolocMsg('Pulsa "Usar mi ubicación" para poder ordenar por cercanía.', 'is-error');
      els.ordenSelect.value = state.orden;
      return;
    }
    state.orden = els.ordenSelect.value;
    syncURL();
    runSearch();
  });

  // ── Búsqueda y filtrado ──────────────────────────────────────────────
  function cheapestServicio(p) {
    var candidatos = p.servicios;
    if (state.tratamiento) {
      var filtrados = candidatos.filter(function (s) {
        var t = tratamientosBySlug[s.tratamientoSlug];
        return V.textIncludes(s.nombre, state.tratamiento) || (t && V.textIncludes(t.nombre, state.tratamiento));
      });
      if (filtrados.length) candidatos = filtrados;
    }
    if (!candidatos.length) return null;
    // Si ninguno de los servicios tiene precio publicado, se devuelve el primero (para
    // mostrar nombre/descripción) pero NUNCA se trata como "precio 0" en filtros/orden.
    var conPrecio = candidatos.filter(function (s) { return typeof s.precioDesde === 'number'; });
    if (conPrecio.length) {
      return conPrecio.reduce(function (min, s) { return s.precioDesde < min.precioDesde ? s : min; });
    }
    return candidatos[0];
  }

  function precioNumerico(servicio) {
    return (servicio && typeof servicio.precioDesde === 'number') ? servicio.precioDesde : null;
  }

  function matchesFilters(p) {
    if (!p.activo) return false;
    if (state.categoria && p.categoriaSlug !== state.categoria) return false;
    if (state.ciudad && !V.textIncludes(p.ciudad, state.ciudad) && !V.textIncludes(p.provincia, state.ciudad)) return false;
    if (state.cp && V.normalize(p.codigoPostal).indexOf(V.normalize(state.cp)) !== 0) return false;
    if (state.valoracionMin && (!p.valoracion || !p.valoracion.numOpiniones || p.valoracion.media < parseFloat(state.valoracionMin))) return false;
    if (state.soloDisponibilidad && !(p.reserva && p.reserva.habilitada)) return false;
    if (state.precioMax) {
      var precioConocido = precioNumerico(cheapestServicio(p));
      // Sin precio publicado no se puede confirmar que entre en el presupuesto: se excluye.
      if (precioConocido === null || precioConocido > parseFloat(state.precioMax)) return false;
    }
    if (state.tratamiento) {
      var q = state.tratamiento;
      var matchTrat = p.tratamientos.some(function (slug) { var t = tratamientosBySlug[slug]; return t && V.textIncludes(t.nombre, q); });
      var matchNombre = V.textIncludes(p.nombre, q);
      var matchServicio = p.servicios.some(function (s) { return V.textIncludes(s.nombre, q) || V.textIncludes(s.descripcion, q); });
      var matchCiudad = V.textIncludes(p.ciudad, q);
      if (!matchTrat && !matchNombre && !matchServicio && !matchCiudad) return false;
    }
    return true;
  }

  function sortResults(list) {
    var orden = state.orden;
    var copy = list.slice();
    if (orden === 'valoracion') {
      copy.sort(function (a, b) { return (b.valoracion.media || 0) - (a.valoracion.media || 0); });
    } else if (orden === 'precio-asc' || orden === 'precio-desc') {
      copy.sort(function (a, b) {
        var va = precioNumerico(cheapestServicio(a)), vb = precioNumerico(cheapestServicio(b));
        // Los que no publican precio van siempre al final, sea cual sea el orden elegido.
        if (va === null && vb === null) return 0;
        if (va === null) return 1;
        if (vb === null) return -1;
        return orden === 'precio-asc' ? va - vb : vb - va;
      });
    } else if (orden === 'cercania' && state.userCoords) {
      copy.sort(function (a, b) {
        var da = V.haversineKm(state.userCoords.lat, state.userCoords.lng, a.coordenadas.lat, a.coordenadas.lng);
        var db = V.haversineKm(state.userCoords.lat, state.userCoords.lng, b.coordenadas.lat, b.coordenadas.lng);
        return (da === null ? Infinity : da) - (db === null ? Infinity : db);
      });
    } else {
      copy.sort(function (a, b) {
        if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
        return (b.valoracion.media || 0) - (a.valoracion.media || 0);
      });
    }
    return copy;
  }

  function runSearch(opts) {
    opts = opts || {};
    if (!hasSearched) {
      show(els.stateInitial);
      hide(els.stateEmpty, els.stateError, els.resultsGrid);
      els.resultsControls.hidden = true;
      els.resultsTitle.textContent = 'Busca un servicio y descubre profesionales cerca de ti';
      els.destacadosSection.hidden = false;
      return;
    }

    els.destacadosSection.hidden = true;
    var filtered = DATA.profesionales.filter(matchesFilters);
    var sorted = sortResults(filtered);

    hide(els.stateInitial, els.stateEmpty, els.stateError);
    els.resultsControls.hidden = false;

    if (!sorted.length) {
      show(els.stateEmpty);
      els.resultsGrid.hidden = true;
      els.resultsTitle.textContent = 'Sin resultados';
      return;
    }

    els.resultsTitle.textContent = sorted.length + (sorted.length === 1 ? ' profesional encontrado' : ' profesionales encontrados');
    els.resultsGrid.innerHTML = '';
    els.resultsGrid.hidden = false;
    sorted.forEach(function (p) { els.resultsGrid.appendChild(renderCard(p)); });
  }

  function renderDestacados() {
    var destacados = DATA.profesionales.filter(function (p) { return p.activo && p.destacado; });
    if (!destacados.length) { els.destacadosSection.hidden = true; return; }
    els.destacadosGrid.innerHTML = '';
    destacados.forEach(function (p) { els.destacadosGrid.appendChild(renderCard(p)); });
  }

  // ── Renderizado de tarjeta (sin innerHTML con datos externos) ───────
  function renderCard(p) {
    var categoria = categoriasBySlug[p.categoriaSlug];
    var servicio = cheapestServicio(p) || p.servicios[0] || null;
    var rating = V.formatRating(p.valoracion);
    var perfilUrl = '/encuentra-tu-servicio/' + encodeURIComponent(p.slug) + '/';

    var badges = [];
    if (p.destacado) badges.push(V.h('span', { class: 'badge badge-destacado' }, ['★ Destacado']));
    if (p.esDemo) badges.push(V.h('span', { class: 'badge badge-demo' }, ['Demo']));

    // Todas las tarjetas recortan la imagen igual (misma caja, mismo encuadre) para
    // que el grid de resultados se vea simétrico, sea cual sea la proporción de la foto.
    var mediaImg = V.h('img', {
      src: p.imagenes.portada || V.avatarDataUri(p.nombre, { variant: 'cover', size: 400 }),
      alt: '', loading: 'lazy',
      style: p.imagenes.enfoque ? ('object-position:' + p.imagenes.enfoque) : null,
      onerror: function (e) { e.target.src = V.avatarDataUri(p.nombre, { variant: 'cover', size: 400 }); }
    }, []);
    var media = V.h('a', {
      class: 'prof-card-media',
      href: perfilUrl, 'aria-label': 'Ver perfil de ' + p.nombre
    }, [
      mediaImg,
      V.h('div', { class: 'prof-badges' }, badges)
    ]);

    var logoImg = V.h('img', {
      class: 'prof-logo',
      src: p.imagenes.logo || V.avatarDataUri(p.nombre, { size: 80 }),
      alt: '', loading: 'lazy'
    }, []);
    V.withImageFallback(logoImg, p.nombre, 'logo');

    var head = V.h('div', { class: 'prof-card-head' }, [
      logoImg,
      V.h('div', {}, [
        V.h('h3', {}, [V.h('a', { href: perfilUrl }, [p.nombre])]),
        V.h('p', { class: 'prof-cat' }, [(categoria ? categoria.nombre : '') + ' · ' + p.ciudad])
      ])
    ]);

    var body = [head];
    if (p.verificado) body.push(V.h('p', { class: 'prof-verificado' }, ['✓ Verificado']));
    body.push(V.h('p', { class: 'prof-rating' }, [
      rating.stars ? V.h('span', { class: 'stars' }, [rating.stars]) : null,
      rating.text
    ]));
    if (servicio) body.push(V.h('p', { class: 'prof-service' }, [servicio.nombre]));
    if (servicio) body.push(V.h('p', { class: 'prof-price' }, [V.formatPrice(servicio.precioDesde) || 'Precio a consultar']));

    var tieneReservaOnline = !!(p.reserva && p.reserva.habilitada);
    var btnReservar = tieneReservaOnline
      ? V.h('button', {
          type: 'button', class: 'btn btn-gold',
          onclick: function () {
            window.VelsyBooking.iniciarReserva({ professionalId: p.id, serviceId: servicio ? servicio.tratamientoSlug : null }, p)
              .then(function (r) {
                if (r.status === 'not_available') {
                  V.toast('Reserva online próximamente. Entra en el perfil para ver el teléfono y contactar directamente.');
                }
              });
          }
        }, ['Reservar'])
      : V.h('span', { class: 'perfil-gratuito-label' }, ['Perfil gratuito']);

    var btnVerPerfil = V.h('a', {
      class: 'btn btn-ghost', href: perfilUrl,
      onclick: function () { V.track('view_professional', { professionalId: p.id, slug: p.slug }); }
    }, ['Ver perfil']);

    body.push(V.h('div', { class: 'prof-cta-row' }, [btnVerPerfil, btnReservar]));

    return V.h('article', { class: 'prof-card' }, [media, V.h('div', { class: 'prof-card-body' }, body)]);
  }

  function show(el) { el.hidden = false; }
  function hide() { Array.prototype.forEach.call(arguments, function (el) { el.hidden = true; }); }
})();
