# Logos de profesionales

Sube aquí el logo cuadrado de cada profesional, nombrado con su `slug`:

```
centro-demo-velsy-01.jpg
centro-demo-velsy-01.webp   (recomendado si puedes exportarlo)
```

Tamaño recomendado: 200×200 px (cuadrado). Después, en `data/profesionales.json`,
apunta el campo `imagenes.logo` de ese profesional a esta ruta, por ejemplo:

```json
"imagenes": { "logo": "assets/profesionales/logos/centro-demo-velsy-01.jpg" }
```

Si el campo se deja en `null`, la web genera automáticamente un icono con las
iniciales del negocio — nunca se muestra una imagen rota.
