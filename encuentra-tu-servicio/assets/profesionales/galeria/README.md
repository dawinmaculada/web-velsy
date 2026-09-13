# Fotos de profesionales (portada y galería)

Cada negocio tiene su propia carpeta dentro de `galeria/`, nombrada con su
`slug` (el mismo que usas en `data/profesionales.json`). Dentro, guarda tantas
fotos como quieras, con el nombre que prefieras:

```
galeria/
├── osteopatia-indalo-madrid/
│   ├── 1.jpg        → esta se usa como portada
│   ├── 2.webp
│   └── 3.webp
└── nombre-del-negocio/
    ├── portada.jpg
    ├── local-1.jpg
    └── local-2.jpg
```

Si das de alta un negocio nuevo, crea su carpeta (`galeria/tu-slug/`) y sube
ahí sus fotos.

Tamaño recomendado: portada 1200×750 px aprox., galería 800×800 px.
Usa JPG o, si puedes, WebP (pesa menos y carga más rápido).

Después, en `data/profesionales.json`, apunta las rutas correspondientes:

```json
"imagenes": {
  "logo": "assets/profesionales/logos/tu-slug.png",
  "portada": "assets/profesionales/galeria/tu-slug/portada.jpg",
  "galeria": [
    "assets/profesionales/galeria/tu-slug/portada.jpg",
    "assets/profesionales/galeria/tu-slug/local-1.jpg",
    "assets/profesionales/galeria/tu-slug/local-2.jpg"
  ]
}
```

Si `portada` se deja en `null`, se genera automáticamente una imagen de
sustitución con las iniciales del negocio — nunca se muestra una imagen rota.
