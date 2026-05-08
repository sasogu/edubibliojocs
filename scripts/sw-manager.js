export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const swVersion = document.querySelector("#swVersion");

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "SW_VERSION") {
      setSwVersion(swVersion, event.data.version);
    }
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");
      requestSwVersion(registration, swVersion);
    } catch (error) {
      console.warn("No se pudo registrar el service worker", error);
    }
  });
}

export async function updateSwVersionFromSource() {
  const swVersion = document.querySelector("#swVersion");
  if (!swVersion) {
    return;
  }

  try {
    const response = await fetch("./sw.js", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const source = await response.text();
    const match = source.match(/CACHE_NAME\s*=\s*["']([^"']+)["']/);
    if (match?.[1]) {
      setSwVersion(swVersion, match[1]);
    }
  } catch (error) {
    console.warn("No se pudo leer la version del service worker", error);
  }
}

function requestSwVersion(registration, swVersion) {
  const worker = registration.active || registration.waiting || registration.installing || navigator.serviceWorker.controller;
  if (worker) {
    worker.postMessage({ type: "GET_SW_VERSION" });
  }
}

function setSwVersion(swVersion, version) {
  if (!swVersion || !version) {
    return;
  }

  swVersion.textContent = `SW ${version}`;
}
