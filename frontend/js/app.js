// URL Shortener Frontend Application
// Author: Frontend Developer
// Description: Handles UI interactions and API communication

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// --- Auth Helpers (no token check) ---

async function loginAndStoreToken(username, password) {
  const base = window.CONFIG?.API_URL?.replace(/\/+$/, "") || "/api";

  try {
    const resp = await fetch(`${base}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.detail || "Login failed");
    }

    const data = await resp.json();
    // store token but UI won't care
    localStorage.setItem("jwt_access", data.access);
    localStorage.setItem("jwt_refresh", data.refresh);

    const user = await fetchCurrentUser();
    window.currentUser = user;
    updateAuthUI(user);
    return data;
  } catch (err) {
    throw new Error(err.message);
  }
}

function logoutAndClearToken() {
  localStorage.removeItem("jwt_access");
  localStorage.removeItem("jwt_refresh");
  window.currentUser = null;
  updateAuthUI(null);
}

async function fetchCurrentUser() {
  const base = window.CONFIG?.API_URL?.replace(/\/+$/, "") || "/api";
  const token = localStorage.getItem("jwt_access"); // <-- ADD THIS

  if (!token) return null; // nothing to do if not logged in

  try {
    const resp = await fetch(`${base}/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resp.ok) {
      if (resp.status === 401 || resp.status === 403) {
        localStorage.removeItem("jwt_access");
        localStorage.removeItem("jwt_refresh");
      }
      return null;
    }

    const data = await resp.json();
    return data; // { id, username, is_staff, is_superuser }
  } catch (err) {
    console.warn("fetchCurrentUser failed:", err);
    return null;
  }
}

// --- UI Update (ignores token) ---
function updateAuthUI(user = null) {
  const authMsg = document.getElementById("authMsg");
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");
  const adminBadge = document.getElementById("adminBadge");
  const staffBadge = document.getElementById("staffBadge"); // <- new

  if (!authMsg) return;

  if (user && user.username) {
    authMsg.textContent = `Signed in as ${user.username}`;
    loginForm?.classList.add("hidden");
    logoutBtn?.classList.remove("hidden");

    // Admin badge
    if (adminBadge) {
      user.is_superuser
        ? adminBadge.classList.remove("hidden")
        : adminBadge.classList.add("hidden");
    }

    // Staff badge
    if (staffBadge) {
      user.is_staff
        ? staffBadge.classList.remove("hidden")
        : staffBadge.classList.add("hidden");
    }
  } else {
    authMsg.textContent = "Not signed in";
    loginForm?.classList.remove("hidden");
    logoutBtn?.classList.add("hidden");
    adminBadge?.classList.add("hidden");
    staffBadge?.classList.add("hidden");
  }
}

// --- Initialize Auth UI ---
async function initAuthUI() {
  if (window.CONFIG?.USE_MOCK) {
    document.getElementById("authBlock")?.style.setProperty("display", "none");
    return;
  }

  const user = await fetchCurrentUser();
  window.currentUser = user;
  updateAuthUI(user);

  document
    .getElementById("loginForm")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const u = document.getElementById("loginUser").value;
      const p = document.getElementById("loginPass").value;

      try {
        await loginAndStoreToken(u, p);
      } catch (err) {
        alert("Login failed: " + err.message);
      }
    });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    logoutAndClearToken();
  });
}

class URLShortener {
  constructor() {
    // Use config.js if present, otherwise fallback to env/defaults
    const cfg = window.CONFIG;

    this.API_BASE_URL = cfg.API_URL;
    this.SHORT_URL_BASE = cfg.SHORT_URL_BASE;
    this.isMock = !!cfg.USE_MOCK;

    console.log("🔧 URLShortener constructor:");
    console.log("  - CONFIG:", cfg);
    console.log("  - API_BASE_URL:", this.API_BASE_URL);
    console.log("  - SHORT_URL_BASE:", this.SHORT_URL_BASE);
    console.log("  - isMock:", this.isMock);

    // DOM elements
    this.form = document.getElementById("shortenForm");
    this.urlInput = document.getElementById("urlInput");
    this.shortenBtn = document.getElementById("shortenBtn");
    this.loading = document.getElementById("loading");
    this.errorMessage = document.getElementById("errorMessage");
    this.result = document.getElementById("result");
    this.shortUrl = document.getElementById("shortUrl");
    this.copyBtn = document.getElementById("copyBtn");

    // Stats elements
    this.statsLoading = document.getElementById("statsLoading");
    this.emptyStats = document.getElementById("emptyStats");
    this.statsTable = document.getElementById("statsTable");
    this.statsTableBody = document.getElementById("statsTableBody");

    this.initializeEventListeners();
    this.loadStatistics();
  }

  initializeEventListeners() {
    // Form submission
    this.form.addEventListener("submit", (e) => this.handleFormSubmit(e));

    // Copy button
    this.copyBtn.addEventListener("click", () => this.copyToClipboard());

    // Input validation
    this.urlInput.addEventListener("input", () => this.validateUrl());
  }

  async handleFormSubmit(e) {
    e.preventDefault();

    const url = this.urlInput.value.trim();
    if (!this.isValidUrl(url)) {
      this.showError("Please enter a valid URL");
      return;
    }

    try {
      this.showLoading(true);
      this.hideError();
      this.hideResult();

      const response = await this.shortenUrl(url);
      this.showResult(response);
      // Add delay before refreshing stats in mock mode
      if (this.isMock) {
        await this.delay(200); // Give backend time to write file
      }
      this.loadStatistics(); // Refresh stats
    } catch (error) {
      this.showError(
        error.message || "Failed to shorten URL. Please try again."
      );
    } finally {
      this.showLoading(false);
    }
  }

  async shortenUrl(url) {
    // Helper to build safe base URLs without double slashes
    const safeJoin = (base, path) =>
      `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

    // 1) If mock mode: call backend shorten endpoint (which handles mock data)
    if (this.isMock) {
      console.log("✅ Mock mode - calling backend shorten endpoint");

      try {
        const response = await fetch(`http://localhost:8000/api/shorten`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            ...data,
            shortUrl:
              data.shortUrl || `${window.location.origin}/${data.shortCode}`,
          };
        } else {
          throw new Error("Backend shorten failed");
        }
      } catch (error) {
        console.error("Error shortening URL in mock mode:", error);
        throw new Error("Failed to shorten URL");
      }
    }

    // 2) If not mock: try the real backend first
    try {
      const resp = await fetch(safeJoin(this.API_BASE_URL, "shorten"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ url }),
      });

      if (resp.ok) {
        const data = await resp.json();
        // prefer backend-provided shortUrl if present
        return {
          ...data,
          shortUrl:
            data.shortUrl ||
            `${this.SHORT_URL_BASE.replace(/\/+$/, "")}/${data.shortCode}`,
        };
      } else {
        // treat non-ok as a failure so we fall back below
        console.warn(
          "Backend responded with non-ok status for shortenUrl:",
          resp.status
        );
        throw new Error("Backend returned non-ok status");
      }
    } catch (backendErr) {
      console.warn(
        "Backend shortenUrl failed, falling back to mock-data.json:",
        backendErr
      );
      // fall-through to try mock JSON next
    }

    // 3) Try mock-data.json (or whatever this.API_BASE_URL points to if it's a JSON path)
    const mockPath =
      typeof this.API_BASE_URL === "string" &&
      this.API_BASE_URL.endsWith(".json")
        ? this.API_BASE_URL
        : "mock-data.json";

    try {
      // small delay to simulate latency (keeps UX consistent)
      await this.delay(400);
      const res = await fetch(mockPath);
      if (res.ok) {
        const data = await res.json();
        // pick sensible fields if present; otherwise fall back to generated code
        const code =
          data && (data.shortCode || data.code)
            ? data.shortCode || data.code
            : this.generateMockShortCode();
        return {
          shortCode: code,
          originalUrl: url,
          shortUrl:
            data && data.shortUrl
              ? data.shortUrl
              : `${window.location.origin}/${code}`,
        };
      } else {
        console.warn(
          "mock-data.json returned non-ok status for shortenUrl:",
          res.status
        );
        throw new Error("mock-data.json non-ok");
      }
    } catch (mockErr) {
      console.warn(
        "mock-data.json unavailable or invalid for shortenUrl, using generated mock:",
        mockErr
      );
    }

    // 4) Last resort: generated mock
    await this.delay(300);
    const code = this.generateMockShortCode();
    return {
      shortCode: code,
      originalUrl: url,
      shortUrl: `${window.location.origin}/${code}`,
    };
  }

  async loadStatistics() {
    try {
      this.showStatsLoading(true);

      // Helper to normalize the data we receive
      const normalizeStats = (data) => {
        if (!data) return null;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.stats)) return data.stats;
        // If object with numeric keys, convert to array
        if (typeof data === "object") {
          const arr = Object.values(data).filter((v) => v && v.shortCode);
          if (arr.length) return arr;
        }
        return null;
      };

      // 1) If not mock: try real backend first
      if (!this.isMock) {
        try {
          const resp = await fetch(
            `${this.API_BASE_URL.replace(/\/+$/, "")}/stats`
          );
          if (resp.ok) {
            const data = await resp.json();
            const stats = normalizeStats(data);
            if (stats && stats.length > 0) {
              this.displayStatistics(stats);
              return;
            } else {
              console.warn(
                "Backend stats returned empty or unexpected shape, will try mock-data.json"
              );
              // fall through to mock
            }
          } else {
            console.warn("Backend responded non-ok for stats:", resp.status);
            throw new Error("Backend non-ok");
          }
        } catch (backendErr) {
          console.warn(
            "Backend stats fetch failed, falling back to mock-data.json:",
            backendErr
          );
          // fall through to mock
        }
      }

      // 2) Try mock-data.json (when in mock mode or backend failed)
      try {
        const cacheBuster = this.isMock ? `?t=${Date.now()}` : "";
        const res = await fetch(`mock-data.json${cacheBuster}`);
        if (res.ok) {
          const data = await res.json();
          const stats = normalizeStats(data);
          if (stats && stats.length > 0) {
            this.displayStatistics(stats);
            return;
          } else {
            console.warn(
              "mock-data.json contained no usable stats, will fall back to generated mock"
            );
          }
        } else {
          console.warn(
            "mock-data.json responded non-ok for stats:",
            res.status
          );
        }
      } catch (mockErr) {
        console.warn(
          "Failed to fetch or parse mock-data.json for stats:",
          mockErr
        );
      }

      // 3) Last resort: generated mock stats
      await this.delay(300);
      const mockStats = this.generateMockStats();
      this.displayStatistics(mockStats);
    } catch (error) {
      console.error("Error loading statistics:", error);
      this.showEmptyStats();
    } finally {
      this.showStatsLoading(false);
    }
  }

  displayStatistics(stats) {
    if (!stats || stats.length === 0) {
      this.showEmptyStats();
      return;
    }

    this.hideEmptyStats();
    this.showStatsTable();

    this.statsTableBody.innerHTML = "";

    stats.forEach((stat) => {
      const row = this.createStatRow(stat);
      this.statsTableBody.appendChild(row);
    });
  }

  createStatRow(stat) {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50";

    row.innerHTML = `
          <td class="px-4 py-3 text-sm text-gray-900">
              <code class="bg-gray-100 px-2 py-1 rounded">${stat.shortCode}</code>
          </td>
          <td class="px-4 py-3 text-sm text-gray-600">
              <a href="${stat.originalUrl}" target="_blank" class="text-blue-600 hover:text-blue-800 truncate block max-w-xs">
                  ${stat.originalUrl}
              </a>
          </td>
          <td class="px-4 py-3 text-sm text-gray-900">
              <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  ${stat.clickCount} clicks
              </span>
          </td>
          <td class="px-4 py-3 text-sm">
              <button onclick="urlShortener.copyShortUrl('${stat.shortCode}')" 
                      class="text-blue-600 hover:text-blue-800 text-xs font-medium">
                  Copy Link
              </button>
              <button onclick="urlShortener.deleteUrl('${stat.shortCode}', this)"
                    class="text-red-600 hover:text-red-800 text-xs font-medium">
                Delete
            </button>
          </td>
      `;

    return row;
  }

  async copyShortUrl(shortCode) {
    const shortUrl = `${this.SHORT_URL_BASE}/${shortCode}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      this.showToast("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.shortUrl.value);

      // Visual feedback
      const originalText = this.copyBtn.textContent;
      this.copyBtn.textContent = "Copied!";
      this.copyBtn.classList.add("copy-success");

      setTimeout(() => {
        this.copyBtn.textContent = originalText;
        this.copyBtn.classList.remove("copy-success");
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      this.showError("Failed to copy to clipboard");
    }
  }

  async deleteUrl(shortCode, btn) {
    console.log("🗑️ deleteUrl called:");
    console.log("  - shortCode:", shortCode);
    console.log("  - isMock:", this.isMock);
    console.log("  - API_BASE_URL:", this.API_BASE_URL);

    if (this.isMock) {
      console.log("✅ Mock mode - calling backend delete endpoint");

      // In mock mode, call the backend delete endpoint (which handles mock data)
      try {
        const response = await fetch(
          `http://localhost:8000/api/urls/${shortCode}/`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          btn.closest("tr").remove();
          this.showToast(`Deleted ${shortCode} (mock mode)`);

          // Add delay before refreshing stats in mock mode
          await this.delay(200); // Give backend time to write file

          // Refresh stats to show updated data
          this.loadStatistics();
        } else {
          this.showToast("Failed to delete URL");
        }
      } catch (error) {
        console.error("Error deleting from mock data:", error);
        this.showToast("Error deleting URL");
      }
      return;
    }

    console.log("🔐 Real mode - checking authentication");
    try {
      const token = localStorage.getItem("jwt_access");
      if (!token) {
        this.showToast("You must be logged in to delete a link.");
        return;
      }

      const resp = await fetch(
        `${this.API_BASE_URL.replace(/\/+$/, "")}/urls/${shortCode}/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (resp.ok) {
        btn.closest("tr").remove();
        this.showToast(`Deleted ${shortCode}`);
      } else {
        const err = await resp.json().catch(() => ({}));
        const msg = err.detail || err.error || "Failed to delete URL.";
        this.showToast(msg);
      }
    } catch (err) {
      console.error(err);
      this.showToast("Error deleting URL.");
    }
  }

  showStatsLoading(show) {
    if (show) {
      this.statsLoading.classList.remove("hidden");
      this.emptyStats.classList.add("hidden");
      this.statsTable.classList.add("hidden");
    } else {
      this.statsLoading.classList.add("hidden");
    }
  }

  showLoading(show) {
    if (show) {
      this.loading.classList.remove("hidden");
      this.shortenBtn.disabled = true;
    } else {
      this.loading.classList.add("hidden");
      this.shortenBtn.disabled = false;
    }
  }

  showError(message) {
    this.errorMessage.querySelector("p").textContent = message;
    this.errorMessage.classList.remove("hidden");
    this.errorMessage.classList.add("slide-down");
  }

  hideError() {
    this.errorMessage.classList.add("hidden");
  }

  showResult(data) {
    this.shortUrl.value = data.shortUrl;
    this.result.classList.remove("hidden");
    this.result.classList.add("fade-in");
  }

  hideResult() {
    this.result.classList.add("hidden");
  }

  showEmptyStats() {
    this.emptyStats.classList.remove("hidden");
    this.statsTable.classList.add("hidden");
  }

  hideEmptyStats() {
    this.emptyStats.classList.add("hidden");
  }

  showStatsTable() {
    this.statsTable.classList.remove("hidden");
  }

  showToast(message) {
    // Simple toast notification
    const toast = document.createElement("div");
    toast.className =
      "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 fade-in";
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // Validation Methods
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  validateUrl() {
    const url = this.urlInput.value.trim();
    if (url && !this.isValidUrl(url)) {
      this.urlInput.classList.add("border-red-500");
    } else {
      this.urlInput.classList.remove("border-red-500");
    }
  }

  // Mock Data Generators (for development)
  generateMockShortCode() {
    return Math.random().toString(36).substring(2, 8);
  }

  generateMockStats() {
    return [
      {
        shortCode: "abc123",
        originalUrl:
          "https://www.example.com/very-long-url-that-needs-shortening",
        clickCount: 15,
      },
      {
        shortCode: "xyz789",
        originalUrl: "https://www.google.com",
        clickCount: 23,
      },
      {
        shortCode: "def456",
        originalUrl: "https://www.github.com/user/repository",
        clickCount: 7,
      },
    ];
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Wait for config to be properly fetched from backend
  // The initial CONFIG has USE_MOCK: false, so we wait until it's been updated
  let attempts = 0;
  const maxAttempts = 50; // 5 seconds max wait

  while (attempts < maxAttempts) {
    // Check if config has been fetched from backend (API_URL will be different from default)
    if (
      window.CONFIG &&
      window.CONFIG.API_URL !== "http://localhost:8000/api/"
    ) {
      console.log("✅ Config properly fetched from backend:", window.CONFIG);
      break;
    }

    console.log(
      `⏳ Waiting for config... (attempt ${attempts + 1}/${maxAttempts})`
    );
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }

  if (attempts >= maxAttempts) {
    console.warn("⚠️ Config fetch timeout, using default config");
  }

  // Initialize auth and URLShortener
  try {
    await initAuthUI();
  } catch (e) {
    console.warn("Auth UI init skipped or failed:", e);
  }

  window.urlShortener = new URLShortener();
});

// Export for module systems (if needed)
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = URLShortener;
}
