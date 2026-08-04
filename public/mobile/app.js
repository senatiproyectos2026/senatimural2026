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
const frameImage = new Image();
frameImage.src = "/assets/frame.png";
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
let appSettings = {
  limitOnePhotoPerDevice: false
};

async function loadSettings() {
  try {
    const response =
      await fetch("/api/settings");

    if (!response.ok) {
      return;
    }
    appSettings =
      await response.json();
    if (hasAlreadyParticipated()) {
      setStatus(
        "Ya participaste. ¡Gracias por ser parte de los 60 años de SENATI!"
      );
      setStep(successStep);
      newPhotoButton.style.display =
        "none";
    }
  } catch (error) {
    console.error(error);
  }
}

function hasAlreadyParticipated() {

  if (
    !appSettings.limitOnePhotoPerDevice
  ) {
    return false;
  }

  return (
    localStorage.getItem(
      "senati60Participated"
    ) === "true"
  );

}
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

  const canvasWidth = cropCanvas.width;
  const canvasHeight = cropCanvas.height;

  const scale = Math.max(
    canvasWidth / state.image.width,
    canvasHeight / state.image.height
  ) * state.zoom;

  const width =
    state.image.width * scale;

  const height =
    state.image.height * scale;

  const x =
    (canvasWidth - width) / 2 +
    state.offsetX;

  const y =
    (canvasHeight - height) / 2 +
    state.offsetY;

  context.clearRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );

  context.fillStyle = "#191919";

  context.fillRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );

  context.drawImage(
    state.image,
    x,
    y,
    width,
    height
  );

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
function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + " " + words[i];
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }

  lines.push(currentLine);
  return lines;
}

function downloadSenatiPhoto() {
  if (!state.image) return;

  const outputCanvas =
    document.createElement("canvas");

  outputCanvas.width = 4525;
  outputCanvas.height = 6583;

  const ctx =
    outputCanvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(
    0,
    0,
    outputCanvas.width,
    outputCanvas.height
  );

  ctx.drawImage(
    cropCanvas,
    293,
    1106,
    3938,
    4687
  );
  ctx.drawImage(
    frameImage,
    0,
    0,
    outputCanvas.width,
    outputCanvas.height
  );

  // Contenedor de la frase institucional
  const boxWidth = 3938;
  const boxHeight = 380;
  const boxX = (outputCanvas.width - boxWidth) / 2;
  const boxY = 5998;
  const radius = 30;

  ctx.fillStyle = "#002c9e";
  ctx.beginPath();
  ctx.moveTo(boxX + radius, boxY);
  ctx.arcTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + boxHeight, radius);
  ctx.arcTo(boxX + boxWidth, boxY + boxHeight, boxX, boxY + boxHeight, radius);
  ctx.arcTo(boxX, boxY + boxHeight, boxX, boxY, radius);
  ctx.arcTo(boxX, boxY, boxX + boxWidth, boxY, radius);
  ctx.closePath();
  ctx.fill();

  // Frase institucional (fija)
  const lines = [
    "60 AÑOS FORMANDO LÍDERES PARA",
    "LA SOCIEDAD Y LA INDUSTRIA"
  ];

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 150px 'Poppins', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lineHeight = 170;
  const startY =
    boxY + boxHeight / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(
      line,
      outputCanvas.width / 2,
      startY + index * lineHeight
    );
  });

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

    setStatus(
      "Enviando foto..."
    );

    sendButton.disabled = true;

    downloadSenatiPhoto();

    const blob =
      await canvasToBlob();

    const formData =
      new FormData();

    formData.append(
      "photo",
      blob,
      "mural-foto.jpg"
    );

    const response =
      await fetch(
        "/api/photos",
        {
          method: "POST",
          body: formData
        }
      );

    if (!response.ok) {

      const error =
        await response
          .json()
          .catch(() => ({}));

      throw new Error(
        error.message ||
        "No se pudo enviar la foto."
      );

    }

    setStatus("");

    if (
      appSettings.limitOnePhotoPerDevice
    ) {

      localStorage.setItem(
        "senati60Participated",
        "true"
      );

    }

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

sendButton.addEventListener("click", uploadPhoto);

backButton.addEventListener("click", () => {
  photoInput.value = "";
  state.image = null;
  setStep(captureStep);
  setStatus("");
});

newPhotoButton.addEventListener("click", () => {
  if (
    appSettings.limitOnePhotoPerDevice
  ) {
    setStatus(
      "Ya participaste. Gracias por ser parte de los 60 años de SENATI."
    );
    return;
  }
  photoInput.value = "";
  state.image = null;
  setStep(captureStep);
  setStatus("");
});

loadSettings();