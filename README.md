# Mural Interactivo para Museo

Base local para una instalacion interactiva con dos pantallas conectadas en tiempo real:

- **Visitante movil:** captura o sube una foto, la recorta en cuadrado y la envia.
- **Mural principal:** recibe nuevas fotos por WebSockets, muestra frase durante 5 segundos y acomoda el mosaico.

## Requisitos

- Node.js 18 o superior.
- Red local compartida entre el equipo servidor/proyector y los smartphones.

## Instalacion

```bash
npm install
cp .env.example .env
npm start
```

En Windows PowerShell puedes crear `.env` manualmente copiando el contenido de `.env.example`.

## URLs

- Mural/proyeccion: `http://localhost:3000/mural`
- Web movil/QR: `http://localhost:3000/mobile`
- Administracion de fotos: `http://localhost:3000/admin`
- Salud del servidor: `http://localhost:3000/health`

Para uso real con celulares, reemplaza `localhost` por la IP local del equipo servidor, por ejemplo:

```text
http://192.168.1.25:3000/mobile
```

Esa URL es la que debe convertirse en codigo QR.

## Estructura

```text
MURAL/
  src/
    server.js
    data/quotes.js
    services/photoStore.js
  public/
    mobile/
      index.html
      styles.css
      app.js
    mural/
      index.html
      styles.css
      app.js
    uploads/
  data/
    photos.json
```

## Notas de produccion local

- Las imagenes se guardan en `public/uploads`.
- Los metadatos se guardan en `data/photos.json`.
- El panel `/admin` permite iniciar sesion, listar, subir y eliminar fotos almacenadas.
- Las credenciales del panel se configuran con `ADMIN_USER` y `ADMIN_PASSWORD` en `.env`.
- El mural muestra como maximo `MAX_VISIBLE_PHOTOS`, por defecto las ultimas 30 fotos.
- El contador del mural muestra el total historico de fotos cargadas mientras existan en el almacenamiento local.
- El servidor conserva hasta `MAX_STORED_PHOTOS` registros e imagenes para limitar el crecimiento local.
- Si se expone en una red publica, coloca HTTPS/reverse proxy y revisa politicas de CORS.
