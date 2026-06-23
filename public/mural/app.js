const socket = io();
const mosaic = document.querySelector("#mosaic");
const photoCount = document.querySelector("#photoCount");
const connectionState = document.querySelector("#connectionState");
const spotlight = document.querySelector("#spotlight");
const spotlightImage = document.querySelector("#spotlightImage");
const spotlightQuote = document.querySelector("#spotlightQuote");
const mainPhrase = document.querySelector("#mainPhrase");

const MAX_VISIBLE_FALLBACK = 30;
let photos = [];
let visibleLimit = MAX_VISIBLE_FALLBACK;
let totalPhotoCount = 0;
let spotlightTimer = null;

async function loadSettings() {
  try {
    const response = await fetch("/api/settings");

    if (!response.ok) {
      return;
    }

    const settings = await response.json();

    if (settings.mainPhrase) {
      mainPhrase.textContent = settings.mainPhrase;
    }

    if (settings.themeColor) {
      document.documentElement.style.setProperty(
        "--senati-color",
        settings.themeColor
      );
    }
  } catch (error) {
    console.error(error);
  }
}

function renderMosaic(nextPhotos, nextTotalCount = totalPhotoCount) {
  photos = nextPhotos.slice(0, visibleLimit);
  totalPhotoCount = Math.max(nextTotalCount, photos.length);
  photoCount.textContent = String(totalPhotoCount);
  mosaic.innerHTML = "";

  photos.forEach((photo, index) => {
    mosaic.appendChild(createTile(photo, index));
  });

  layoutCollage();
}

function createTile(photo, index) {
  const tile = document.createElement("article");
  tile.className = "tile";
  tile.dataset.id = photo.id;
  tile.dataset.index = String(index);

  const profile = getCollageProfile(photo.id, index);
  tile.classList.add(profile.className);
  tile.style.setProperty("--tilt", `${profile.tilt}deg`);
  tile.style.setProperty("--tilt-end", `${profile.tiltEnd}deg`);
  tile.style.setProperty("--float-x", `${profile.floatX}px`);
  tile.style.setProperty("--float-y", `${profile.floatY}px`);
  tile.style.setProperty("--duration", `${profile.duration}s`);
  tile.style.setProperty("--delay", `${profile.delay}s`);
  tile.style.setProperty("--enter-delay", `${Math.min(index * 0.045, 0.9)}s`);
  tile.style.zIndex = String(photos.length - index);

  const frame = document.createElement("div");
  frame.className = "tile-frame";

  const image = document.createElement("img");
  image.src = photo.url;
  image.alt = "Fotografia enviada por visitante del museo";
  image.loading = "eager";

  const quote = document.createElement("p");
  quote.className = "tile-quote";
  quote.textContent = photo.quote;

  frame.appendChild(image);
  frame.appendChild(quote);
  tile.appendChild(frame);
  return tile;
}

function getCollageProfile(id, index) {
  const seed = numericHash(id);
  const variants = [
    { className: "tile-small", width: 1, height: 1 },
    { className: "tile-tall", width: 0.92, height: 1.28 },
    { className: "tile-wide", width: 1.35, height: 0.94 },
    { className: "tile-large", width: 1.24, height: 1.24 }
  ];
  const variant = index === 0 ? variants[3] : variants[seed % variants.length];

  return {
    ...variant,
    tilt: ((seed % 13) - 6) * 0.8,
    tiltEnd: (((seed % 13) - 6) * 0.8) * -0.65,
    floatX: ((seed >> 2) % 9) - 4,
    floatY: ((seed >> 4) % 11) - 5,
    duration: 7 + (seed % 7),
    delay: -1 * (seed % 9)
  };
}

function layoutCollage() {
  const tiles = [...mosaic.querySelectorAll(".tile")];
  if (!tiles.length) return;

  const rect = mosaic.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const maxRadiusX = rect.width * 0.43;
  const maxRadiusY = rect.height * 0.42;
// Base size is determined by the smaller dimension of the container, with limits to prevent extreme sizes
  const baseSize = clamp(Math.min(rect.width, rect.height) * 0.23, 150, 310);

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const maxIndex = Math.max(tiles.length - 1, 1);

  tiles.forEach((tile, index) => {
    const profile = getCollageProfile(tile.dataset.id, index);
    const progress = Math.sqrt(index / maxIndex);
    const angle = index * goldenAngle - Math.PI / 2;
    const centerPull = index === 0 ? 0 : progress;
    const width = baseSize * profile.width;
    const height = baseSize * profile.height;
    const x = centerX + Math.cos(angle) * maxRadiusX * centerPull;
    const y = centerY + Math.sin(angle) * maxRadiusY * centerPull;

    tile.style.width = `${width}px`;
    tile.style.height = `${height}px`;
    tile.style.left = `${x}px`;
    tile.style.top = `${y}px`;
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function numericHash(value) {
  return [...String(value)].reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0;
  }, 7);
}

function addPhoto(photo, serverVisiblePhotos, serverTotalCount) {
  const merged = [photo, ...photos.filter((item) => item.id !== photo.id)];
  const nextPhotos = Array.isArray(serverVisiblePhotos)
    ? serverVisiblePhotos
    : merged.slice(0, visibleLimit);

  removeOverflow(nextPhotos);
  setTimeout(() => renderMosaic(nextPhotos, serverTotalCount), 540);
}

function removeOverflow(nextPhotos) {
  const nextIds = new Set(nextPhotos.map((photo) => photo.id));
  const tiles = [...mosaic.querySelectorAll(".tile")];

  tiles.forEach((tile) => {
    if (!nextIds.has(tile.dataset.id)) {
      tile.classList.add("is-removing");
    }
  });
}

function showSpotlight(photo) {
  clearTimeout(spotlightTimer);

  spotlightImage.src = photo.url;
  spotlightImage.alt = "Nueva fotografia agregada al mural";
  spotlightQuote.textContent = photo.quote;
  spotlight.setAttribute("aria-hidden", "false");
  spotlight.classList.add("is-active");

  spotlightTimer = setTimeout(() => {
    spotlight.classList.remove("is-active");
    spotlight.setAttribute("aria-hidden", "true");
  }, 5000);
}

socket.on("connect", () => {
  connectionState.textContent = "Conectado en tiempo real";
});

socket.on("disconnect", () => {
  connectionState.textContent = "Reconectando...";
});

socket.on("photos:init", (payload) => {
  visibleLimit = payload.limit || MAX_VISIBLE_FALLBACK;
  renderMosaic(payload.photos || [], payload.totalCount || 0);
});

socket.on("photo:new", (payload) => {
  showSpotlight(payload.photo);
  addPhoto(payload.photo, payload.visiblePhotos, payload.totalCount);
});

socket.on("photos:refresh", (payload) => {
  visibleLimit = payload.limit || MAX_VISIBLE_FALLBACK;
  renderMosaic(payload.photos || [], payload.totalCount || 0);
});

socket.on("photos:error", (payload) => {
  connectionState.textContent = payload.message || "Error de conexion";
});

socket.on("settings:update", (settings) => {
  if (settings.mainPhrase) {
    mainPhrase.textContent = settings.mainPhrase;
  }

  if (settings.themeColor) {
    document.documentElement.style.setProperty(
      "--senati-color",
      settings.themeColor
    );
  }
});

window.addEventListener("resize", () => {
  window.requestAnimationFrame(layoutCollage);
});

loadSettings();