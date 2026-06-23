const path = require("path");
const express = require("express");
const http = require("http");
const helmet = require("helmet");
const cors = require("cors");
const multer = require("multer");
const { randomUUID } = require("crypto");
const { Server } = require("socket.io");
const { getRandomQuote, quotes } = require("./data/quotes");
const {
  addPhoto,
  deletePhoto,
  ensureStorage,
  getAllPhotoStats,
  getPhotoStats,
  uploadsDir
} = require("./services/photoStore");

const {
  getSettings,
  saveSettings
} = require("./services/settingsStore");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = Number(process.env.PORT || 3000);
const MAX_VISIBLE_PHOTOS = Number(process.env.MAX_VISIBLE_PHOTOS || 30);
const MAX_STORED_PHOTOS = Number(process.env.MAX_STORED_PHOTOS || 200);
const UPLOAD_MAX_MB = Number(process.env.UPLOAD_MAX_MB || 8);
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "mural2026";
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const adminSessions = new Map();

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    callback(null, `${Date.now()}-${randomUUID()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: UPLOAD_MAX_MB * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new Error("Solo se permiten archivos de imagen."));
    }

    callback(null, true);
  }
});

app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));
app.use("/mobile", express.static(path.join(__dirname, "..", "public", "mobile")));
app.use("/mural", express.static(path.join(__dirname, "..", "public", "mural")));
app.use("/admin", express.static(path.join(__dirname, "..", "public", "admin")));

app.get("/", (_req, res) => {
  res.redirect("/mural");
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    visibleLimit: MAX_VISIBLE_PHOTOS,
    storedLimit: MAX_STORED_PHOTOS
  });
});

app.get("/api/settings", async (_req, res, next) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

app.get("/api/quotes", (_req, res) => {
  res.json({ quotes });
});

app.get("/api/photos", async (_req, res, next) => {
  try {
    const { photos, totalCount } = await getPhotoStats(MAX_VISIBLE_PHOTOS);
    res.json({ photos, totalCount, limit: MAX_VISIBLE_PHOTOS });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USER || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Usuario o password incorrecto." });
  }

  const sessionId = randomUUID();
  adminSessions.set(sessionId, {
    username,
    expiresAt: Date.now() + ADMIN_SESSION_TTL_MS
  });

  res.setHeader("Set-Cookie", buildAdminCookie(sessionId));
  res.json({ ok: true, username });
});

app.post("/api/admin/logout", requireAdminSession, (req, res) => {
  adminSessions.delete(req.adminSessionId);
  res.setHeader("Set-Cookie", "admin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
  res.json({ ok: true });
});

app.get("/api/admin/me", requireAdminSession, (req, res) => {
  res.json({ username: req.adminSession.username });
});

app.put(
  "/api/admin/settings",
  requireAdminSession,
  async (req, res, next) => {
    try {
      const settings = await saveSettings(req.body);

      io.emit("settings:update", settings);

      res.json(settings);
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/admin/photos", requireAdminSession, async (_req, res, next) => {
  try {
    const { photos, totalCount } = await getAllPhotoStats();
    res.json({ photos, totalCount, visibleLimit: MAX_VISIBLE_PHOTOS });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/photos", requireAdminSession, upload.single("photo"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se recibio ninguna imagen." });
    }

    const photo = await createPhotoRecord(req.file, req.body.quote);
    const { photos, totalCount } = await addPhoto(photo, MAX_STORED_PHOTOS);
    const visiblePhotos = photos.slice(0, MAX_VISIBLE_PHOTOS);
    const removedFromMural = photos.slice(MAX_VISIBLE_PHOTOS).map((item) => item.id);

    io.emit("photo:new", {
      photo,
      visiblePhotos,
      totalCount,
      removedIds: removedFromMural
    });

    res.status(201).json({
      message: "Foto agregada desde el panel admin.",
      photo
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/photos", upload.single("photo"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se recibio ninguna imagen." });
    }

    const photo = await createPhotoRecord(req.file);
    const { photos, totalCount } = await addPhoto(photo, MAX_STORED_PHOTOS);
    const visiblePhotos = photos.slice(0, MAX_VISIBLE_PHOTOS);
    const removedFromMural = photos.slice(MAX_VISIBLE_PHOTOS).map((item) => item.id);

    io.emit("photo:new", {
      photo,
      visiblePhotos,
      totalCount,
      removedIds: removedFromMural
    });

    res.status(201).json({
      message: "Foto agregada al mural.",
      photo
    });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/photos/:id", requireAdminSession, async (req, res, next) => {
  try {
    const deletedPhoto = await deletePhoto(req.params.id);

    if (!deletedPhoto) {
      return res.status(404).json({ message: "No se encontro la foto solicitada." });
    }

    const { photos, totalCount } = await getPhotoStats(MAX_VISIBLE_PHOTOS);
    io.emit("photos:refresh", {
      photos,
      totalCount,
      limit: MAX_VISIBLE_PHOTOS,
      reason: "admin-delete"
    });

    res.json({
      message: "Foto eliminada correctamente.",
      photo: deletedPhoto
    });
  } catch (error) {
    next(error);
  }
});

io.on("connection", async (socket) => {
  try {
    const { photos, totalCount } = await getPhotoStats(MAX_VISIBLE_PHOTOS);
    socket.emit("photos:init", {
      photos,
      totalCount,
      limit: MAX_VISIBLE_PHOTOS
    });
  } catch (error) {
    socket.emit("photos:error", {
      message: "No se pudo cargar el mural inicial."
    });
  }
});

app.use((error, _req, res, _next) => {
  const message = error.message || "Error interno del servidor.";
  const statusCode = message.includes("Solo se permiten") ? 400 : 500;

  console.error("[mural]", error);
  res.status(statusCode).json({ message });
});

function createPhotoRecord(file, customQuote = "") {
  const quote = String(customQuote || "").trim() || getRandomQuote();

  return {
    id: randomUUID(),
    filename: file.filename,
    url: `/uploads/${file.filename}`,
    quote,
    createdAt: new Date().toISOString()
  };
}

function requireAdminSession(req, res, next) {
  clearExpiredAdminSessions();

  const cookies = parseCookies(req);
  const sessionId = cookies.admin_session;
  const session = adminSessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ message: "Debes iniciar sesion." });
  }

  req.adminSessionId = sessionId;
  req.adminSession = session;
  next();
}

function parseCookies(req) {
  const header = req.headers.cookie || "";

  return header.split(";").reduce((cookies, pair) => {
    const [rawKey, ...rawValue] = pair.trim().split("=");
    if (!rawKey) return cookies;

    cookies[rawKey] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}

function buildAdminCookie(sessionId) {
  const maxAge = Math.floor(ADMIN_SESSION_TTL_MS / 1000);
  return `admin_session=${encodeURIComponent(sessionId)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

function clearExpiredAdminSessions() {
  const now = Date.now();

  for (const [sessionId, session] of adminSessions.entries()) {
    if (session.expiresAt <= now) {
      adminSessions.delete(sessionId);
    }
  }
}

ensureStorage()
  .then(() => {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Mural listo en http://localhost:${PORT}/mural`);
      console.log(`Cliente movil listo en http://localhost:${PORT}/mobile`);
      console.log(`Panel admin listo en http://localhost:${PORT}/admin`);
    });
  })
  .catch((error) => {
    console.error("No se pudo preparar el almacenamiento local.", error);
    process.exit(1);
  });
