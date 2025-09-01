# URL Shortener API Contract

**Version**: 1.0.0  
**Base URL**: [`http://localhost:8000/api/`](http://localhost:8000/api/)

---

## Overview

This API provides endpoints for shortening URLs, retrieving stats on shortened URLs, redirecting via short codes, and basic health/info checks. Built with Django and Django REST Framework (DRF). Data is stored in MySQL via Django ORM.

- **Base URL**: Assume `/api/` for JSON endpoints (e.g., `http://yourdomain.com/api/shorten`). Redirects are at root (e.g., `http://yourdomain.com/abc123`).
- **Authentication**: JWT required for URL management in real database mode (`USE_MOCK=false`). No authentication required in mock mode (`USE_MOCK=true`).
- **Request/Response Format**: JSON for bodies and responses (where applicable). Errors as `{"error": "message"}`.
- **Data Model (from URLModel)**: Each URL has `original_url` (string, max 2048 chars), `short_code` (string, unique, 6-10 chars), `click_count` (integer, default 0), `created_at` (datetime, not exposed in API), `updated_at` (datetime, internal).
- **Serialization**: CamelCase keys in responses (`shortCode`, `originalUrl`, `clickCount`). Only these three fields exposed.
- **Validation**: URLs checked with `validators.url` (must be valid http/https with domain).
- **Error Handling**: 400 for bad input, 404 for not found, 500 for server issues.
- **Other Notes**: No pagination on stats (fetches all). Clicks increment atomically. CSRF exempt on redirects.

## Endpoints

### 1. POST /api/shorten

**Description**: Shorten a new URL or return existing short code if duplicate. Creates a new `URLModel` if needed.

**Request**:

- Method: POST
- Headers: `Content-Type: application/json`
- Body: `{"url": "https://example.com/long/path"}` (required string)

**Responses**:

- 201 Created (new URL): `{"shortCode": "abc123", "originalUrl": "https://example.com/long/path"}`
- 200 OK (existing URL): `{"shortCode": "abc123", "originalUrl": "https://example.com/long/path", "message": "URL already exists"}`
- 400 Bad Request: `{"error": "URL is required"}` | `{"error": "Invalid URL format"}` | `{"error": "Invalid JSON data"}`
- 500 Internal Server Error: `{"error": "Server error: details"}`

**Notes**: Checks for duplicates by `original_url`. Generates random 6-char short code if new.

### 2. GET /api/stats

**Description**: Get list of all shortened URLs with stats, ordered by `created_at` descending.

**Request**:

- Method: GET
- No body or params.

**Responses**:

- 200 OK: Array of objects, e.g.,
  ```json
  [
    {
      "shortCode": "abc123",
      "originalUrl": "https://example.com",
      "clickCount": 5
    },
    {
      "shortCode": "def456",
      "originalUrl": "https://another.com",
      "clickCount": 0
    }
  ]
  ```
- 500 Internal Server Error: `{"error": "Server error: details"}`

**Notes**: Uses `URLSerializer` for output. No filtering/pagination yet – scales poorly for large datasets.

### 3. GET /{short_code}

**Description**: Redirect to original URL and increment `click_count`. Not a JSON endpoint.

**Request**:

- Method: GET
- Path: `/abc123` (short_code as path param)

**Responses**:

- 302 Redirect: To `original_url`.
- 404 Not Found: `{"error": "Short URL not found"}` (JSON)
- 500 Internal Server Error: `{"error": "Server error: details"}` (JSON)

**Notes**: Handles root-level paths. Click update uses Django's `F` for atomicity.

### 4. GET /api/health

**Description**: Service health check.

**Request**:

- Method: GET

**Responses**:

- 200 OK: `{"status": "healthy", "service": "url-shortener", "version": "1.0.0"}`

**Notes**: Always succeeds if server responds.

### 5. GET /api/

**Description**: API root info.

**Request**:

- Method: GET

**Responses**:

- 200 OK:
  ```json
  {
    "message": "URL Shortener API",
    "version": "1.0.0",
    "endpoints": {
      "shorten": "POST /api/shorten",
      "stats": "GET /api/stats",
      "redirect": "GET /{short_code}",
      "health": "GET /api/health"
    }
  }
  ```

**Notes**: For discovery; lists endpoints with `/api/` prefix where applicable.

### 6. POST /api/token/

**Description**: Authenticate user and obtain JWT tokens (real database mode only).

**Request**:

- Method: POST
- Headers: `Content-Type: application/json`
- Body: `{"username": "your_username", "password": "your_password"}`

**Responses**:

- 200 OK: `{"access": "jwt_access_token", "refresh": "jwt_refresh_token"}`
- 400 Bad Request: `{"detail": "Invalid credentials"}`

**Notes**: Required for URL deletion in real database mode. Tokens should be included in Authorization header as `Bearer <token>`.

### 7. DELETE /api/urls/{short_code}/

**Description**: Delete a shortened URL (authentication required in real database mode).

**Request**:

- Method: DELETE
- Path: `/api/urls/abc123/`
- Headers (real mode): `Authorization: Bearer <jwt_token>`

**Responses**:

- 200 OK: `{"message": "URL abc123 deleted successfully."}`
- 401 Unauthorized: `{"error": "Authentication required"}` (real mode only)
- 403 Forbidden: `{"error": "Not allowed"}` (insufficient permissions)
- 404 Not Found: `{"error": "URL not found"}`

**Notes**: In mock mode, no authentication required. In real mode, only URL owner or staff can delete.

### 8. GET /api/me

**Description**: Get current authenticated user info (real database mode only).

**Request**:

- Method: GET
- Headers: `Authorization: Bearer <jwt_token>`

**Responses**:

- 200 OK: `{"id": 1, "username": "user", "is_staff": false, "is_superuser": false}`
- 401 Unauthorized: Authentication required

### 9. GET /api/config/

**Description**: Get current configuration mode.

**Request**:

- Method: GET

**Responses**:

- 200 OK: `{"use_mock": true}` or `{"use_mock": false}`

**Notes**: Frontend uses this to determine which mode the backend is running in.

## General Guidelines

- **Versioning**: v1.0.0 — no breaking changes planned.
- **Authentication**: JWT tokens required for URL management in real database mode. Create users via Django admin at `http://localhost:8000/admin/`.
- **Mock vs Real Mode**: Controlled by `USE_MOCK` setting. Mock mode uses JSON file storage with no authentication. Real mode uses MySQL with full security.
- **CORS**: Configured and ready. Set `CORS_ALLOWED_ORIGINS` environment variable for production deployments.
- **Scaling Considerations**: Stats endpoint pulls all records — add query params for filters/limits soon.
- **Testing**: Use tools like Postman. Mock responses for frontend testing (see [mock-data.json](../frontend/mock-data.json)).
