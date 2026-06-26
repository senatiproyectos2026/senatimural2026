const fs = require("fs/promises");
const path = require("path");

const dataDir =
  path.join(
    __dirname,
    "..",
    "..",
    "data"
  );

const uploadsDir =
  path.join(
    __dirname,
    "..",
    "..",
    "public",
    "uploads"
  );

const featuredPhotosFile =
  path.join(
    dataDir,
    "featuredPhotos.json"
  );

async function ensureStorage() {

  await fs.mkdir(
    dataDir,
    { recursive: true }
  );

  try {
    await fs.access(
      featuredPhotosFile
    );
  } catch {

    await fs.writeFile(
      featuredPhotosFile,
      "[]",
      "utf8"
    );
  }
}

async function readPhotos() {

  await ensureStorage();

  const raw =
    await fs.readFile(
      featuredPhotosFile,
      "utf8"
    );

  return JSON.parse(raw);
}

async function writePhotos(photos) {

  await fs.writeFile(
    featuredPhotosFile,
    JSON.stringify(
      photos,
      null,
      2
    ),
    "utf8"
  );
}

async function addPhoto(photo) {

  const photos =
    await readPhotos();

  const nextPhotos =
    [photo, ...photos];

  await writePhotos(
    nextPhotos
  );

  return nextPhotos;
}

async function getAllPhotos() {

  return readPhotos();
}

async function deletePhoto(photoId) {

  const photos =
    await readPhotos();

  const photo =
    photos.find(
      p => p.id === photoId
    );

  if (!photo) {
    return null;
  }

  const nextPhotos =
    photos.filter(
      p => p.id !== photoId
    );

  await writePhotos(
    nextPhotos
  );

  return photo;
}

module.exports = {
  addPhoto,
  getAllPhotos,
  deletePhoto,
  ensureStorage
};