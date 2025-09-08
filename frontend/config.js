// config.js
// Configuration for frontend application

// Set config immediately to prevent undefined errors
window.CONFIG = {
  API_URL: "http://localhost:8000/api/",
  SHORT_URL_BASE: "http://localhost:8000",
};

console.log("🔧 CONFIG initialized:", window.CONFIG);
