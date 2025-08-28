// URL Shortener Frontend Application
// Author: Frontend Developer
// Description: Handles UI interactions and API communication

class URLShortener {
  constructor() {
    // API Configuration - reads from environment or defaults
    this.API_BASE_URL = this.getEnvVar(
      "FRONTEND_API_BASE_URL",
      "http://localhost:8000/api"
    );
    this.SHORT_URL_BASE = this.getEnvVar(
      "FRONTEND_SHORT_URL_BASE",
      "http://localhost:8000"
    );

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

  // Helper method to get environment variables or use defaults
  getEnvVar(name, defaultValue) {
    // In a real frontend build setup, you'd inject these at build time
    // For now, using defaults for development
    const envVars = {
      FRONTEND_API_BASE_URL: "http://localhost:8000/api",
      FRONTEND_SHORT_URL_BASE: "http://localhost:8000",
    };
    return envVars[name] || defaultValue;
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
    // TODO: Replace with actual API call when backend is ready
    // For now, return mock data for frontend development

    if (this.API_BASE_URL === "http://localhost:8000") {
      // Mock response for development
      await this.delay(1500); // Simulate API delay
      return {
        shortCode: this.generateMockShortCode(),
        originalUrl: url,
        shortUrl: `${window.location.origin}/abc123`,
      };
    }

    // Real API call (uncomment when backend is ready)
    /*
      const response = await fetch(`${this.API_BASE_URL}/shorten`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: url })
      });

      if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Server error');
      }

      const data = await response.json();
      return {
          ...data,
          shortUrl: `${this.SHORT_URL_BASE}/${data.shortCode}`
      };
      */
  }

  async loadStatistics() {
    try {
      this.showStatsLoading(true);

      // TODO: Replace with actual API call when backend is ready
      if (this.API_BASE_URL === "http://localhost:8000") {
        // Mock data for development
        await this.delay(800);
        const mockStats = this.generateMockStats();
        this.displayStatistics(mockStats);
        return;
      }

      // Real API call (uncomment when backend is ready)
      /*
          const response = await fetch(`${this.API_BASE_URL}/stats`);
          
          if (!response.ok) {
              throw new Error('Failed to load statistics');
          }
          
          const stats = await response.json();
          this.displayStatistics(stats);
          */
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

  // UI Helper Methods
  showLoading(show) {
    if (show) {
      this.loading.classList.remove("hidden");
      this.shortenBtn.disabled = true;
    } else {
      this.loading.classList.add("hidden");
      this.shortenBtn.disabled = false;
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

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.urlShortener = new URLShortener();
});

// Export for module systems (if needed)
if (typeof module !== "undefined" && module.exports) {
  module.exports = URLShortener;
}
