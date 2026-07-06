const socket = io();

const mosaic = document.querySelector("#mosaic");

const spotlight =
  document.querySelector("#spotlight");

const spotlightImage =
  document.querySelector("#spotlightImage");

const spotlightQuote =
  document.querySelector("#spotlightQuote");

let spotlightTimer = null;

let allPhotos = [];
let visiblePhotos = [];
let featuredPhotos = [];

/*
  Guardará los 45 cuadros del mural.
  Así no tendremos que volver a crearlos.
*/
let gridTiles = [];

let featuredOffset = 0;

let spotlightActive = false;

let featuredPositionIndex = 0;

const GRID_SIZE = 45;

async function loadSettings() {
  try {
    const response = await fetch("/api/settings");

    if (!response.ok) return;

    const settings = await response.json();

    if (settings.backgroundImage) {
      document.body.style.backgroundImage =
        `url(${settings.backgroundImage})`;
    }

  } catch (error) {
    console.error(error);
  }
}

async function loadFeaturedPhotos() {

  try {

    const response =
      await fetch(
        "/api/featured-photos"
      );

    if (!response.ok) {
      return;
    }

    const data =
      await response.json();

    featuredPhotos =
      data.photos || [];

    console.log(
      "DESTACADAS:",
      featuredPhotos
    );

  } catch (error) {

    console.error(error);

  }

}

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [copy[i], copy[j]] =
      [copy[j], copy[i]];
  }

  return copy;
}

function renderGrid() {

  if (gridTiles.length === 0) {

    mosaic.innerHTML = "";

    visiblePhotos.forEach((photo) => {

      const tile =
        document.createElement("div");

      tile.className = "grid-photo";

      const tilt =
        Math.random() * 4 - 2;

      tile.style.setProperty(
        "--tilt",
        `${tilt}deg`
      );

      const image =
        document.createElement("img");

      image.alt = "";
      image.src = photo.url;

      const duration =
        8 + Math.random() * 8;

      image.style.animationDuration =
        `${duration}s`;

      tile.appendChild(image);

      mosaic.appendChild(tile);

      gridTiles.push(tile);

    });

    return;

  }

  visiblePhotos.forEach((photo, index) => {

    const tile =
      gridTiles[index];

    if (!tile) return;

    const image =
      tile.querySelector("img");

    image.src =
      photo.url;

  });

}

/*function initializeGrid() {

  visiblePhotos =
    shuffle(allPhotos)
      .slice(0, GRID_SIZE);

  renderGrid();
}*/

/*function initializeGrid() {

  visiblePhotos =
    shuffle(allPhotos)
      .slice(0, GRID_SIZE);

  const featuredPositions = [
    10,
    16,
    22,
    28,
    34
  ];

  featuredPositions.forEach(
    (position, index) => {

      if (
        featuredPhotos[index]
      ) {

        visiblePhotos[position] =
          featuredPhotos[index];
      }

    }
  );
  console.log(
    "DESTACADAS EN GRID:",
    featuredPhotos
  );

  console.log(
    "VISIBLES:",
    visiblePhotos
  );
    renderGrid();
  }*/

function initializeGrid() {
  if (visiblePhotos.length === 0) {

    visiblePhotos =
      shuffle(allPhotos)
        .slice(0, GRID_SIZE);

  }
  const featuredPositions = [
    10,
    16,
    22,
    28,
    34
  ];

  featuredPositions.forEach(
    (position, index) => {

      if (
        featuredPhotos.length
      ) {

        const photoIndex =
          (
            featuredOffset +
            index
          ) %
          featuredPhotos.length;

        visiblePhotos[position] =
          featuredPhotos[photoIndex];
      }

    }
  );

  renderGrid();
}
function rotatePhotos() {
  if (spotlightActive) {
    return;
  }
  if (
    allPhotos.length <= GRID_SIZE
  ) {
    return;
  }

  const tiles =
    [...document.querySelectorAll(
            ".grid-photo"
          )];

        const changes =
        Math.floor(
          Math.random() * 3
        ) + 1;

      for (let i = 0; i < changes; i++) {

          const featuredPositions = [
        10,
        16,
        22,
        28,
        34
      ];

      let tileIndex;

      do {

        tileIndex =
          Math.floor(
            Math.random() *
            tiles.length
          );

      } while (
        featuredPositions.includes(
          tileIndex
        )
      );

      let photo;

      let attempts = 0;

      do {

        photo =
          allPhotos[
            Math.floor(
              Math.random() *
              allPhotos.length
            )
          ];

        attempts++;

      } while (

        visiblePhotos.some(
          visible =>
            visible &&
            visible.id === photo.id
        ) &&

        attempts < 100

      );

    const tile =
      tiles[tileIndex];

    tile.classList.add("fade");

    // Espera a que aparezca el destello blanco
    setTimeout(() => {

      tile.querySelector("img").src =
        photo.url;
      visiblePhotos[tileIndex] =
      photo;
    }, 450);

    // Mantiene el destello un poco más
    setTimeout(() => {

      tile.classList.remove("fade");

    }, 900);
  }
}

function rotateFeaturedPhotos() {

  if (spotlightActive) {
    return;
  }

  if (featuredPhotos.length <= 1) {
    return;
  }

  const featuredPositions = [
    10,
    16,
    22,
    28,
    34
  ];

  const position =
    featuredPositions[
      featuredPositionIndex
    ];

  const tile =
    gridTiles[position];

  if (!tile) {
    return;
  }

  let photo;

  let attempts = 0;

  do {

    featuredOffset++;

    const photoIndex =
      featuredOffset %
      featuredPhotos.length;

    photo =
      featuredPhotos[photoIndex];

    attempts++;

  } while (

    visiblePhotos.some(
      visible =>
        visible &&
        visible.id === photo.id
    ) &&

    attempts < featuredPhotos.length

  );

  visiblePhotos[position] =
    photo;

  const image =
    tile.querySelector("img");

  tile.classList.add("fade");

  setTimeout(() => {

    image.src =
      photo.url;

  }, 450);

  setTimeout(() => {

    tile.classList.remove(
      "fade"
    );

  }, 900);

  featuredPositionIndex =
    (featuredPositionIndex + 1) %
    featuredPositions.length;

}

function showNewestPhoto(photo) {

  const position = 13;

  const tile = gridTiles[position];

  if (!tile) {
    return;
  }

  visiblePhotos[position] = photo;

  const image =
    tile.querySelector("img");

  tile.classList.add("fade");

  setTimeout(() => {

    image.src = photo.url;

  }, 450);

  setTimeout(() => {

    tile.classList.remove("fade");

  }, 900);

}

socket.on(
  "photos:init",
  async (payload) => {

    allPhotos =
      payload.photos || [];

    await loadFeaturedPhotos();

    initializeGrid();
  }
);

socket.on(
  "photo:new",
  (payload) => {

    showSpotlight(
      payload.photo
    );

    allPhotos.unshift(
      payload.photo
    );

    setTimeout(() => {

      showNewestPhoto(
        payload.photo
      );

    }, 5000);

  }
);

socket.on(
  "photos:refresh",
  async (payload) => {

    allPhotos =
      payload.photos || [];

    await loadFeaturedPhotos();

    initializeGrid();
  }
);

socket.on(
  "featured-photos:update",
  (payload) => {

    featuredPhotos =
      payload.photos || [];

    initializeGrid();

  }
);

socket.on(
  "featured:refresh",
  (payload) => {

    featuredPhotos =
      payload.photos || [];

    initializeGrid();

  }
);
function startRandomRotation() {

  const delay =
    5000 +
    Math.random() * 5000;

  setTimeout(() => {

    rotatePhotos();

    startRandomRotation();

  }, delay);

}

function showSpotlight(photo) {

  clearTimeout(
    spotlightTimer
  );
  spotlightActive = true;
  spotlightImage.src =
    photo.url;

  spotlightQuote.textContent =
    photo.quote;

  spotlight.classList.add(
    "is-active"
  );
  mosaic.classList.add(
    "is-hidden"
  );
  spotlightTimer =
    setTimeout(() => {

      spotlight.classList.remove(
        "is-active"
      );
      mosaic.classList.remove(
        "is-hidden"
      );
      spotlightActive = false;
    }, 5000);
}

loadSettings();
loadFeaturedPhotos();
startRandomRotation();
setInterval(() => {

  rotateFeaturedPhotos();

}, 5000);

function subtleZoom() {

  const photos =
    document.querySelectorAll(
      ".grid-photo"
    );

  if (!photos.length) return;

  const photo =
    photos[
      Math.floor(
        Math.random() *
        photos.length
      )
    ];

  photo.classList.add("pop");

  setTimeout(() => {

    photo.classList.remove(
      "pop"
    );

  }, 3500);
}

setInterval(
  subtleZoom,
  2500
);