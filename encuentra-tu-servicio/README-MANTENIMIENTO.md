# Encuentra tu servicio · Mantenimiento

Esta sección es el marketplace de profesionales de Velsy. Es una web estática
(HTML + CSS + JavaScript, sin Node, sin build) pensada para subirse tal cual a
Hostinger mediante el Gestor de Archivos, dentro de la carpeta `encuentra-tu-servicio/`.

**Todo el contenido (profesionales, tratamientos, categorías) vive en 3 archivos
JSON dentro de `data/`. Nunca hace falta tocar HTML, CSS ni JavaScript para
añadir, editar, ocultar o destacar un profesional.**

---

## Añadir un profesional

1. Abre `data/profesionales.json` con cualquier editor de texto (Bloc de notas, VS Code, Notepad++...).
2. Copia uno de los objetos que ya existen (uno de los que empiezan por `{` y terminan por `}`, separados por comas) y pégalo al final de la lista, antes del `]` final.
3. Cambia sus datos: `id` (usa el siguiente número libre, ej. `prof_0009`), `slug` (identificador de la URL, en minúsculas y con guiones, sin espacios ni tildes, ej. `clinica-lopez-madrid`), `nombre`, `descripcion`, dirección, ciudad, teléfono, email, etc.
4. En `tratamientos`, escribe únicamente los `slug` de tratamientos que ya existen en `data/tratamientos.json` (ver más abajo cómo añadir uno nuevo si no existe).
5. En `servicios`, cada servicio debe referenciar uno de esos mismos `tratamientoSlug`, con su propio nombre, descripción, precio (`precioDesde`) y duración en minutos (`duracionMin`).
6. Sube las fotos del negocio (ver "Cambiar imágenes" más abajo) o deja `"logo": null` y `"portada": null` si todavía no tienes fotos — la web generará automáticamente un icono con las iniciales del negocio, nunca se verá una imagen rota.
7. Guarda el archivo.
8. Sube `data/profesionales.json` a Hostinger (sustituyendo al anterior) y recarga la web.

El profesional aparecerá automáticamente en los resultados de búsqueda y tendrá
su propia ficha en `https://velsy.es/encuentra-tu-servicio/{slug}/`.

**Importante:** el archivo es JSON. Cada objeto va entre `{ }`, los campos de
texto entre comillas dobles `" "`, y cada línea (salvo la última de cada bloque)
termina en coma `,`. Si guardas el archivo y la página deja de funcionar,
revisa que no falte o sobre alguna coma o comilla — puedes pegar el contenido
en https://jsonlint.com para comprobar que es válido antes de subirlo.

## Editar un profesional

Busca su objeto en `data/profesionales.json` (por su `nombre` o `slug`) y
cambia el campo que quieras. Guarda y sube el archivo.

## Ocultar un profesional

Cambia su campo `"activo": true` a `"activo": false`. Desaparecerá de las
búsquedas y de su ficha (sin necesidad de borrar sus datos). Vuelve a ponerlo
en `true` para que reaparezca.

## Destacar un profesional

Cambia `"destacado": false` a `"destacado": true`. Aparecerá en la sección
"Profesionales destacados" de la página principal del buscador.

## Verificar un profesional

Cambia `"verificado": false` a `"verificado": true` **solo cuando hayas
comprobado de verdad** que los datos del negocio son correctos (dirección,
teléfono, titularidad). Verá la insignia "✓ Verificado" en su ficha y su
tarjeta. No actives esto sin haberlo comprobado: es una promesa de confianza
para quien busca.

## Añadir un tratamiento nuevo

1. Abre `data/tratamientos.json`.
2. Añade un objeto nuevo: `{ "slug": "mi-tratamiento", "nombre": "Mi tratamiento", "categoriaSlug": "estetica" }`.
3. El `categoriaSlug` debe ser uno de los que existen en `data/categorias.json` (`estetica`, `osteopatia`, `peluqueria`, `masajes-bienestar`, `fisioterapia`). Si necesitas una categoría nueva, añádela primero ahí siguiendo el mismo patrón (`slug`, `nombre`, `icono`).
4. Guarda y sube el archivo. El tratamiento aparecerá automáticamente en el buscador, el autocompletado y el filtro de tratamientos — no hace falta escribirlo en ningún otro sitio.

## Cambiar una imagen

- **Logos**: sube el archivo a `assets/profesionales/logos/` (instrucciones dentro de esa carpeta) y apunta `imagenes.logo` del profesional a esa ruta en `profesionales.json`.
- **Portada y galería**: cada negocio tiene su propia carpeta dentro de `assets/profesionales/galeria/tu-slug/` (instrucciones dentro de `galeria/README.md`). Si das de alta un negocio nuevo, crea esa carpeta y sube ahí sus fotos; luego apunta `imagenes.portada` / `imagenes.galeria` a esas rutas.
- Si dejas cualquiera de estos campos en `null`, la web genera automáticamente una imagen de sustitución con las iniciales del negocio. Nunca verás un icono de imagen rota.
- **Si la foto de portada se recorta mal** (por ejemplo, una foto vertical donde se corta la cara de la persona): añade el campo opcional `"enfoque"` dentro de `imagenes`, con un valor tipo `"center 15%"` (cuanto más bajo el porcentaje, más arriba se mantiene visible la foto al recortarla). Ejemplo:
  ```json
  "imagenes": {
    "logo": "...",
    "portada": "...",
    "enfoque": "center 15%",
    "galeria": [...]
  }
  ```

## Cambiar un precio o una descripción

Edita directamente el campo `precioDesde`, `descripcion` o `nombre` del
servicio correspondiente dentro del objeto del profesional, en
`data/profesionales.json`.

---

## Estructura de carpetas

```
encuentra-tu-servicio/
├── index.html              Página de búsqueda (hero, filtros, resultados)
├── styles.css              Estilos compartidos (buscador + fichas)
├── common.js                Utilidades compartidas (búsqueda, seguridad, imágenes)
├── booking-service.js       Punto único de integración futura con reservas
├── search.js                 Lógica del buscador (solo la usa index.html)
├── .htaccess                 Activa las URLs bonitas de perfil en Hostinger
├── data/
│   ├── categorias.json       Categorías de negocio
│   ├── tratamientos.json     Catálogo de tratamientos
│   └── profesionales.json    ← el archivo que edita el equipo de Velsy
├── assets/profesionales/
│   ├── logos/                 Logos de cada negocio (un archivo por negocio)
│   └── galeria/                Portadas y fotos de galería
│       ├── tu-slug-1/          Una carpeta por negocio
│       └── tu-slug-2/
└── perfil/
    ├── index.html             Plantilla ÚNICA de ficha (sirve a todos los profesionales)
    └── perfil.js               Lógica de la ficha
```

No existe (ni debe crearse) un archivo `.html` por cada profesional: todos
comparten la misma plantilla `perfil/index.html`, que se rellena con los datos
de `profesionales.json` según el `slug` de la URL.

## Cómo funcionan las URLs de ficha

La URL pública de una ficha es `https://velsy.es/encuentra-tu-servicio/{slug}/`.
Por dentro, el archivo `.htaccess` de esta carpeta reescribe esa URL hacia
`perfil/index.html?slug={slug}` sin que el visitante lo note (Hostinger
soporta esto de forma nativa, sin Node ni servidor adicional).

Si alguna vez pruebas la web en tu ordenador con la extensión **Live Server**
de VS Code, esa reescritura NO funcionará (Live Server no lee `.htaccess`).
En local, usa en su lugar `http://127.0.0.1:5502/encuentra-tu-servicio/perfil/?slug=centro-demo-velsy-01`
— funciona exactamente igual, solo cambia el formato de la URL. En Hostinger
(producción) ambas formas funcionan y la bonita es la que se debe compartir.

## Subir los cambios a Hostinger

1. Entra en Hostinger → Gestor de Archivos.
2. Sube la carpeta completa `encuentra-tu-servicio/` (o solo los archivos que hayas cambiado, normalmente `data/profesionales.json` o alguna imagen) a la raíz del sitio, al mismo nivel que `index.html`, `clinicaestetica/`, etc.
3. Asegúrate de subir también el archivo `.htaccess` (algunos gestores de archivos lo ocultan por ser un archivo que empieza por punto — activa "mostrar archivos ocultos" si no lo ves).
4. No hace falta reiniciar nada ni ejecutar ningún comando: al recargar la web, los cambios ya están activos.

**Importante si cambias `styles.css`, `common.js`, `search.js`, `booking-service.js` o `perfil.js`** (esto no aplica a `data/profesionales.json` ni a las imágenes): los navegadores guardan estos archivos en caché de forma agresiva, así que un visitante (o tú mismo probándolo) puede seguir viendo la versión antigua durante días aunque ya hayas subido la nueva. Estos archivos se cargan con un sello de versión al final, por ejemplo:
```html
<script src="search.js?v=2"></script>
```
Cada vez que subas un cambio en uno de esos archivos, sube también el número (`?v=2` → `?v=3`) en **todas** las páginas que lo cargan (`index.html` y `perfil/index.html`). Así el navegador lo trata como un archivo nuevo y descarga la versión actualizada en vez de la guardada.

---

## Datos de demostración

Los 8 profesionales incluidos ahora mismo (`Centro Demo Velsy 01`...`08`) son
**datos de demostración**, no negocios reales. Llevan el campo `"esDemo": true`,
lo que hace que:
- se muestre una etiqueta "Demo" en su tarjeta y un aviso en su ficha,
- su ficha lleve `noindex` (no se indexa en Google),
- no se les genere marcado Schema.org de negocio real (para no publicar datos falsos como si fueran ciertos).

Cuando des de alta profesionales reales, simplemente pon `"esDemo": false` (o
quita el campo) en su objeto — a partir de ahí su ficha sí se indexará y sí
llevará marcado SEO de negocio real.

---

## Qué queda preparado para el futuro

- **Reservas**: toda la interfaz llama únicamente a `VelsyBooking.iniciarReserva()`
  (`booking-service.js`). Hoy, si el profesional no tiene `reserva.habilitada`,
  se informa amablemente de que la reserva online no está disponible todavía.
  El día que se conecte con la agenda real de `app.velsy.es`, solo hay que
  reescribir esa función para que llame al endpoint real — ningún otro archivo
  necesita cambios.
- **Base de datos / API real**: todo el frontend lee los datos a través de
  `Velsy.fetchJSON('data/profesionales.json')`. Cambiar esa URL por la de un
  endpoint real (`/api/profesionales`) que devuelva el mismo formato de datos
  es la única migración necesaria para pasar de archivos estáticos a backend,
  sin tocar el resto de la interfaz.
- **SEO local** (`/estetica/madrid/`, etc.): la página de búsqueda ya acepta
  parámetros en la URL (`?categoria=estetica&ciudad=madrid`) y reconstruye la
  búsqueda automáticamente. Una futura página de aterrizaje local solo necesita
  su propio `<title>`/`<meta>` y enlazar a esa URL con esos parámetros.
- **Reclamación de perfiles / panel profesional**: el esquema de datos ya
  contempla los campos necesarios (`id`, `slug`, `reserva.employeeId`, etc.)
  para que, en el futuro, un profesional pueda "reclamar" su ficha y
  gestionarla desde `app.velsy.es` sin cambiar la estructura de datos actual.
- **Alta automática desde el registro de la app** (pendiente, anotado el
  2026-09-12): hoy, registrarse en `app.velsy.es/register` (base de datos
  Supabase) y aparecer en `encuentra-tu-servicio` (archivo JSON en Hostinger)
  son dos cosas totalmente independientes — nadie aparece en el buscador solo
  por registrarse en la app. Para automatizarlo en el futuro hacen falta dos
  cosas: (1) migrar el marketplace de leer `data/profesionales.json` a leer
  directamente de Supabase (cambio de una única URL en `common.js`, ver punto
  "Base de datos / API real" más arriba), y (2) decidir el estado por defecto
  de un negocio recién registrado — se recomienda que entre con `activo: false`
  (oculto) hasta que alguien de Velsy revise los datos y lo publique a mano,
  para no exponer registros de prueba o incompletos automáticamente.

## Limitación conocida

Al ser una web 100% estática sin generación previa, las etiquetas de SEO/Open
Graph de cada ficha de profesional se rellenan con JavaScript **después** de
cargar la página. Google la indexa bien (ejecuta JavaScript), pero algunas
redes sociales que no ejecutan JavaScript al generar la vista previa de un
enlace compartido (algunos rastreadores de mensajería) podrían mostrar el
título/imagen genéricos en vez de los del profesional concreto. Si esto llega
a ser un problema, la solución es generar esas páginas con un pequeño script
de pre-renderizado antes de subirlas — no requiere rehacer la interfaz.
