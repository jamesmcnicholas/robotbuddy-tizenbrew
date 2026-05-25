var TARGET_URL = "http://192.168.1.180:8787/face";

function go() {
  try {
    window.location.replace(TARGET_URL);
  } catch (_error) {
    window.location.href = TARGET_URL;
  }
}

go();
