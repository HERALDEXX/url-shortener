// URL Shortener Frontend Application
// Description: Handles UI interactions and API communication

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// --- Auth Helpers ---
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

  const loginUser = document.getElementById("loginUser");
  const loginPass = document.getElementById("loginPass");
  if (loginUser) loginUser.value = "";
  if (loginPass) loginPass.value = "";
}

async function fetchCurrentUser() {
  const base = window.CONFIG?.API_URL?.replace(/\/+$/, "") || "/api";
  const token = localStorage.getItem("jwt_access");

  if (!token) return null;

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
    return data;
  } catch (err) {
    console.warn("fetchCurrentUser failed:", err);
    return null;
  }
}

// --- UI Update ---
function updateAuthUI(user = null) {
  const authMsg = document.getElementById("authMsg");
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");
  const adminBadge = document.getElementById("adminBadge");
  const staffBadge = document.getElementById("staffBadge");

  if (!authMsg) return;

  if (user && user.username) {
    authMsg.textContent = `Signed in as ${user.username}`;
    loginForm?.classList.add("hidden");
    logoutBtn?.classList.remove("hidden");

    if (adminBadge) {
      user.is_superuser
        ? adminBadge.classList.remove("hidden")
        : adminBadge.classList.add("hidden");
    }

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
        // Clear form after successful login
        e.target.reset();
      } catch (err) {
        alert("Login failed: " + err.message);
        document.getElementById("loginPass").value = "";
      }
    });
    
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    logoutAndClearToken();
  });
}

class URLShortener {
  constructor() {
    const cfg = window.CONFIG;

    this.API_BASE_URL = cfg.API_URL;
    this.SHORT_URL_BASE = cfg.SHORT_URL_BASE;

    console.log("🔧 URLShortener constructor:");
    console.log("  - CONFIG:", cfg);
    console.log("  - API_BASE_URL:", this.API_BASE_URL);
    console.log("  - SHORT_URL_BASE:", this.SHORT_URL_BASE);

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
    this.form.addEventListener("submit", (e) => this.handleFormSubmit(e));
    this.copyBtn.addEventListener("click", () => this.copyToClipboard());
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
    const safeJoin = (base, path) =>
      `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

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

      if (!resp.ok) {
        throw new Error("Failed to shorten URL");
      }

      const data = await resp.json();
      return {
        ...data,
        shortUrl:
          data.shortUrl ||
          `${this.SHORT_URL_BASE.replace(/\/+$/, "")}/${data.shortCode}`,
      };
    } catch (error) {
      console.error("Error shortening URL:", error);
      throw new Error("Failed to shorten URL");
    }
  }

  async loadStatistics() {
    try {
      this.showStatsLoading(true);

      const resp = await fetch(
        `${this.API_BASE_URL.replace(/\/+$/, "")}/stats`
      );

      if (!resp.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await resp.json();

      if (data && data.length > 0) {
        this.displayStatistics(data);
      } else {
        this.showEmptyStats();
      }
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
                  class="text-blue-600 hover:text-blue-800 text-xs font-medium mr-2">
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
    console.log("🗑️ deleteUrl called:", shortCode);

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
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initAuthUI();
  } catch (e) {
    console.warn("Auth UI init failed:", e);
  }

  window.urlShortener = new URLShortener();
});

// Export for module systems (if needed)
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = URLShortener;
}
