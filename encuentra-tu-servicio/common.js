/*
 * Velsy · Encuentra tu servicio
 * common.js — utilidades compartidas entre el buscador y las fichas de profesional.
 * Sin dependencias externas. Pensado para funcionar directamente en Hostinger (sin build).
 */
(function (window, document) {
  'use strict';

  var CACHE = {};

  /** Quita tildes, pasa a minúsculas y colapsa espacios. "Estética" -> "estetica" */
  function normalize(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  /** true si `haystack` normalizado contiene `needle` normalizado */
  function textIncludes(haystack, needle) {
    if (!needle) return true;
    return normalize(haystack).indexOf(normalize(needle)) !== -1;
  }

  /** Crea un elemento DOM de forma segura. Nunca usa innerHTML con datos externos. */
  function h(tag, props, children) {
    var el = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (key) {
      var value = props[key];
      if (value === null || value === undefined || value === false) return;
      if (key === 'text') {
        el.textContent = value;
      } else if (key === 'class') {
        el.className = value;
      } else if (key.indexOf('on') === 0 && typeof value === 'function') {
        el.addEventListener(key.slice(2), value);
      } else if (key === 'dataset') {
        Object.keys(value).forEach(function (dk) { el.dataset[dk] = value[dk]; });
      } else {
        el.setAttribute(key, value);
      }
    });
    (children || []).forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return el;
  }

  /** Solo permite URLs http(s) bien formadas. Cualquier otra cosa (javascript:, data:, etc.) se descarta. */
  function safeUrl(url) {
    if (!url || typeof url !== 'string') return null;
    try {
      var parsed = new URL(url, window.location.origin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
    } catch (e) { /* URL inválida */ }
    return null;
  }

  function safeTelHref(tel) {
    if (!tel || typeof tel !== 'string') return null;
    var digits = tel.replace(/[^\d+]/g, '');
    return digits ? 'tel:' + digits : null;
  }

  function safeMailHref(email) {
    if (!email || typeof email !== 'string') return null;
    // Validación simple, suficiente para evitar cabeceras/inyección en el mailto.
    var ok = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email);
    return ok ? 'mailto:' + email : null;
  }

  /** Avatar/placeholder generado en SVG (data URI) con las iniciales del negocio. Nunca hay imagen rota. */
  function avatarDataUri(nombre, opts) {
    opts = opts || {};
    var size = opts.size || 200;
    var initials = String(nombre || 'V')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(function (w) { return w.charAt(0).toUpperCase(); })
      .join('') || 'V';
    var bg = opts.variant === 'cover' ? '#f2ece4' : '#c9a227';
    var fg = opts.variant === 'cover' ? '#c9a227' : '#ffffff';
    var fontSize = Math.round(size * 0.36);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<rect width="100%" height="100%" fill="' + bg + '"/>' +
      '<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="' + fontSize + '" fill="' + fg + '">' + initials + '</text>' +
      '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  /** Engancha un fallback automático a un <img> por si la ruta configurada no carga. */
  function withImageFallback(imgEl, nombre, variant) {
    imgEl.addEventListener('error', function onError() {
      imgEl.removeEventListener('error', onError);
      imgEl.src = avatarDataUri(nombre, { variant: variant });
    }, { once: true });
    return imgEl;
  }

  /** Carga y cachea un JSON de /data. Nunca lanza errores "técnicos" al llamador visible al usuario. */
  function fetchJSON(url) {
    if (CACHE[url]) return CACHE[url];
    CACHE[url] = fetch(url, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
    return CACHE[url];
  }

  function haversineKm(lat1, lng1, lat2, lng2) {
    if ([lat1, lng1, lat2, lng2].some(function (v) { return typeof v !== 'number' || isNaN(v); })) return null;
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function formatPrice(precio) {
    if (typeof precio !== 'number' || isNaN(precio)) return null;
    return 'Desde ' + precio.toString().replace('.', ',') + ' €';
  }

  function formatRating(valoracion) {
    if (!valoracion || !valoracion.numOpiniones) return { text: 'Sin valoraciones todavía', stars: '' };
    var media = Math.round(valoracion.media * 10) / 10;
    var full = Math.round(media);
    var stars = '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
    return { text: media.toFixed(1) + ' (' + valoracion.numOpiniones + (valoracion.numOpiniones === 1 ? ' opinión' : ' opiniones') + ')', stars: stars };
  }

  /**
   * Pide la ubicación SOLO cuando se llama explícitamente (nunca automáticamente al cargar la página).
   * Devuelve una promesa que resuelve {lat,lng} o rechaza con un mensaje ya listo para mostrar al usuario.
   */
  function getUserLocation() {
    return new Promise(function (resolve, reject) {
      if (!('geolocation' in navigator)) {
        reject('Tu navegador no permite compartir la ubicación. Escribe tu ciudad o código postal.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        function (err) {
          var msg = 'No hemos podido acceder a tu ubicación. Escribe tu ciudad o código postal.';
          if (err && err.code === err.PERMISSION_DENIED) {
            msg = 'Has bloqueado el acceso a tu ubicación. Puedes escribir tu ciudad o código postal en su lugar.';
          }
          reject(msg);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
      );
    });
  }

  /**
   * Capa de analítica preparada pero sin instalar ninguna herramienta nueva.
   * Si en el futuro se añade GA4/GTM, basta con leer window.dataLayer o escuchar 'velsy:analytics'.
   */
  function track(name, data) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: name, ...data });
      window.dispatchEvent(new CustomEvent('velsy:analytics', { detail: { name: name, data: data || {} } }));
    } catch (e) { /* la analítica nunca debe romper la experiencia del usuario */ }
  }

  /**
   * Si la foto es demasiado cuadrada/vertical para la caja panorámica en la que se
   * muestra, "cover" la recortaría feo por arriba y por abajo (podría cortar cabezas).
   * En ese caso se añade `containClass` al contenedor para que se vea completa en vez
   * de recortada (ver reglas .is-contained en styles.css).
   */
  function adaptFit(imgEl, containerEl, containClass) {
    function apply() {
      var ratioImg = imgEl.naturalWidth / imgEl.naturalHeight;
      var box = containerEl.getBoundingClientRect();
      var ratioBox = box.width / box.height;
      if (!ratioImg || !ratioBox || !isFinite(ratioImg) || !isFinite(ratioBox)) return;
      if (ratioImg < ratioBox * 0.72) containerEl.classList.add(containClass);
      else containerEl.classList.remove(containClass);
    }
    if (imgEl.complete && imgEl.naturalWidth) apply();
    else imgEl.addEventListener('load', apply, { once: true });
  }

  var toastTimer = null;
  /** Aviso breve y accesible, sin bloquear la interfaz (nunca usa alert()). */
  function toast(message) {
    var el = document.getElementById('velsy-toast');
    if (!el) {
      el = h('div', { id: 'velsy-toast', role: 'status', 'aria-live': 'polite', style:
        'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:999;' +
        'background:#111827;color:#fff;padding:.75rem 1.15rem;border-radius:10px;' +
        'font:600 .85rem system-ui,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.25);' +
        'max-width:90vw;text-align:center;opacity:0;transition:opacity .2s;'
      }, []);
      document.body.appendChild(el);
    }
    el.textContent = message;
    requestAnimationFrame(function () { el.style.opacity = '1'; });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.style.opacity = '0'; }, 4000);
  }

  window.Velsy = {
    normalize: normalize,
    toast: toast,
    textIncludes: textIncludes,
    h: h,
    safeUrl: safeUrl,
    safeTelHref: safeTelHref,
    safeMailHref: safeMailHref,
    avatarDataUri: avatarDataUri,
    withImageFallback: withImageFallback,
    adaptFit: adaptFit,
    fetchJSON: fetchJSON,
    haversineKm: haversineKm,
    formatPrice: formatPrice,
    formatRating: formatRating,
    getUserLocation: getUserLocation,
    track: track
  };
})(window, document);
