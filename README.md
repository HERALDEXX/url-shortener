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
- **Mobile-Friendly**: Responsive design for all devices
- **Copy to Clipboard**: One-click sharing functionality
- **RESTful API**: Clean API endpoints for integration
- **Admin Interface**: Django admin panel for backend management

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

**Step 1: Clone and setup**

```bash
git clone https://github.com/HERALDEXX/url-shortener.git
```

```bash
cd url-shortener
```

```bash
cd backend && python -m venv venv
```

**Step 2: Activate virtual environment**

```bash
# Windows
.\venv\Scripts\activate.bat
```

```bash
# macOS/Linux
source venv/bin/activate
```

**Step 3: Install dependencies and configure**

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
# macOS/Linux
cp .env.example .env
```

**Step 4: Generate secret key and update .env**

```bash
cd backend
```

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**Step 4.5: Set up MySQL before configuring your .env**

Before you fill in the database values in your `.env` file, make sure MySQL is installed and running on your system. By default, the MySQL username is `root` unless you have set up a different user. You can use `root` for local development, or create a new user and database if you prefer.

Edit `.env` file (in root directory) and replace `SECRET_KEY` with the generated key, then update `DATABASE_PASSWORD` with your MySQL password.

**Step 5: Create the database in MySQL**

Open your terminal and run the following command to create the database (replace <your_mysql_user> with your MySQL username):

```bash
mysql -u <your_mysql_user> -p -e "CREATE DATABASE IF NOT EXISTS url_shortener CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

**Step 6: Create Django Admin User (Superuser)**

To access the Django admin panel, you must create a superuser account if you haven't already:

```bash
python manage.py createsuperuser
```

Follow the prompts to set a username, email, and password. Use these credentials to log in at http://localhost:8000/admin/

> **Note:** For your own reference, you may add your Django superuser username and email to your `.env` file as DJANGO_SUPERUSER_USERNAME and DJANGO_SUPERUSER_EMAIL. **Never store your superuser password in the `.env` file.** Use a secure password manager to keep your password safe.

**Step 7: Run backend server**

```bash
python manage.py runserver
```

**Step 8: Serve frontend (new terminal)**

> Open a separate terminal window/tab

```bash
# From project root
cd frontend
```

```bash
python -m http.server 8080
```

**Access:**

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api/
- Admin Panel: http://localhost:8000/admin/

**Stopping the Servers:**

- To stop either the backend or frontend server, go to the terminal window where it is running and press `Ctrl + C`.

## Project Structure

```
url-shortener/
├── frontend/
│   ├── index.html
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

**Base URL**: `http://localhost:8000/api/`

### POST /shorten

Create short URL

```json
// Request
{"url": "https://example.com/long-url"}

// Response
{"shortCode": "abc123", "originalUrl": "https://example.com/long-url"}
```

### GET /stats

Get all URLs with click statistics

```json
[
  {
    "shortCode": "abc123",
    "originalUrl": "https://example.com",
    "clickCount": 15
  }
]
```

### GET /{shortCode}

Redirects to original URL and increments click count

- Success: `301 Redirect`
- Not found: `404 Error`

### GET /health

Health check endpoint

```json
{ "status": "healthy", "service": "url-shortener", "version": "1.0.0" }
```

## Development

### Daily Workflow

- ```bash
  git pull origin dev
  ```

- Make your changes...

- ```bash
  # Backend
  cd backend && source venv/bin/activate  # or .\venv\Scripts\activate.bat
  python manage.py runserver
  ```

- ```bash
  # Frontend (separate terminal window/tab)
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

## Authors

- Backend Developer - [**@HERALDEXX**](https://github.com/HERALDEXX)
- Frontend Developer - [**@Emafido**](https://github.com/Emafido)

---

**Support**: Create an [issue](https://github.com/HERALDEXX/url-shortener/issues) for bugs or questions.
