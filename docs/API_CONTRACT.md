# Link Crush API Contract

**Version**: 1.0.0  
**Base URL**: [`http://localhost:8000/api/`](http://localhost:8000/api/)

## Table of Contents

- 📋 [Overview](#overview)
- 🔗 [Endpoints](#endpoints)
  - [POST /api/shorten](#1-post-apishorten)
  - [GET /api/stats](#2-get-apistats)
  - [GET /{short_code}](#3-get-short_code)
  - [DELETE /api/urls/{short_code}/](#4-delete-apiurlsshort_code)
  - [POST /api/token/](#5-post-apitoken)
  - [POST /api/token/refresh/](#6-post-apitokenrefresh)
  - [GET /api/me](#7-get-apime)
  - [GET /api/health](#8-get-apihealth)
  - [GET /api/](#9-get-api)
- 🔐 [Authentication & User Management](#authentication--user-management)
- ⚠️ [Error Handling](#error-handling)
- 🛠️ [Development Notes](#development-notes)
- 🗄️ [Database Schema](#database-schema)
- 💡 [Example Usage](#example-usage)

---

## Overview

This API provides endpoints for shortening URLs, retrieving stats on shortened URLs, redirecting via short codes, and basic health/info checks. Built with Django and Django REST Framework (DRF). Data is stored in PostgreSQL via Django ORM with JWT authentication for URL management.

- **Base URL**: Use `/api/` for JSON endpoints (e.g., `http://yourdomain.com/api/shorten`). Redirects are at root (e.g., `http://yourdomain.com/abc123`).
- **Authentication**: JWT tokens required for URL deletion and user-specific operations. No authentication required for shortening URLs or viewing stats.
- **Request/Response Format**: JSON for bodies and responses (where applicable). Errors as `{"error": "message"}`.
- **Data Model (URLModel)**: Each URL has `original_url` (string, max 2048 chars), `short_code` (string, unique, 6-10 chars), `click_count` (integer, default 0), `owner` (optional user reference), `created_at` (datetime), `updated_at` (datetime).
- **Serialization**: CamelCase keys in responses (`shortCode`, `originalUrl`, `clickCount`). Only these three fields exposed via URLSerializer.
- **Validation**: URLs checked with `validators.url` (must be valid http/https with domain). URL normalization extracts redirect targets from tracking URLs.
- **Error Handling**: 400 for bad input, 401 for authentication required, 403 for insufficient permissions, 404 for not found, 500 for server issues.
- **Other Notes**: No pagination on stats (fetches all). Clicks increment atomically using Django's `F()`. CSRF exempt on redirects.

## Endpoints

### 1. POST /api/shorten

**Description**: Shorten a new URL or return existing short code if duplicate. Creates a new `URLModel` if needed. Associates with authenticated user if logged in.

**Request**:

- Method: POST
- Headers: `Content-Type: application/json`
- Headers (optional): `Authorization: Bearer <jwt_token>` (to associate URL with user)
- Body: `{"url": "https://example.com/long/path"}` (required string)

**Responses**:

- 201 Created (new URL): `{"shortCode": "abc123", "originalUrl": "https://example.com/long/path"}`
- 200 OK (existing URL): `{"shortCode": "abc123", "originalUrl": "https://example.com/long/path", "message": "URL already exists"}`
- 400 Bad Request: `{"error": "Invalid URL format"}` | `{"error": "Server error: details"}`
- 500 Internal Server Error: `{"error": "Server error: details"}`

**Notes**: Checks for duplicates by `original_url`. Generates random 6-char short code if new. URL normalization attempts to extract real targets from tracking URLs.

### 2. GET /api/stats

**Description**: Get list of all shortened URLs with stats, ordered by `created_at` descending.

**Request**:

- Method: GET
- No body or params required.

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

**Notes**: Uses `URLSerializer` for output. Returns all URLs regardless of owner. No filtering/pagination implemented yet.

### 3. GET /{short_code}

**Description**: Redirect to original URL and increment `click_count`. Not a JSON endpoint.

**Request**:

- Method: GET
- Path: `/abc123` (short_code as path param)

**Responses**:

- 302 Redirect: To `original_url`.
- 404 Not Found: `{"error": "Short URL not found"}` (JSON)
- 500 Internal Server Error: `{"error": "Server error: details"}` (JSON)

**Notes**: Handles root-level paths. Click update uses Django's `F('click_count') + 1` for atomic increments to avoid race conditions.

### 4. DELETE /api/urls/{short_code}/

**Description**: Delete a shortened URL. Requires JWT authentication.

**Request**:

- Method: DELETE
- Path: `/api/urls/abc123/`
- Headers: `Authorization: Bearer <jwt_token>` (required)

**Responses**:

- 200 OK: `{"message": "URL abc123 deleted successfully."}`
- 401 Unauthorized: `{"detail": "Authentication credentials were not provided."}`
- 403 Forbidden: `{"error": "Not allowed"}` (insufficient permissions)
- 404 Not Found: URL not found

**Notes**:

- Only the URL owner or staff users can delete a URL
- If URL has no owner (created before authentication), only staff can delete
- Requires valid JWT token in Authorization header

### 5. POST /api/token/

**Description**: Authenticate user and obtain JWT tokens.

**Request**:

- Method: POST
- Headers: `Content-Type: application/json`
- Body: `{"username": "your_username", "password": "your_password"}`

**Responses**:

- 200 OK: `{"access": "jwt_access_token", "refresh": "jwt_refresh_token"}`
- 400 Bad Request: `{"detail": "No active account found with the given credentials"}`

**Notes**: Access tokens expire in 30 minutes, refresh tokens in 7 days. Users must be created via Django admin panel.

### 6. POST /api/token/refresh/

**Description**: Refresh JWT access token using refresh token.

**Request**:

- Method: POST
- Headers: `Content-Type: application/json`
- Body: `{"refresh": "jwt_refresh_token"}`

**Responses**:

- 200 OK: `{"access": "new_jwt_access_token"}`
- 401 Unauthorized: `{"detail": "Token is invalid or expired"}`

### 7. GET /api/me

**Description**: Get current authenticated user info.

**Request**:

- Method: GET
- Headers: `Authorization: Bearer <jwt_token>`

**Responses**:

- 200 OK: `{"id": 1, "username": "user", "is_staff": false, "is_superuser": false}`
- 401 Unauthorized: `{"detail": "Authentication credentials were not provided."}`

### 8. GET /api/health

**Description**: Service health check.

**Request**:

- Method: GET

**Responses**:

- 200 OK: `{"status": "healthy", "service": "link-crush", "version": "1.0.0"}`

**Notes**: Always succeeds if server responds. Useful for monitoring and load balancer health checks.

### 9. GET /api/

**Description**: API root info and available endpoints.

**Request**:

- Method: GET

**Responses**:

- 200 OK:
  ```json
  {
    "message": "Link Crush API",
    "version": "1.0.0",
    "endpoints": {
      "shorten": "POST /api/shorten",
      "stats": "GET /api/stats",
      "redirect": "GET /{short_code}",
      "health": "GET /api/health"
    }
  }
  ```

**Notes**: Endpoint discovery for API consumers.

## Authentication & User Management

### Creating User Accounts

User accounts must be created through the Django admin dashboard:

1. **Start the backend server:**

   ```bash
   cd backend && python manage.py runserver
   ```

2. **Access admin dashboard:** [`http://localhost:8000/admin/`](http://localhost:8000/admin/)

3. **Login with superuser credentials** (created during setup with `python manage.py createsuperuser`)

4. **Create new users:**
   - Navigate to "Users" section
   - Click "Add User"
   - Set username and password
   - Optionally assign staff/admin permissions

### Permission Levels

- **Regular Users**: Can create URLs (associated with their account) and delete their own URLs
- **Staff Users**: Can delete any URL, access admin interface for URL management
- **Superusers**: Full admin access, can create/manage other users

### JWT Token Usage

Include JWT tokens in requests using the Authorization header:

```
Authorization: Bearer your_jwt_access_token_here
```

## Error Handling

### Common Error Responses

- **400 Bad Request**: Invalid input data, malformed JSON, invalid URL format
- **401 Unauthorized**: Missing or invalid JWT token, expired token
- **403 Forbidden**: Valid authentication but insufficient permissions
- **404 Not Found**: Requested resource doesn't exist
- **500 Internal Server Error**: Server-side errors, database connection issues

### Error Response Format

All errors return JSON with descriptive messages:

```json
{
  "error": "Description of what went wrong"
}
```

Or for DRF authentication errors:

```json
{
  "detail": "Authentication credentials were not provided."
}
```

## Development Notes

- **Database**: PostgreSQL 12+ with psycopg2 driver
- **Performance**: PostgreSQL provides better concurrent operation handling and atomic operations
- **CORS**: Configured for frontend integration, set `CORS_ALLOWED_ORIGINS` for production
- **Rate Limiting**: Not implemented yet, planned for future versions
- **Pagination**: Stats endpoint returns all records, will add pagination for large datasets
- **Monitoring**: Use `/api/health` endpoint for health checks
- **Security**: HTTPS recommended for production, secure JWT token storage required
- **Scalability**: PostgreSQL offers better horizontal scaling options for future growth

## Database Schema

The application uses PostgreSQL with the following main table structure:

```sql
-- URLs table
CREATE TABLE urls (
    id BIGSERIAL PRIMARY KEY,
    original_url VARCHAR(2048) NOT NULL,
    short_code VARCHAR(10) NOT NULL UNIQUE,
    click_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    owner_id BIGINT REFERENCES auth_user(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX urls_short_code_idx ON urls(short_code);
CREATE INDEX urls_created_at_idx ON urls(created_at);
CREATE INDEX urls_click_count_idx ON urls(click_count);
CREATE INDEX urls_owner_id_idx ON urls(owner_id);
```

## Example Usage

### Shorten a URL

```bash
curl -X POST http://localhost:8000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/very-long-url"}'
```

### Get all statistics

```bash
curl http://localhost:8000/api/stats
```

### Login and get tokens

```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_user", "password": "your_pass"}'
```

### Delete a URL (authenticated)

```bash
curl -X DELETE http://localhost:8000/api/urls/abc123/ \
  -H "Authorization: Bearer your_jwt_token"
```

### Test redirect

```bash
curl -I http://localhost:8000/abc123
# Should return 302 redirect to original URL
```

### Database connection test

```bash
# Test PostgreSQL connection
psql -U url_shortener_user -d url_shortener -h localhost

# Check if API can connect to database
curl http://localhost:8000/api/health
```
