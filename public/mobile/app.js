const photoInput = document.querySelector("#photoInput");
const captureStep = document.querySelector("#captureStep");
const cropStep = document.querySelector("#cropStep");
const successStep = document.querySelector("#successStep");
const cropCanvas = document.querySelector("#cropCanvas");
const zoomRange = document.querySelector("#zoomRange");
const downloadButton = document.querySelector("#downloadButton");
const sendButton = document.querySelector("#sendButton");
const backButton = document.querySelector("#backButton");
const newPhotoButton = document.querySelector("#newPhotoButton");
const statusMessage = document.querySelector("#statusMessage");

const context = cropCanvas.getContext("2d");
const state = {
  image: null,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  lastX: 0,
  lastY: 0
};
const senatiQuotes = [
  "El futuro se construye con conocimiento",
  "Aprender hoy, liderar mañana",
  "La innovación empieza contigo",
  "Transformando talento en oportunidades",
  "60 años formando profesionales de excelencia",
  "La educación técnica impulsa el Perú",
  "Tu esfuerzo crea grandes oportunidades",
  "Preparados para los desafíos del futuro",
  "Construyendo un país con más talento",
  "La tecnología y el conocimiento transforman vidas"
];
function setStep(activeStep) {
  [captureStep, cropStep, successStep].forEach((step) => {
    step.classList.toggle("is-active", step === activeStep);
  });
}

function setStatus(message = "") {
  statusMessage.textContent = message;
}

function drawCrop() {
  if (!state.image) return;

  const size = cropCanvas.width;
  const imageRatio = state.image.width / state.image.height;
  const baseWidth = imageRatio > 1 ? size * imageRatio : size;
  const baseHeight = imageRatio > 1 ? size : size / imageRatio;
  const width = baseWidth * state.zoom;
  const height = baseHeight * state.zoom;
  const x = (size - width) / 2 + state.offsetX;
  const y = (size - height) / 2 + state.offsetY;

  context.clearRect(0, 0, size, size);
  context.fillStyle = "#191919";
  context.fillRect(0, 0, size, size);
  context.drawImage(state.image, x, y, width, height);
}

function loadImage(file) {
  const reader = new FileReader();

  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      state.image = image;
      state.zoom = 1;
      state.offsetX = 0;
      state.offsetY = 0;
      zoomRange.value = "1";
      drawCrop();
      setStep(cropStep);
      setStatus("");
    };
    image.src = reader.result;
  };

  reader.readAsDataURL(file);
}

function canvasPoint(event) {
  const rect = cropCanvas.getBoundingClientRect();
  const touch = event.touches?.[0] || event;

  return {
    x: ((touch.clientX - rect.left) / rect.width) * cropCanvas.width,
    y: ((touch.clientY - rect.top) / rect.height) * cropCanvas.height
  };
}

function startDrag(event) {
  if (!state.image) return;

  const point = canvasPoint(event);
  state.isDragging = true;
  state.lastX = point.x;
  state.lastY = point.y;
}

function moveDrag(event) {
  if (!state.isDragging) return;
  event.preventDefault();

  const point = canvasPoint(event);
  state.offsetX += point.x - state.lastX;
  state.offsetY += point.y - state.lastY;
  state.lastX = point.x;
  state.lastY = point.y;
  drawCrop();
}

function endDrag() {
  state.isDragging = false;
}

async function canvasToBlob() {
  return new Promise((resolve) => {
    cropCanvas.toBlob(resolve, "image/jpeg", 0.88);
  });
}

function downloadSenatiPhoto() {
  if (!state.image) return;

  const outputCanvas =
    document.createElement("canvas");

  outputCanvas.width = 1080;
  outputCanvas.height = 1080;

  const ctx =
    outputCanvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1080, 1080);

  ctx.drawImage(
    cropCanvas,
    0,
    0,
    1080,
    1080
  );

  ctx.lineWidth = 24;
  ctx.strokeStyle = "#003DA5";
  ctx.strokeRect(12, 12, 1056, 1056);

  ctx.fillStyle = "#E30613";
  ctx.fillRect(0, 0, 1080, 120);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";

  ctx.fillText(
    "SENATI 60 AÑOS",
    540,
    75
  );

  ctx.fillStyle = "#E30613";
  ctx.fillRect(0, 980, 1080, 100);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px Arial";

  const quote =
  senatiQuotes[
    Math.floor(
      Math.random() * senatiQuotes.length
    )
  ];

  ctx.fillText(
    quote,
    540,
    1040
  );

  ctx.font = "bold 28px Arial";

  ctx.fillText(
    "#SENATI60",
    540,
    1070
  );
  const link =
    document.createElement("a");

  link.download =
    "senati-60-aniversario.jpg";

  link.href =
    outputCanvas.toDataURL(
      "image/jpeg",
      0.95
    );

  link.click();
}

async function uploadPhoto() {
  if (!state.image) return;

  try {
    setStatus("Enviando foto...");
    sendButton.disabled = true;

    const blob = await canvasToBlob();
    const formData = new FormData();
    formData.append("photo", blob, "mural-foto.jpg");

    const response = await fetch("/api/photos", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "No se pudo enviar la foto.");
    }

    setStatus("");
    setStep(successStep);
  } catch (error) {
    setStatus(error.message);
  } finally {
    sendButton.disabled = false;
  }
}

photoInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setStatus("Selecciona un archivo de imagen valido.");
    return;
  }

  loadImage(file);
});

zoomRange.addEventListener("input", (event) => {
  state.zoom = Number(event.target.value);
  drawCrop();
});

cropCanvas.addEventListener("mousedown", startDrag);
cropCanvas.addEventListener("mousemove", moveDrag);
window.addEventListener("mouseup", endDrag);
cropCanvas.addEventListener("touchstart", startDrag, { passive: true });
cropCanvas.addEventListener("touchmove", moveDrag, { passive: false });
window.addEventListener("touchend", endDrag);

downloadButton.addEventListener(
  "click",
  downloadSenatiPhoto
);

sendButton.addEventListener("click", uploadPhoto);

backButton.addEventListener("click", () => {
  photoInput.value = "";
  state.image = null;
  setStep(captureStep);
  setStatus("");
});

newPhotoButton.addEventListener("click", () => {
  photoInput.value = "";
  state.image = null;
  setStep(captureStep);
  setStatus("");
});
