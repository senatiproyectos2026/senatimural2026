const fs = require("fs/promises");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
const uploadsDir = path.join(__dirname, "..", "..", "public", "uploads");
const photosFile = path.join(dataDir, "photos.json");
const statsFile = path.join(dataDir, "stats.json");

async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadsDir, { recursive: true });

  try {
    await fs.access(photosFile);
  } catch {
    await fs.writeFile(photosFile, "[]", "utf8");
  }

  try {
    await fs.access(statsFile);
  } catch {
    const rawPhotos = await fs.readFile(photosFile, "utf8");
    const photos = JSON.parse(rawPhotos);
    await writeStats({ totalUploads: photos.length });
  }
}

async function readPhotos() {
  await ensureStorage();
  const raw = await fs.readFile(photosFile, "utf8");
  return JSON.parse(raw);
}

async function writePhotos(photos) {
  await ensureStorage();
  await fs.writeFile(photosFile, JSON.stringify(photos, null, 2), "utf8");
}

async function readStats() {
  const raw = await fs.readFile(statsFile, "utf8");
  return JSON.parse(raw);
}

async function writeStats(stats) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(statsFile, JSON.stringify(stats, null, 2), "utf8");
}

async function addPhoto(photo, maxStoredPhotos) {
  const photos = await readPhotos();
  const stats = await readStats();
  const nextPhotos = [photo, ...photos];
  const removed = nextPhotos.splice(maxStoredPhotos);
  const currentTotal = Math.max(Number(stats.totalUploads || 0), photos.length);
  const nextStats = {
    totalUploads: currentTotal + 1
  };

  await writePhotos(nextPhotos);
  await writeStats(nextStats);
  await removeUploadFiles(removed);

  return {
    photos: nextPhotos,
    totalCount: nextStats.totalUploads,
    removed
  };
}

async function getAllPhotoStats() {
  const photos = await readPhotos();
  const stats = await readStats();

  return {
    photos,
    totalCount: photos.length
  };
}

async function getPhotoStats(limit) {
  const photos = await readPhotos();
  const stats = await readStats();

  return {
    photos: photos.slice(0, limit),
    totalCount: photos.length
  };
}

async function deletePhoto(photoId) {
  const photos = await readPhotos();
  const photo = photos.find((item) => item.id === photoId);

  if (!photo) {
    return null;
  }

  const nextPhotos = photos.filter((item) => item.id !== photoId);
  await writePhotos(nextPhotos);
  await removeUploadFiles([photo]);

  return photo;
}

async function removeUploadFiles(photos) {
  await Promise.all(
    photos.map(async (photo) => {
      if (!photo.filename) return;

      const absolutePath = path.join(uploadsDir, photo.filename);
      try {
        await fs.unlink(absolutePath);
      } catch {
        // El archivo pudo haber sido limpiado manualmente; no bloqueamos el mural.
      }
    })
  );
}

module.exports = {
  addPhoto,
  deletePhoto,
  ensureStorage,
  getAllPhotoStats,
  getPhotoStats,
  uploadsDir
};
