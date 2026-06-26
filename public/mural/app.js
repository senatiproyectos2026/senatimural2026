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
let featuredOffset = 0;
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
  mosaic.innerHTML = "";

  visiblePhotos.forEach((photo) => {

    const tile =
        document.createElement("div");

      tile.className = "grid-photo";

      const tilt =
        (Math.random() * 4 - 2);

      tile.style.setProperty(
        "--tilt",
        `${tilt}deg`
      );

    const image =
  document.createElement("img");

  image.src = photo.url;
  image.alt = "";

  const duration =
    8 + Math.random() * 8;

  image.style.animationDuration =
    `${duration}s`;

    tile.appendChild(image);

    mosaic.appendChild(tile);
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

    const photo =
      allPhotos[
        Math.floor(
          Math.random() *
          allPhotos.length
        )
      ];

    const tile =
      tiles[tileIndex];

    tile.classList.add("fade");

    setTimeout(() => {

      tile.querySelector("img").src =
        photo.url;

      tile.classList.remove("fade");

    }, 600);
  }
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

      initializeGrid();

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

  spotlightImage.src =
    photo.url;

  spotlightQuote.textContent =
    photo.quote;

  spotlight.classList.add(
    "is-active"
  );

  spotlightTimer =
    setTimeout(() => {

      spotlight.classList.remove(
        "is-active"
      );

    }, 5000);
}

loadSettings();
loadFeaturedPhotos();
startRandomRotation();
setInterval(() => {

  if (
    featuredPhotos.length <= 5
  ) {
    return;
  }

  featuredOffset++;

  initializeGrid();

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