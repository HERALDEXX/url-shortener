// config.js
// Configuration for frontend application
// Toggle USE_MOCK to switch between mock data and real API: true = mock, false = real API
// Adjust API_URL and SHORT_URL_BASE as needed

// Set default config immediately to prevent undefined errors
window.CONFIG = {
  USE_MOCK: false,
  API_URL: "http://localhost:8000/api/",
  SHORT_URL_BASE: "http://localhost:8000",
};

async function initConfig() {
  let backendUseMock = false;

  console.log("🔧 Initializing config...");

  try {
    console.log(
      "📡 Fetching backend config from http://localhost:8000/api/config/"
    );
    const resp = await fetch("http://localhost:8000/api/config/");

    if (resp.ok) {
      const data = await resp.json();
      console.log("✅ Backend config received:", data);
      backendUseMock = data.use_mock;
      console.log("🎯 Backend USE_MOCK value:", backendUseMock);
    } else {
      console.warn(
        "❌ Could not fetch backend config, using default USE_MOCK = false"
      );
    }
  } catch (err) {
    console.warn("❌ Error fetching backend config:", err);
  }

  // Update CONFIG object with backend values
  window.CONFIG = {
    USE_MOCK: backendUseMock,
    API_URL: backendUseMock ? "mock-data.json" : "http://localhost:8000/api/",
    SHORT_URL_BASE: "http://localhost:8000",
  };

  console.log("🎉 Final CONFIG object:", window.CONFIG);
  return window.CONFIG;
}

// Auto-initialize when script loads
(async () => {
  await initConfig();
})();
