/*
 * Velsy · Encuentra tu servicio
 * perfil.js — ficha pública de un profesional, generada a partir de /data/*.json.
 * Una sola plantilla sirve a todos los profesionales: el slug llega por ?slug=
 * (o por la URL bonita /encuentra-tu-servicio/{slug}/ reescrita por .htaccess).
 */
(function () {
  'use strict';

  var V = window.Velsy;
  var DIAS = [['lun', 'Lunes'], ['mar', 'Martes'], ['mie', 'Miércoles'], ['jue', 'Jueves'], ['vie', 'Viernes'], ['sab', 'Sábado'], ['dom', 'Domingo']];

  // Esta página se puede ver en dos URLs distintas que muestran rutas relativas
  // diferentes al navegador: /encuentra-tu-servicio/perfil/?slug=... (acceso directo)
  // o /encuentra-tu-servicio/{slug}/ (URL bonita, reescrita por .htaccess sin avisar
  // al navegador). Por eso aquí SIEMPRE se usan rutas absolutas desde la raíz del
  // sitio, nunca relativas — así funciona igual venga por donde venga.
  function assetPath(relPath) {
    if (!relPath) return null;
    if (/^https?:\/\//i.test(relPath)) return relPath;
    return '/encuentra-tu-servicio/' + relPath;
  }

  /**
   * El .htaccess reescribe /encuentra-tu-servicio/{slug}/ hacia
   * perfil/index.html?slug={slug} DENTRO del servidor, pero eso es invisible
   * para el navegador: la barra de direcciones sigue mostrando la URL bonita
   * SIN "?slug=", así que window.location.search llega vacío. Por eso, si no
   * hay slug en la query string, se saca directamente del último tramo de la
   * URL (ignorando "perfil", que es la propia carpeta de la plantilla).
   */
  function getSlugFromUrl() {
    var qsSlug = new URLSearchParams(window.location.search).get('slug');
    if (qsSlug) return qsSlug;
    var parts = window.location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    var last = parts[parts.length - 1];
    if (last && last !== 'perfil' && last !== 'encuentra-tu-servicio') return decodeURIComponent(last);
    return null;
  }

  var slug = getSlugFromUrl();

  var els = {
    loading: document.getElementById('state-loading'),
    notfound: document.getElementById('state-notfound'),
    content: document.getElementById('profile-content'),
    demoBanner: document.getElementById('demo-banner'),
    breadcrumbCurrent: document.getElementById('breadcrumb-current'),
    cover: document.getElementById('profile-cover'),
    logo: document.getElementById('profile-logo'),
    nombre: document.getElementById('profile-nombre'),
    verificado: document.getElementById('profile-verificado'),
    rating: document.getElementById('profile-rating'),
    ubicacion: document.getElementById('profile-ubicacion'),
    descripcion: document.getElementById('profile-descripcion'),
    serviciosList: document.getElementById('servicios-list'),
    galeriaSection: document.getElementById('galeria'),
    galeriaGrid: document.getElementById('galeria-grid'),
    infoList: document.getElementById('info-list'),
    horarioList: document.getElementById('horario-list'),
    mapaSection: document.getElementById('mapa-section'),
    mapaEmbed: document.getElementById('mapa-embed'),
    btnReservar: document.getElementById('btn-reservar-cita')
  };

  if (!slug) { showNotFound(); }
  else {
    Promise.all([
      V.fetchJSON('/encuentra-tu-servicio/data/profesionales.json'),
      V.fetchJSON('/encuentra-tu-servicio/data/tratamientos.json'),
      V.fetchJSON('/encuentra-tu-servicio/data/categorias.json')
    ]).then(function (results) {
      var profesionales = results[0], tratamientos = results[1], categorias = results[2];
      var tratamientosBySlug = {};
      tratamientos.forEach(function (t) { tratamientosBySlug[t.slug] = t; });
      var categoriasBySlug = {};
      categorias.forEach(function (c) { categoriasBySlug[c.slug] = c; });

      var p = profesionales.find(function (x) { return x.slug === slug && x.activo; });
      if (!p) { showNotFound(); return; }
      render(p, tratamientosBySlug, categoriasBySlug);
    }).catch(function () {
      showNotFound();
    });
  }

  function showNotFound() {
    els.loading.hidden = true;
    els.notfound.hidden = false;
  }

  function render(p, tratamientosBySlug, categoriasBySlug) {
    var categoria = categoriasBySlug[p.categoriaSlug];
    var rating = V.formatRating(p.valoracion);

    var tituloPagina = p.nombre + ' · ' + (categoria ? categoria.nombre : '') + ' en ' + p.ciudad + ' | velsy';
    var urlCanonica = 'https://velsy.es/encuentra-tu-servicio/' + encodeURIComponent(p.slug) + '/';
    document.title = tituloPagina;
    setMeta('meta-description', 'content', p.descripcion.slice(0, 155));
    setMeta('link-canonical', 'href', urlCanonica);
    setMeta('meta-og-title', 'content', tituloPagina);
    setMeta('meta-og-description', 'content', p.descripcion.slice(0, 155));
    setMeta('meta-og-url', 'content', urlCanonica);

    if (p.esDemo) {
      var robots = document.createElement('meta');
      robots.name = 'robots';
      robots.content = 'noindex, nofollow';
      document.head.appendChild(robots);
      els.demoBanner.hidden = false;
    } else {
      injectSchema(p, categoria);
    }

    els.breadcrumbCurrent.textContent = p.nombre;

    var esLogoComoPortada = !!p.imagenes.portada && p.imagenes.portada === p.imagenes.logo;
    var coverImg = V.h('img', {
      src: assetPath(p.imagenes.portada) || V.avatarDataUri(p.nombre, { variant: 'cover', size: 800 }),
      alt: '', loading: 'lazy'
    }, []);
    V.withImageFallback(coverImg, p.nombre, 'cover');
    els.cover.appendChild(coverImg);
    if (esLogoComoPortada) els.cover.classList.add('is-contained');
    else V.adaptFit(coverImg, els.cover, 'is-contained');

    els.logo.src = assetPath(p.imagenes.logo) || V.avatarDataUri(p.nombre, { size: 128 });
    V.withImageFallback(els.logo, p.nombre, 'logo');

    els.nombre.textContent = p.nombre;
    if (p.verificado) els.verificado.hidden = false;
    els.rating.textContent = (rating.stars ? rating.stars + ' ' : '') + rating.text;
    els.ubicacion.textContent = '📍 ' + p.ciudad + (p.provincia && p.provincia !== p.ciudad ? ' (' + p.provincia + ')' : '');
    els.descripcion.textContent = p.descripcion;

    renderServicios(p, tratamientosBySlug);
    renderGaleria(p);
    renderInfo(p);
    renderHorario(p);
    renderMapa(p);

    var tieneReservaOnline = !!(p.reserva && p.reserva.habilitada);
    if (tieneReservaOnline) {
      els.btnReservar.addEventListener('click', function () {
        window.VelsyBooking.iniciarReserva({ professionalId: p.id }, p).then(function (r) {
          if (r.status === 'not_available') {
            V.toast('La reserva online todavía no está disponible para este profesional. Contacta por teléfono o email en "Información".');
          }
        });
      });
    } else {
      els.btnReservar.textContent = 'Perfil gratuito';
      els.btnReservar.className = 'perfil-gratuito-label perfil-gratuito-label-lg';
      els.btnReservar.disabled = true;
      document.querySelector('.profile-cta-note').textContent = 'Este negocio todavía no tiene reserva online. Contacta directamente en "Información".';
    }

    els.loading.hidden = true;
    els.content.hidden = false;
    V.track('view_professional', { professionalId: p.id, slug: p.slug });
  }

  function setMeta(id, attr, value) {
    var el = document.getElementById(id);
    if (el) el.setAttribute(attr, value);
  }

  function renderServicios(p, tratamientosBySlug) {
    els.serviciosList.innerHTML = '';
    if (!p.servicios.length) {
      els.serviciosList.appendChild(V.h('p', {}, ['Este profesional todavía no ha publicado servicios.']));
      return;
    }
    var tieneReservaOnline = !!(p.reserva && p.reserva.habilitada);
    p.servicios.forEach(function (s) {
      var precio = V.formatPrice(s.precioDesde) || 'Precio a consultar';
      var accion = tieneReservaOnline
        ? V.h('button', {
            type: 'button', class: 'btn btn-ghost',
            onclick: function () {
              window.VelsyBooking.iniciarReserva({ professionalId: p.id, serviceId: s.tratamientoSlug }, p).then(function (r) {
                if (r.status === 'not_available') V.toast('La reserva online todavía no está disponible para este servicio. Contacta directamente con el profesional.');
              });
            }
          }, ['Reservar'])
        : V.h('span', { class: 'perfil-gratuito-label' }, ['Perfil gratuito']);
      var item = V.h('div', { class: 'servicio-item' }, [
        V.h('div', { class: 'servicio-info' }, [
          V.h('h3', {}, [s.nombre]),
          V.h('p', {}, [s.descripcion + (s.duracionMin ? ' · ' + s.duracionMin + ' min' : '')])
        ]),
        V.h('div', { style: 'display:flex;align-items:center;gap:.8rem' }, [
          V.h('span', { class: 'servicio-precio' }, [precio]),
          accion
        ])
      ]);
      els.serviciosList.appendChild(item);
    });
  }

  function renderGaleria(p) {
    var imgs = (p.imagenes.galeria || []).map(assetPath).filter(Boolean);
    if (!imgs.length) return;
    els.galeriaSection.hidden = false;
    imgs.forEach(function (src) {
      els.galeriaGrid.appendChild(V.h('img', { src: src, alt: '', loading: 'lazy' }, []));
    });
  }

  function renderInfo(p) {
    els.infoList.innerHTML = '';
    els.infoList.appendChild(V.h('li', {}, ['📍 ' + p.direccion + ', ' + p.ciudad + ' (' + p.codigoPostal + ')']));

    var telHref = V.safeTelHref(p.contacto.telefono);
    if (telHref) {
      els.infoList.appendChild(V.h('li', {}, ['📞 ', V.h('a', {
        href: telHref, onclick: function () { V.track('click_phone', { professionalId: p.id }); }
      }, [p.contacto.telefono])]));
    }

    var mailHref = V.safeMailHref(p.contacto.email);
    if (mailHref) {
      els.infoList.appendChild(V.h('li', {}, ['✉️ ', V.h('a', { href: mailHref }, [p.contacto.email])]));
    }

    var webUrl = V.safeUrl(p.contacto.web);
    if (webUrl) {
      els.infoList.appendChild(V.h('li', {}, ['🌐 ', V.h('a', {
        href: webUrl, target: '_blank', rel: 'noopener noreferrer',
        onclick: function () { V.track('click_website', { professionalId: p.id }); }
      }, [webUrl.replace(/^https?:\/\//, '')])]));
    }

    if (p.contacto.instagram) {
      var handle = String(p.contacto.instagram).replace(/^@/, '');
      var igUrl = V.safeUrl('https://www.instagram.com/' + encodeURIComponent(handle) + '/');
      if (igUrl) {
        els.infoList.appendChild(V.h('li', {}, ['📷 ', V.h('a', {
          href: igUrl, target: '_blank', rel: 'noopener noreferrer',
          onclick: function () { V.track('click_instagram', { professionalId: p.id }); }
        }, ['@' + handle])]));
      }
    }
  }

  function renderHorario(p) {
    els.horarioList.innerHTML = '';
    DIAS.forEach(function (d) {
      var valor = p.horario && p.horario[d[0]] ? p.horario[d[0]] : 'Cerrado';
      els.horarioList.appendChild(V.h('li', {}, [V.h('span', {}, [d[1]]), V.h('span', {}, [valor])]));
    });
  }

  function renderMapa(p) {
    if (!p.coordenadas || typeof p.coordenadas.lat !== 'number' || typeof p.coordenadas.lng !== 'number') return;
    var delta = 0.01;
    var params = new URLSearchParams({
      bbox: [p.coordenadas.lng - delta, p.coordenadas.lat - delta, p.coordenadas.lng + delta, p.coordenadas.lat + delta].join(','),
      layer: 'mapnik',
      marker: p.coordenadas.lat + ',' + p.coordenadas.lng
    });
    var src = V.safeUrl('https://www.openstreetmap.org/export/embed.html?' + params.toString());
    if (!src) return;
    els.mapaSection.hidden = false;
    els.mapaEmbed.appendChild(V.h('iframe', { src: src, loading: 'lazy', title: 'Mapa de ubicación de ' + p.nombre }, []));
  }

  function injectSchema(p, categoria) {
    var schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: p.nombre,
      description: p.descripcion,
      address: {
        '@type': 'PostalAddress',
        streetAddress: p.direccion,
        addressLocality: p.ciudad,
        addressRegion: p.provincia,
        postalCode: p.codigoPostal,
        addressCountry: 'ES'
      }
    };
    if (p.coordenadas) schema.geo = { '@type': 'GeoCoordinates', latitude: p.coordenadas.lat, longitude: p.coordenadas.lng };
    if (p.contacto.telefono) schema.telephone = p.contacto.telefono;
    var webUrl = V.safeUrl(p.contacto.web);
    if (webUrl) schema.url = webUrl;
    if (p.valoracion && p.valoracion.numOpiniones) {
      schema.aggregateRating = { '@type': 'AggregateRating', ratingValue: p.valoracion.media, reviewCount: p.valoracion.numOpiniones };
    }
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }
})();
