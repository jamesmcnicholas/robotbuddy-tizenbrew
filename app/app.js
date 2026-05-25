var APP_VERSION = "0.1.10";
var BASE_URL = "http://192.168.1.180:8787";
var POLL_INTERVAL_MS = 5000;
var REQUEST_TIMEOUT_MS = 4000;

var faceTemplates = {
  happy: {
    eyes:
      '<path class="face-stroke" d="M108 150 C120 130 142 130 152 150"></path>' +
      '<path class="face-stroke" d="M168 150 C178 130 200 130 212 150"></path>',
    accent: "",
  },
  open: {
    eyes:
      '<ellipse class="face-fill" cx="130" cy="145" rx="11" ry="16"></ellipse>' +
      '<ellipse class="face-fill" cx="190" cy="145" rx="11" ry="16"></ellipse>',
    accent: "",
  },
  neutral: {
    eyes:
      '<path class="face-stroke" d="M110 148 C121 154 141 154 150 144"></path>' +
      '<path class="face-stroke" d="M170 144 C179 154 199 154 210 148"></path>',
    accent: "",
  },
  wink: {
    eyes:
      '<path class="face-stroke" d="M108 150 H148"></path>' +
      '<path class="face-stroke" d="M168 150 C178 130 200 130 212 150"></path>',
    accent: "",
  },
  mixed: {
    eyes:
      '<ellipse class="face-fill" cx="130" cy="145" rx="11" ry="16"></ellipse>' +
      '<path class="face-stroke" d="M170 144 C179 154 199 154 210 148"></path>',
    accent: "",
  },
  sleepy: {
    eyes:
      '<path class="face-stroke" d="M108 154 C120 160 140 160 150 148"></path>' +
      '<path class="face-stroke" d="M170 148 C180 160 200 160 212 154"></path>',
    accent: '<text class="accent-text" x="200" y="112">zZ</text>',
  },
  sad: {
    eyes:
      '<path class="face-stroke" d="M112 146 L150 156"></path>' +
      '<path class="face-stroke" d="M170 156 L208 146"></path>',
    accent: "",
  },
  confused: {
    eyes:
      '<ellipse class="face-fill" cx="130" cy="145" rx="11" ry="16"></ellipse>' +
      '<path class="face-stroke" d="M170 144 C179 154 199 154 210 148"></path>',
    accent: '<text class="accent-text" x="196" y="188">?</text>',
  },
  determined: {
    eyes:
      '<path class="face-stroke" d="M112 138 L150 150"></path>' +
      '<path class="face-stroke" d="M170 150 L208 138"></path>',
    accent: "",
  },
  blink: {
    eyes:
      '<path class="face-stroke" d="M108 150 H148"></path>' +
      '<path class="face-stroke" d="M172 150 H212"></path>',
    accent: "",
  },
  music: {
    eyes:
      '<path class="face-stroke" d="M108 156 C120 136 142 136 152 156"></path>' +
      '<path class="face-stroke" d="M168 156 C178 136 200 136 212 156"></path>',
    accent:
      '<text class="accent-text" x="88" y="110">♫</text>' +
      '<text class="accent-text" x="206" y="194">♪</text>',
  },
  printing: {
    eyes:
      '<rect class="face-fill" x="116" y="138" width="30" height="14" rx="7"></rect>' +
      '<rect class="face-fill" x="174" y="138" width="30" height="14" rx="7"></rect>' +
      '<rect x="121" y="136" width="20" height="4" rx="2" fill="#f8efc4"></rect>' +
      '<rect x="179" y="136" width="20" height="4" rx="2" fill="#f8efc4"></rect>',
    accent:
      '<text class="accent-mini" x="160" y="206" text-anchor="middle" data-print-label>0%</text>',
  },
};

var els = {
  accentLayer: document.getElementById("accentLayer"),
  bootLog: document.getElementById("bootLog"),
  eyesLayer: document.getElementById("eyesLayer"),
  faceValue: document.getElementById("faceValue"),
  modeValue: document.getElementById("modeValue"),
  printingValue: document.getElementById("printingValue"),
  priorityValue: document.getElementById("priorityValue"),
  serverPill: document.getElementById("serverPill"),
  sourceValue: document.getElementById("sourceValue"),
  transportPill: document.getElementById("transportPill"),
  updatedValue: document.getElementById("updatedValue"),
  versionPill: document.getElementById("versionPill"),
};

var pollTimer = null;

function bootLog(message) {
  var line = String(message);

  if (window.__buddyBootLog) {
    window.__buddyBootLog(line);
    return;
  }

  if (!els.bootLog) {
    return;
  }

  if (
    !els.bootLog.textContent ||
    els.bootLog.textContent === "waiting for bootstrap"
  ) {
    els.bootLog.textContent = line;
    return;
  }

  els.bootLog.textContent += "\n" + line;
}

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function setTransport(label, tone) {
  if (!els.transportPill) {
    return;
  }

  els.transportPill.className = "status-pill";
  if (tone) {
    els.transportPill.className += " " + tone;
  }
  els.transportPill.textContent = label;
}

function setServerStatus(label) {
  setText(els.serverPill, label);
}

function setPrintingProgress(progress) {
  var label = document.querySelector("[data-print-label]");
  var normalized = 0;

  if (typeof progress === "number" && isFinite(progress)) {
    normalized = Math.max(0, Math.min(100, Math.round(progress)));
  }

  if (label) {
    label.textContent = String(normalized) + "%";
  }
}

function renderFace(snapshot) {
  var face = "happy";
  var template = faceTemplates.happy;

  if (snapshot && snapshot.face && faceTemplates[snapshot.face]) {
    face = snapshot.face;
    template = faceTemplates[face];
  }

  document.body.className = "face-" + face;
  if (els.eyesLayer) {
    els.eyesLayer.innerHTML = template.eyes;
  }
  if (els.accentLayer) {
    els.accentLayer.innerHTML = template.accent;
  }

  if (face === "printing") {
    if (snapshot && snapshot.printing) {
      setPrintingProgress(snapshot.printing.progress);
    } else {
      setPrintingProgress(null);
    }
  }
}

function formatPrinting(printing) {
  var parts = [];
  var progress;

  if (!printing) {
    return "inactive";
  }

  if (typeof printing.progress === "number" && isFinite(printing.progress)) {
    progress = Math.max(0, Math.min(100, Math.round(printing.progress)));
    parts.push(String(progress) + "%");
  } else {
    parts.push("--");
  }

  if (printing.status) {
    parts.push(printing.status);
  }

  if (printing.project) {
    parts.push("- " + printing.project);
  }

  return parts.join(" ");
}

function applySnapshot(snapshot) {
  setText(els.faceValue, snapshot.face || "happy");
  setText(els.modeValue, snapshot.mode || "idle");
  setText(els.sourceValue, snapshot.source || "system");
  setText(els.priorityValue, snapshot.priority || "low");
  setText(els.printingValue, formatPrinting(snapshot.printing || null));
  setText(els.updatedValue, new Date().toLocaleTimeString());
  renderFace(snapshot);
}

function showRuntimeError(message) {
  setTransport("script error", "transport-error");
  setText(els.updatedValue, message);
}

function requestSnapshot(onSuccess, onError) {
  var request;

  bootLog("requestSnapshot start");

  if (typeof XMLHttpRequest !== "function") {
    bootLog("XMLHttpRequest missing");
    onError("XMLHttpRequest unavailable");
    return;
  }

  request = new XMLHttpRequest();
  request.open("GET", BASE_URL + "/api/state", true);
  request.timeout = REQUEST_TIMEOUT_MS;

  request.onreadystatechange = function () {
    var snapshot;

    if (request.readyState !== 4) {
      return;
    }

    if (request.status >= 200 && request.status < 300) {
      try {
        snapshot = JSON.parse(request.responseText);
      } catch (_error) {
        bootLog("json parse failed");
        onError("invalid json");
        return;
      }
      bootLog("http ok");
      onSuccess(snapshot);
      return;
    }

    if (request.status > 0) {
      bootLog("http error " + request.status);
      onError("http " + request.status);
      return;
    }

    bootLog("request failed without status");
    onError("request failed");
  };

  request.onerror = function () {
    bootLog("xhr onerror");
    onError("network error");
  };

  request.ontimeout = function () {
    bootLog("xhr timeout");
    onError("request timeout");
  };

  bootLog("xhr send");
  request.send(null);
}

function tick() {
  bootLog("tick");
  requestSnapshot(
    function (snapshot) {
      bootLog("snapshot applied");
      setTransport("polling", "transport-polling");
      applySnapshot(snapshot);
    },
    function (reason) {
      bootLog("snapshot failed: " + reason);
      setTransport("offline", "transport-error");
      setText(els.updatedValue, reason);
    }
  );
}

function init() {
  bootLog("init start");
  window.onerror = function (message, _source, lineNumber) {
    showRuntimeError(String(message) + " @ " + String(lineNumber || 0));
    bootLog("window error handler: " + String(message));
    return false;
  };

  bootLog("dom wiring");
  setText(els.versionPill, "v" + APP_VERSION);
  setServerStatus(BASE_URL);
  setTransport("connecting", "");
  renderFace({ face: "happy", printing: null });
  bootLog("first tick");
  tick();
  pollTimer = window.setInterval(tick, POLL_INTERVAL_MS);
  bootLog("poll timer armed");
}

init();
