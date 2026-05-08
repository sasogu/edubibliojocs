const RUFFLE_CDN = "https://unpkg.com/@ruffle-rs/ruffle";

const flashDialog = document.querySelector("#flashDialog");
const flashClose = document.querySelector("#flashClose");
const flashFullscreen = document.querySelector("#flashFullscreen");
const flashContainer = document.querySelector("#flashContainer");
const flashTitle = document.querySelector("#flashTitle");
let activeFlashPlayer = null;

flashClose.addEventListener("click", closeFlashDialog);
flashDialog.addEventListener("click", (e) => {
  if (e.target === flashDialog) closeFlashDialog();
});
document.addEventListener("keydown", handleFlashShortcuts);
if (flashFullscreen) {
  flashFullscreen.addEventListener("click", toggleFlashFullscreen);
}

export async function openFlashDialog(url, title) {
  flashTitle.textContent = title;
  flashContainer.innerHTML = "";
  flashDialog.showModal();

  try {
    const ruffle = await loadRuffle();
    const flashUrl = await resolveFlashUrl(url);
    const player = ruffle.createPlayer();
    player.style.width = "100%";
    player.style.height = "100%";
    flashContainer.appendChild(player);
    activeFlashPlayer = player;
    player.addEventListener("dblclick", toggleFlashFullscreen);
    await player.load({ url: flashUrl });
  } catch (error) {
    console.error("No se pudo cargar la actividad Flash", error);
    activeFlashPlayer = null;
    flashContainer.innerHTML = "";
    flashContainer.appendChild(createFlashError(url));
  }
}

export function closeFlashDialog() {
  if (document.fullscreenElement === activeFlashPlayer) {
    document.exitFullscreen().catch(() => {
      // Ignoramos errores al salir de fullscreen para no bloquear el cierre.
    });
  }
  flashDialog.close();
  flashContainer.innerHTML = "";
  activeFlashPlayer = null;
}

function handleFlashShortcuts(event) {
  if (!flashDialog.open) {
    return;
  }

  if (event.key.toLowerCase() === "f" && !event.ctrlKey && !event.altKey && !event.metaKey) {
    event.preventDefault();
    toggleFlashFullscreen();
  }
}

async function toggleFlashFullscreen() {
  if (!activeFlashPlayer || !document.fullscreenEnabled) {
    return;
  }

  if (document.fullscreenElement === activeFlashPlayer) {
    await document.exitFullscreen();
    return;
  }

  await activeFlashPlayer.requestFullscreen();
}

async function loadRuffle() {
  if (window.RufflePlayer) return window.RufflePlayer.newest();
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = RUFFLE_CDN;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return window.RufflePlayer.newest();
}

async function resolveFlashUrl(url) {
  const localCandidate = localFlashCandidate(url);
  if (!localCandidate) {
    return url;
  }

  try {
    const response = await fetch(localCandidate, {
      method: "HEAD",
      cache: "no-store"
    });
    if (response.ok) {
      return localCandidate;
    }
  } catch {
    // Si no existe en local o falla la consulta, seguimos con URL remota.
  }

  return url;
}

function localFlashCandidate(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname || "";
    if (parsed.hostname !== "edutictac.es" || !path.startsWith("/inici/flash/") || !path.toLowerCase().endsWith(".swf")) {
      return null;
    }

    const fileName = path.split("/").pop();
    if (!fileName) {
      return null;
    }

    return `./assets/flash/${fileName}`;
  } catch {
    return null;
  }
}

function createFlashError(url) {
  const wrapper = document.createElement("div");
  wrapper.className = "flash-error";

  const message = document.createElement("p");
  message.textContent = "No se pudo cargar esta actividad Flash.";

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  link.textContent = "Abrir archivo original";

  wrapper.append(message, link);
  return wrapper;
}
