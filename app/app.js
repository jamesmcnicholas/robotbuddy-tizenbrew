const STORAGE_KEYS = {
  baseUrl: "robotbuddy.tv.base_url",
  readToken: "robotbuddy.tv.read_token",
};

const DEFAULT_BASE_URL = "http://192.168.1.180:8787";
const DEFAULT_READ_TOKEN = "";
const POLL_INTERVAL_MS = 5000;
const RECONNECT_DELAY_MS = 3000;

const faceTemplates = {
  happy: {
    eyes: `
      <path class="face-stroke" d="M108 150 C120 130 142 130 152 150"></path>
      <path class="face-stroke" d="M168 150 C178 130 200 130 212 150"></path>
    `,
    accent: ``,
  },
  open: {
    eyes: `
      <ellipse class="face-fill" cx="130" cy="145" rx="11" ry="16"></ellipse>
      <ellipse class="face-fill" cx="190" cy="145" rx="11" ry="16"></ellipse>
    `,
    accent: ``,
  },
  neutral: {
    eyes: `
      <path class="face-stroke" d="M110 148 C121 154 141 154 150 144"></path>
      <path class="face-stroke" d="M170 144 C179 154 199 154 210 148"></path>
    `,
    accent: ``,
  },
  wink: {
    eyes: `
      <path class="face-stroke" d="M108 150 H148"></path>
      <path class="face-stroke" d="M168 150 C178 130 200 130 212 150"></path>
    `,
    accent: ``,
  },
  mixed: {
    eyes: `
      <ellipse class="face-fill" cx="130" cy="145" rx="11" ry="16"></ellipse>
      <path class="face-stroke" d="M170 144 C179 154 199 154 210 148"></path>
    `,
    accent: ``,
  },
  sleepy: {
    eyes: `
      <path class="face-stroke" d="M108 154 C120 160 140 160 150 148"></path>
      <path class="face-stroke" d="M170 148 C180 160 200 160 212 154"></path>
    `,
    accent: `
      <text class="accent-text" x="200" y="112">zZ</text>
    `,
  },
  sad: {
    eyes: `
      <path class="face-stroke" d="M112 146 L150 156"></path>
      <path class="face-stroke" d="M170 156 L208 146"></path>
    `,
    accent: ``,
  },
  confused: {
    eyes: `
      <ellipse class="face-fill" cx="130" cy="145" rx="11" ry="16"></ellipse>
      <path class="face-stroke" d="M170 144 C179 154 199 154 210 148"></path>
    `,
    accent: `
      <text class="accent-text" x="196" y="188">?</text>
    `,
  },
  determined: {
    eyes: `
      <path class="face-stroke" d="M112 138 L150 150"></path>
      <path class="face-stroke" d="M170 150 L208 138"></path>
    `,
    accent: ``,
  },
  blink: {
    eyes: `
      <path class="face-stroke" d="M108 150 H148"></path>
      <path class="face-stroke" d="M172 150 H212"></path>
    `,
    accent: ``,
  },
  music: {
    eyes: `
      <path class="face-stroke" d="M108 156 C120 136 142 136 152 156"></path>
      <path class="face-stroke" d="M168 156 C178 136 200 136 212 156"></path>
    `,
    accent: `
      <text class="accent-text" x="88" y="110">♫</text>
      <text class="accent-text" x="206" y="194">♪</text>
    `,
  },
  printing: {
    eyes: `
      <rect class="face-fill" x="116" y="138" width="30" height="14" rx="7"></rect>
      <rect class="face-fill" x="174" y="138" width="30" height="14" rx="7"></rect>
      <rect x="121" y="136" width="20" height="4" rx="2" fill="#f8efc4"></rect>
      <rect x="179" y="136" width="20" height="4" rx="2" fill="#f8efc4"></rect>
    `,
    accent: `
      <text class="accent-mini" x="160" y="206" text-anchor="middle" data-print-label>0%</text>
    `,
  },
};

const els = {
  accentLayer: document.querySelector("#accentLayer"),
  baseUrlInput: document.querySelector("#baseUrlInput"),
  closeSettings: document.querySelector("#closeSettings"),
  clearConfig: document.querySelector("#clearConfig"),
  connectionSummary: document.querySelector("#connectionSummary"),
  eyesLayer: document.querySelector("#eyesLayer"),
  faceValue: document.querySelector("#faceValue"),
  modeValue: document.querySelector("#modeValue"),
  printingValue: document.querySelector("#printingValue"),
  priorityValue: document.querySelector("#priorityValue"),
  serverPill: document.querySelector("#serverPill"),
  saveSettings: document.querySelector("#saveSettings"),
  settingsDrawer: document.querySelector("#settingsDrawer"),
  settingsForm: document.querySelector("#settingsForm"),
  settingsToggle: document.querySelector("#settingsToggle"),
  sourceValue: document.querySelector("#sourceValue"),
  transportPill: document.querySelector("#transportPill"),
  readTokenInput: document.querySelector("#readTokenInput"),
  updatedValue: document.querySelector("#updatedValue"),
};

const runtime = {
  baseUrl: "",
  eventSource: null,
  pollTimer: null,
  reconnectTimer: null,
  readToken: "",
};

function loadConfig() {
  const storedBaseUrl = localStorage.getItem(STORAGE_KEYS.baseUrl);
  const storedReadToken = localStorage.getItem(STORAGE_KEYS.readToken);
  const normalizedStoredBaseUrl = normalizeBaseUrl(
    storedBaseUrl !== null ? storedBaseUrl : DEFAULT_BASE_URL,
  );
  runtime.baseUrl = normalizedStoredBaseUrl || DEFAULT_BASE_URL;
  runtime.readToken = storedReadToken !== null ? storedReadToken : DEFAULT_READ_TOKEN;
}

function saveConfig(baseUrl, readToken) {
  runtime.baseUrl = normalizeBaseUrl(baseUrl);
  runtime.readToken = readToken.trim();
  localStorage.setItem(STORAGE_KEYS.baseUrl, runtime.baseUrl);
  localStorage.setItem(STORAGE_KEYS.readToken, runtime.readToken);
}

function clearConfig() {
  localStorage.removeItem(STORAGE_KEYS.baseUrl);
  localStorage.removeItem(STORAGE_KEYS.readToken);
  runtime.baseUrl = normalizeBaseUrl(DEFAULT_BASE_URL);
  runtime.readToken = DEFAULT_READ_TOKEN;
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function buildApiUrl(path) {
  return `${runtime.baseUrl}${path}`;
}

function createHeaders() {
  if (!runtime.readToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${runtime.readToken}`,
  };
}

function disconnect() {
  if (runtime.eventSource) {
    runtime.eventSource.close();
    runtime.eventSource = null;
  }

  if (runtime.pollTimer) {
    window.clearInterval(runtime.pollTimer);
    runtime.pollTimer = null;
  }

  if (runtime.reconnectTimer) {
    window.clearTimeout(runtime.reconnectTimer);
    runtime.reconnectTimer = null;
  }
}

function setTransport(label, tone) {
  els.transportPill.textContent = label;
  els.transportPill.className = "status-pill";
  if (tone) {
    els.transportPill.classList.add(tone);
  }
}

function setServerStatus(label) {
  els.serverPill.textContent = label;
}

function setConnectionSummary(message) {
  els.connectionSummary.textContent = message;
}

function isSettingsOpen() {
  return els.settingsDrawer.classList.contains("is-open");
}

function isTextInput(element) {
  return element instanceof HTMLInputElement;
}

function getFocusableElements() {
  if (isSettingsOpen()) {
    return [
      els.closeSettings,
      els.baseUrlInput,
      els.readTokenInput,
      els.saveSettings,
      els.clearConfig,
    ];
  }

  return [els.settingsToggle];
}

function focusElement(element, options) {
  const resolvedOptions = options || {};
  if (!element || typeof element.focus !== "function") {
    return;
  }

  element.focus();
  if (resolvedOptions.select && isTextInput(element)) {
    element.select();
  }
}

function focusFirstAvailableElement() {
  const [firstElement] = getFocusableElements();
  focusElement(firstElement, { select: isTextInput(firstElement) });
}

function moveFocusBy(offset) {
  const focusableElements = getFocusableElements();
  if (focusableElements.length === 0) {
    return;
  }

  const activeElement = document.activeElement;
  const activeIndex = focusableElements.findIndex((element) => element === activeElement);
  const currentIndex = activeIndex >= 0 ? activeIndex : 0;
  const nextIndex =
    (currentIndex + offset + focusableElements.length) % focusableElements.length;
  const nextElement = focusableElements[nextIndex];
  focusElement(nextElement, { select: isTextInput(nextElement) });
}

function activateFocusedElement() {
  const activeElement = document.activeElement;
  if (!activeElement) {
    focusFirstAvailableElement();
    return;
  }

  if (isTextInput(activeElement)) {
    focusElement(activeElement, { select: true });
    return;
  }

  if (activeElement instanceof HTMLButtonElement) {
    activeElement.click();
  }
}

function isBackKey(event) {
  return (
    event.key === "Escape" ||
    event.key === "Backspace" ||
    event.key === "BrowserBack" ||
    event.key === "GoBack" ||
    event.key === "XF86Back" ||
    event.keyCode === 10009
  );
}

function openSettings() {
  els.settingsDrawer.classList.add("is-open");
  window.requestAnimationFrame(() => {
    focusElement(els.baseUrlInput, { select: true });
  });
}

function closeSettings() {
  els.settingsDrawer.classList.remove("is-open");
  focusElement(els.settingsToggle);
}

function scheduleReconnect() {
  if (runtime.readToken || runtime.reconnectTimer) {
    return;
  }

  runtime.reconnectTimer = window.setTimeout(() => {
    runtime.reconnectTimer = null;
    connect();
  }, RECONNECT_DELAY_MS);
}

function setPrintingProgress(progress) {
  const normalized = Number.isFinite(progress)
    ? Math.max(0, Math.min(100, Math.round(progress)))
    : 0;
  const label = document.querySelector("[data-print-label]");
  if (label) {
    label.textContent = `${normalized}%`;
  }
}

function resetSnapshotDisplay() {
  els.faceValue.textContent = "happy";
  els.modeValue.textContent = "idle";
  els.sourceValue.textContent = "system";
  els.priorityValue.textContent = "low";
  els.printingValue.textContent = "inactive";
  els.updatedValue.textContent = "waiting for snapshot";
}

function renderFace(snapshot) {
  const face = snapshot && snapshot.face ? snapshot.face : "happy";
  const template = faceTemplates[face] || faceTemplates.happy;
  document.body.className = `face-${face}`;
  els.eyesLayer.innerHTML = template.eyes;
  els.accentLayer.innerHTML = template.accent;

  if (face === "printing") {
    setPrintingProgress(
      snapshot && snapshot.printing ? snapshot.printing.progress : undefined,
    );
  }
}

function applySnapshot(snapshot) {
  const printing = snapshot && snapshot.printing ? snapshot.printing : null;
  const updated = new Date();
  els.faceValue.textContent = snapshot.face;
  els.modeValue.textContent = snapshot.mode;
  els.sourceValue.textContent = snapshot.source;
  els.priorityValue.textContent = snapshot.priority;
  els.printingValue.textContent = printing
    ? `${formatMaybeNumber(printing.progress)}${printing.status ? ` ${printing.status}` : ""}${printing.project ? ` - ${printing.project}` : ""}`
    : "inactive";
  els.updatedValue.textContent = updated.toLocaleTimeString();
  renderFace(snapshot);
}

function formatMaybeNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
  }

  return "--";
}

function fetchSnapshot() {
  return fetch(buildApiUrl("/api/state"), {
    cache: "no-store",
    headers: createHeaders(),
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Buddy returned HTTP ${response.status}.`);
    }

    return response.json().then((snapshot) => {
      applySnapshot(snapshot);
      return snapshot;
    });
  });
}

function startPolling() {
  setTransport("polling", "transport-polling");
  setServerStatus(runtime.baseUrl);
  setConnectionSummary("Authenticated polling is active.");

  const tick = () => {
    fetchSnapshot().catch((error) => {
      const message = error instanceof Error ? error.message : "Polling failed.";
      setTransport("polling error", "transport-error");
      setConnectionSummary(message);
    });
  };

  tick();
  runtime.pollTimer = window.setInterval(() => {
    tick();
  }, POLL_INTERVAL_MS);
}

function startEventStream() {
  const stream = new EventSource(buildApiUrl("/api/events/stream"));
  runtime.eventSource = stream;

  stream.addEventListener("open", () => {
    setTransport("live stream", "transport-live");
    setServerStatus(runtime.baseUrl);
    setConnectionSummary("Live updates connected.");
  });

  stream.addEventListener("snapshot", (event) => {
    try {
      applySnapshot(JSON.parse(event.data));
    } catch (_error) {
      setConnectionSummary("Received an invalid snapshot event.");
    }
  });

  stream.addEventListener("error", () => {
    setTransport("reconnecting", "transport-error");
    setConnectionSummary("Live stream interrupted. Retrying shortly.");
    stream.close();
    runtime.eventSource = null;
    scheduleReconnect();
  });
}

function connect() {
  disconnect();

  if (!runtime.baseUrl) {
    setTransport("idle", "");
    setServerStatus("not configured");
    setConnectionSummary("No server configured yet.");
    openSettings();
    return Promise.resolve();
  }

  els.baseUrlInput.value = runtime.baseUrl;
  els.readTokenInput.value = runtime.readToken;
  setTransport("connecting", "");
  setServerStatus(runtime.baseUrl);
  setConnectionSummary("Connecting to Buddy.");

  return fetchSnapshot()
    .then(() => {
      if (runtime.readToken) {
        startPolling();
        return;
      }

      if ("EventSource" in window) {
        startEventStream();
        return;
      }

      startPolling();
    })
    .catch((error) => {
      const message =
        error instanceof Error ? error.message : "Unable to reach Buddy.";
      setTransport("offline", "transport-error");
      setConnectionSummary(message);
      openSettings();
    });
}

function bindSettings() {
  els.settingsToggle.addEventListener("click", () => {
    openSettings();
  });

  els.closeSettings.addEventListener("click", () => {
    closeSettings();
  });

  els.clearConfig.addEventListener("click", () => {
    disconnect();
    clearConfig();
    els.baseUrlInput.value = runtime.baseUrl;
    els.readTokenInput.value = runtime.readToken;
    setTransport("connecting", "");
    setServerStatus(runtime.baseUrl);
    setConnectionSummary("Restored bundled Buddy connection.");
    resetSnapshotDisplay();
    renderFace({ face: "happy", printing: null });
    connect();
  });

  els.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveConfig(els.baseUrlInput.value, els.readTokenInput.value);
    closeSettings();
    connect();
  });

  document.addEventListener("keydown", (event) => {
    const key = event.key || "";
    const activeElement = document.activeElement;
    const editingTextInput = isTextInput(activeElement);

    if (isBackKey(event)) {
      if (isSettingsOpen()) {
        event.preventDefault();
        closeSettings();
      }
      return;
    }

    if (editingTextInput) {
      return;
    }

    if (
      key === "ArrowLeft" ||
      key === "ArrowUp" ||
      key === "ArrowRight" ||
      key === "ArrowDown"
    ) {
      event.preventDefault();
      moveFocusBy(key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1);
      return;
    }

    if (key === "Enter" || key === "NumpadEnter") {
      event.preventDefault();
      activateFocusedElement();
      return;
    }

    if (key.toLowerCase() === "s") {
      event.preventDefault();
      if (isSettingsOpen()) {
        closeSettings();
      } else {
        openSettings();
      }
    }
  });
}

function init() {
  loadConfig();
  els.baseUrlInput.value = runtime.baseUrl;
  els.readTokenInput.value = runtime.readToken;
  bindSettings();
  resetSnapshotDisplay();
  renderFace({ face: "happy", printing: null });
  focusElement(els.settingsToggle);
  connect();
}

init();
