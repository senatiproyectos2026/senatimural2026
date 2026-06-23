const photoGrid = document.querySelector("#photoGrid");
const template = document.querySelector("#photoCardTemplate");
const loginPanel = document.querySelector("#loginPanel");
const adminPanel = document.querySelector("#adminPanel");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const usernameInput = document.querySelector("#usernameInput");
const passwordInput = document.querySelector("#passwordInput");
const logoutButton = document.querySelector("#logoutButton");
const uploadForm = document.querySelector("#uploadForm");
const adminPhotoInput = document.querySelector("#adminPhotoInput");
const adminQuoteInput = document.querySelector("#adminQuoteInput");
const uploadButton = document.querySelector("#uploadButton");
const searchInput = document.querySelector("#searchInput");
const refreshButton = document.querySelector("#refreshButton");
const visibleCount = document.querySelector("#visibleCount");
const totalCount = document.querySelector("#totalCount");
const statusMessage = document.querySelector("#statusMessage");

const mainPhraseInput = document.querySelector("#mainPhraseInput");
const themeColorInput = document.querySelector("#themeColorInput");
const saveSettingsButton = document.querySelector("#saveSettingsButton");

const backgroundInput = document.querySelector("#backgroundInput");

let photos = [];

function showLogin() {
  loginPanel.classList.remove("is-hidden");
  adminPanel.classList.add("is-hidden");
}

function showAdmin() {
  loginPanel.classList.add("is-hidden");
  adminPanel.classList.remove("is-hidden");
}

function setStatus(message = "") {
  statusMessage.textContent = message;
}

function setLoginMessage(message = "") {
  loginMessage.textContent = message;
}

async function checkSession() {
  const response = await fetch("/api/admin/me");
  if (!response.ok) {
    showLogin();
    return;
  }

  showAdmin();
  await loadPhotos();
}

async function login(event) {
  event.preventDefault();

  try {
    setLoginMessage("Ingresando...");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        password: passwordInput.value
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "No se pudo iniciar sesion.");
    }

    passwordInput.value = "";
    setLoginMessage("");
    showAdmin();
    await loadPhotos();
  } catch (error) {
    setLoginMessage(error.message);
  }
}

async function logout() {
  await fetch("/api/admin/logout", { method: "POST" });
  photos = [];
  renderPhotos();
  showLogin();
}

async function loadPhotos() {
  try {
    setStatus("Cargando...");

    const response = await fetch("/api/admin/photos");

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "No se pudo cargar el panel.");
    }

    const data = await response.json();
    photos = data.photos || [];
    visibleCount.textContent = String(photos.length);
    totalCount.textContent = String(data.totalCount || photos.length);
    renderPhotos();
    await loadSettings();
    setStatus("Actualizado");
  } catch (error) {
    setStatus(error.message);
    if (error.message.includes("sesion")) {
      showLogin();
    }
  }
}

function renderPhotos() {
  const query = searchInput.value.trim().toLowerCase();
  const filteredPhotos = photos.filter((photo) => {
    const createdAt = formatDate(photo.createdAt).toLowerCase();
    return [photo.id, photo.quote, createdAt].some((value) => {
      return String(value || "").toLowerCase().includes(query);
    });
  });

  photoGrid.innerHTML = "";

  filteredPhotos.forEach((photo) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const image = card.querySelector("img");
    const quote = card.querySelector(".quote");
    const time = card.querySelector("time");
    const code = card.querySelector("code");
    const deleteButton = card.querySelector(".delete-button");

    image.src = photo.url;
    quote.textContent = photo.quote;
    time.textContent = formatDate(photo.createdAt);
    time.dateTime = photo.createdAt;
    code.textContent = photo.id;
    deleteButton.addEventListener("click", () => deletePhoto(photo, deleteButton));

    photoGrid.appendChild(card);
  });
}

async function deletePhoto(photo, button) {
  const confirmed = window.confirm("Eliminar esta foto del mural? Esta accion no se puede deshacer.");
  if (!confirmed) return;

  try {
    button.disabled = true;
    button.textContent = "Eliminando...";
    setStatus("Eliminando foto...");

    const response = await fetch(`/api/admin/photos/${photo.id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "No se pudo eliminar la foto.");
    }

    photos = photos.filter((item) => item.id !== photo.id);
    visibleCount.textContent = String(photos.length);
    renderPhotos();
    setStatus("Foto eliminada");
  } catch (error) {
    button.disabled = false;
    button.textContent = "Eliminar";
    setStatus(error.message);
  }
}

async function uploadPhoto(event) {
  event.preventDefault();

  const file = adminPhotoInput.files?.[0];
  if (!file) {
    setStatus("Selecciona una foto para subir.");
    return;
  }

  try {
    uploadButton.disabled = true;
    uploadButton.textContent = "Subiendo...";
    setStatus("Subiendo foto al mural...");

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("quote", adminQuoteInput.value.trim());

    const response = await fetch("/api/admin/photos", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "No se pudo subir la foto.");
    }

    uploadForm.reset();
    setStatus("Foto subida al mural");
    await loadPhotos();
  } catch (error) {
    setStatus(error.message);
  } finally {
    uploadButton.disabled = false;
    uploadButton.textContent = "Subir al mural";
  }
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

loginForm.addEventListener("submit", login);
logoutButton.addEventListener("click", logout);
uploadForm.addEventListener("submit", uploadPhoto);
refreshButton.addEventListener("click", loadPhotos);
searchInput.addEventListener("input", renderPhotos);
saveSettingsButton.addEventListener("click", saveSettings);

async function loadSettings() {
  try {
    const response = await fetch("/api/settings");

    if (!response.ok) {
      throw new Error("No se pudo cargar configuración.");
    }

    const settings = await response.json();

    mainPhraseInput.value = settings.mainPhrase || "";
    themeColorInput.value = settings.themeColor || "#E30613";

    window.currentBackground =
      settings.backgroundImage || "";

  } catch (error) {
    setStatus(error.message);
  }
}

async function saveSettings() {
  try {
    saveSettingsButton.disabled = true;
    saveSettingsButton.textContent = "Guardando...";

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mainPhrase: mainPhraseInput.value.trim(),
        themeColor: themeColorInput.value,
        backgroundImage: window.currentBackground || ""
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "No se pudo guardar.");
    }

    setStatus("Configuración guardada");
  } catch (error) {
    setStatus(error.message);
  } finally {
    saveSettingsButton.disabled = false;
    saveSettingsButton.textContent = "Guardar configuración";
  }
}

checkSession();
