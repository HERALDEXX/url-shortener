# URL Shortener

[![License](https://img.shields.io/github/license/HERALDEXX/url-shortener)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/downloads/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-blue.svg)](https://dev.mysql.com/downloads/mysql/)
[![Issues](https://img.shields.io/github/issues/HERALDEXX/url-shortener)](https://github.com/HERALDEXX/url-shortener/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/HERALDEXX/url-shortener)](https://github.com/HERALDEXX/url-shortener/pulls)

A full-stack web application that allows users to shorten long URLs, track click analytics, and manage their shortened links. Built with Django REST Framework backend and vanilla JavaScript frontend.

## Table of Contents

- 🚀 [Features](#features)
- 🛠️ [Tech Stack](#tech-stack)
- 📋 [Prerequisites](#prerequisites)
- 🚀 [Quick Start](#quick-start)
- 🔐 [Authentication & User Management](#authentication--user-management)
- 📁 [Project Structure](#project-structure)
- 📚 [API Documentation](#api-documentation)
- 🔄 [Development](#development)
- 🌿 [Branches](#branches)
- 🚀 [Deployment](#deployment)
- 🔧 [Troubleshooting](#troubleshooting)
- 🤝 [Contributing](#contributing)

## Features

- **URL Shortening**: Convert long URLs into short, shareable links
- **Click Tracking**: Monitor access counts for each shortened URL
- **Analytics Dashboard**: View statistics for all created URLs
- **User Authentication**: JWT-based authentication for URL management (real database mode)
- **Admin Interface**: Django admin panel for user management and backend administration
- **Mobile-Friendly**: Responsive design for all devices
- **Copy to Clipboard**: One-click sharing functionality
- **RESTful API**: Clean API endpoints for integration
- **Mock Mode**: Test without database setup using JSON file storage

## Tech Stack

**Backend**: Django 4.2.7, Django REST Framework, MySQL 8.0+ with PyMySQL  
**Frontend**: HTML5, CSS3, JavaScript ES6+, Tailwind CSS  
**Hosting**: Railway/Render (backend), Netlify/Vercel (frontend)

## Prerequisites

- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **MySQL 8.0+** - [Download](https://dev.mysql.com/downloads/mysql/)
- **Git** - [Download](https://git-scm.com/downloads)

[▶️ **Watch full setup video to install MySQL 8.0.42 (Recommended)**](https://youtu.be/C8cLGUuGsrQ?si=Iw1OTBq1aYEZvzCw)

Verify installation:

```bash
python --version && mysql --version && git --version
```

## Quick Start

### **Step 1: Clone and setup**

```bash
git clone https://github.com/HERALDEXX/url-shortener.git
```

```bash
cd url-shortener
```

```bash
cd backend && python -m venv venv
```

### **Step 2: Activate virtual environment**

```bash
# Windows
.\venv\Scripts\activate.bat
```

```bash
# macOS/Linux (Unix-based)
source venv/Scripts/activate
```

### **Step 3: Install dependencies and configure**

```bash
pip install -r requirements.txt
```

```bash
# Go back to root directory for shared .env
cd ..
```

```bash
# Windows
copy .env.example .env
```

```bash
# macOS/Linux (Unix-based)
cp .env.example .env
```

### **Step 4: Generate secret key and update .env**

```bash
cd backend
```

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

> Edit `.env` file (in root directory) and replace `SECRET_KEY` value with the generated key

### **Step 4.1: Set up MySQL database**

Before you fill in the database values in your `.env` file, make sure MySQL is installed and running on your system. By default, the MySQL username is `root` unless you have set up a different user. You can use `root` for local development, or create a new user and database if you prefer.

Edit `.env` file (in root directory) and replace `DATABASE_PASSWORD` value with your MySQL password.

> If your MySQL setup fails, ignore current step [(4.1)](#step-41-set-up-mysql-database) and [Step 5](#step-5-create-the-database-in-mysql) and come back to it later.

### **Step 5: Create the database in MySQL**

Open your terminal and run the following command to create the database (replace <your_mysql_user> with your MySQL username):

```bash
mysql -u <your_mysql_user> -p -e "CREATE DATABASE IF NOT EXISTS url_shortener CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### **Step 6: Create Django Admin User (Superuser) - Database Mode Only**

To access the Django admin panel in **database mode** (`USE_MOCK=false`), you must create a superuser account:

> **⚠️ Note:** Skip this step entirely if:
> - Using mock mode (`USE_MOCK=true`) - no superuser needed or possible in mock mode
> - MySQL setup failed - fix database connection first before creating superuser

#### **For Database Mode (MySQL working):**

1. Run migrations first:

```bash
python manage.py migrate
```

2. Create the superuser:

```bash
python manage.py createsuperuser
```

Follow the prompts to set a username, email, and password. Use these credentials to log in at http://localhost:8000/admin/ when backend server is running.

> **Note:** For your own reference, you may add your Django superuser username and email to your `.env` file as DJANGO_SUPERUSER_USERNAME and DJANGO_SUPERUSER_EMAIL. **Never store your superuser password in the `.env` file.** Use a secure password manager to keep your password safe.

### **Step 7: Mock Database Configuration**

The application supports two modes for data handling: mock data mode and real database mode. This is controlled by the `USE_MOCK` setting in your `.env` file.

**Modes:**

- `USE_MOCK=true` → Frontend fetches mock data from [`frontend/mock-data.json`](frontend/mock-data.json). Backend reflects any changes into mock database.
- `USE_MOCK=false` (**default**) → Frontend fetches real backend data from the Django API [(`http://localhost:8000/api`)](http://localhost:8000/api). Backend reflects any changes into real database (MySQL).

**Configure in your `.env` file:**

```env
USE_MOCK=false
```

> **✅ AUTOMATIC CONFIGURATION:** The frontend automatically fetches the `USE_MOCK` value from the backend's `/api/config/` endpoint, ensuring both frontend and backend always use the same mock setting. No manual configuration needed!

> **Mock Database Mode:** If MySQL setup failed or you want to run without a database, set `USE_MOCK=true` in your `.env` file. The frontend will automatically detect this and switch to mock mode, using `frontend/mock-data.json` for data storage. Authentication is disabled in this mode.

> **Real Database Mode:** For production use or testing with persistent data, keep `USE_MOCK=false`. Users must be created through the admin dashboard at [`http://localhost:8000/admin/`](http://localhost:8000/admin/) and log in through the frontend to manage URLs.

### **Step 8: Make Migrations**

> From `backend` directory and with virtual environment activated:

```bash
python manage.py makemigrations
```

```bash
python manage.py migrate
```

### **Step 8.1: Collect Static Files (for production)**

> When `DEBUG=False` (default) in your `.env` file, run the following command to gather all static files into the directory specified by `STATIC_ROOT`:

```bash
python manage.py collectstatic
```

> This ensures your static assets are served correctly in production.

### **Step 9: Run backend server**

```bash
python manage.py runserver
```

### **Step 10: Serve frontend (new terminal)**

> Open a separate terminal window/tab

> From project root directory:

```bash
cd frontend
```

```bash
python -m http.server 8080
```

### **Access:**

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api/
- Admin Panel: http://localhost:8000/admin/

**Stopping the Servers:**

- To stop either the backend or frontend server, go to the terminal window where it is running and press `Ctrl + C`.

## Authentication & User Management

### Real Database Mode (`USE_MOCK=false`)

**Authentication is required for URL management operations** including deleting URLs and accessing user-specific features.

#### Creating User Accounts

User accounts must be created through the Django admin dashboard:

1. **Start the backend server:**

   ```bash
   cd backend && python manage.py runserver
   ```

2. Access admin dashboard: [`http://localhost:8000/admin/`](http://localhost:8000/admin/)
3. Login with superuser credentials (created during setup)
4. Create new users:

   - Navigate to "Users" section
   - Click "Add User"
   - Set username and password
   - Optionally assign staff/admin permissions

#### Frontend Authentication

Users can then log in through the frontend interface:

- Enter username and password in the login form
- Authentication uses JWT tokens for secure API access
- Only authenticated users can delete URLs they own
- Staff users can delete any URL

### Mock Database Mode (`USE_MOCK=true`)

Authentication is bypassed in mock mode for testing convenience. All operations work without login requirements.

## Project Structure

```
url-shortener/
├── frontend/
│   ├── index.html
│   ├── config.js               # Configuration management
│   ├── mock-data.json          # Mock database for testing
│   ├── css/styles.css
│   └── js/app.js
├── backend/
│   ├── urlshortener/        # Django project
│   ├── urls/                # Django app
│   ├── manage.py
│   ├── requirements.txt
│   └── venv/
├── database/schema.sql      # Reference schema
├── .env                     # Shared environment file (not in git)
├── .env.example             # Environment template (shared by both frontend/backend)
└── README.md
```

## API Documentation

See [docs/API_CONTRACT.md](docs/API_CONTRACT.md) for full API specification details.

### Quick Reference

**Core Endpoints:**

- `POST /api/shorten` - Create shortened URL
- `GET /api/stats` - Get URL statistics
- `GET /{shortCode}` - Redirect to original URL
- `DELETE /api/urls/{shortCode}/` - Delete URL (auth required in real mode)

**Authentication (Real Database Mode):**

- `POST /api/token/` - Login and get JWT tokens
- `GET /api/me` - Get current user info

**System:**

- `GET /api/health` - Health check
- `GET /api/config/` - Get current mode (mock/real)

### Example Usage

```bash
# Shorten URL
curl -X POST http://localhost:8000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/long-url"}'
```

```bash
# Get statistics
curl http://localhost:8000/api/stats
```

```bash
# Login (real mode)
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_user", "password": "your_pass"}'
```

## Development

### Daily Workflow

- ```bash
  git pull origin dev
  ```

- Make your changes...

> Backend:

- ```bash
  # Windows
  cd backend && .\venv\Scripts\activate.bat
  ```

- ```bash
  # macOS/Linux
  cd backend && source venv/bin/activate
  ```

- ```bash
  python manage.py makemigrations
  python manage.py migrate
  ```

> Frontend (**Open separate terminal window/tab**)

- ```bash
  cd frontend && python -m http.server 8080
  ```

### Database Changes

```bash
python manage.py makemigrations
python manage.py migrate
```

### Testing

```bash
python manage.py test
```

### Create Admin User

```bash
python manage.py createsuperuser
```

## Branches

- [**main**](https://github.com/HERALDEXX/url-shortener/tree/main) → stable, production-ready code. This branch is protected: only merge into `main` after changes are reviewed, tested, and approved.
- [**dev**](https://github.com/HERALDEXX/url-shortener/tree/dev) (Default branch) → active development and beta features. Create feature branches off `dev` (e.g., `dev/feature/your-feature`) and open PRs against `dev`.

> - **PR targeting:** Default PR target is `dev`. Only open a PR against `main` if the issue/PR explicitly says it should go straight to `main` (hotfixes or release merges).
> - **Release process (summary):** When `dev` is stable and ready, open a release PR to merge `dev` into `main`. Tag releases and update changelog before merging to `main`.

## Deployment

### Environment Variables for Production

```env
SECRET_KEY=your-production-secret-key-50-chars
DEBUG=False
DATABASE_NAME=production_db_name
DATABASE_USER=production_user
DATABASE_PASSWORD=production_password
DATABASE_HOST=production_host
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

### Backend (Railway/Render)

1. Connect GitHub repository
2. Add environment variables
3. Deploy on push to main

### Frontend (Netlify/Vercel)

1. Connect GitHub repository
2. Set build directory to `frontend`
3. Update API URL in `js/app.js` to production backend URL

## Troubleshooting

**Backend won't start**

- Check MySQL is running
- Verify `.env` database credentials
- Ensure virtual environment is activated

**CORS errors**

- Check `CORS_ALLOWED_ORIGINS` in Django settings
- Verify frontend URL is included

**Database connection failed**

- Confirm MySQL service is running
- Check database exists: `CREATE DATABASE IF NOT EXISTS url_shortener;`
- Verify user permissions

**Frontend API calls failing**

- Confirm backend is running on correct port
- Check `API_BASE_URL` in `js/app.js`
- Inspect browser Network tab for errors

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Support**: Create an [issue](https://github.com/HERALDEXX/url-shortener/issues) for bugs or questions.
