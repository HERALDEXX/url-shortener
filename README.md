# URL Shortener

[![License](https://img.shields.io/github/license/HERALDEXX/url-shortener)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/downloads/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12%2B-blue.svg)](https://www.postgresql.org/download/)
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
- **User Authentication**: JWT-based authentication for URL management
- **Admin Interface**: Django admin panel for user management and backend administration
- **Mobile-Friendly**: Responsive design for all devices
- **Copy to Clipboard**: One-click sharing functionality
- **RESTful API**: Clean API endpoints for integration

## Tech Stack

**Backend**: Django 4.2.7, Django REST Framework, PostgreSQL 12+ with psycopg2  
**Frontend**: HTML5, CSS3, JavaScript ES6+, Tailwind CSS  
**Hosting**: Railway/Render (backend), Netlify/Vercel (frontend)

## Prerequisites

- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **PostgreSQL 12+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/downloads)

[📖 **PostgreSQL setup guide (Recommended)**](https://www.postgresql.org/docs/current/tutorial-install.html)

Verify installation:

```bash
python --version && psql --version && git --version
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
# Unix-based (macOS, Linux, etc)
source venv/bin/activate
```

### **Step 3: Install dependencies and configure**

```bash
pip install -r requirements.txt
cd ..  # Go back to root directory for shared .env

# Windows
copy .env.example .env
```

```bash
# Unix-based (macOS, Linux, etc)
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

### **Step 5: Create the database and user in PostgreSQL**

Open your terminal and connect to PostgreSQL:

> Connect to PostgreSQL as superuser (superuser is `postgres` by default, change if different):

```bash
psql -U postgres
```

> For Linux (if `psql` command not found):

```bash
sudo -u postgres psql
```

Then create the database and user:

```sql
-- Create database
CREATE DATABASE url_shortener;

-- Create user with password
-- Replace 'your_postgresql_password' with your desired password for the user url_shortener_user
CREATE USER url_shortener_user WITH ENCRYPTED PASSWORD 'your_postgresql_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE url_shortener TO url_shortener_user;

-- Connect to the database
\c url_shortener;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO url_shortener_user;

-- Exit
\q
```

### **Step 6: Set up PostgreSQL database**

Edit `.env` file (in root directory) and replace the values for:

- `DATABASE_PASSWORD` with the password you set for `url_shortener_user` in [Step 5](#step-5-create-the-database-and-user-in-postgresql)
- `DATABASE_HOST` **if only** you are using a custom host, otherwise leave as `localhost`
- `DATABASE_PORT` **if only** you set a custom port, otherwise leave as `5432`

### **Step 7: Run Django migrations**

> From `backend` directory with virtual environment activated:

```bash
python manage.py makemigrations
python manage.py migrate
```

### **Step 8: Create Django Admin User (Superuser)**

To access the Django admin panel, create a superuser account:

```bash
python manage.py createsuperuser
```

Follow the prompts to set a username, email, and password. Use these credentials to log in at [http://localhost:8000/admin/](http://localhost:8000/admin/) when the backend server is running.

### **Step 9: Collect Static Files (for production)**

> When `DEBUG=False` (default) in your `.env` file, run the following command to gather all static files:

> From backend directory:

```bash
python manage.py collectstatic
```

### **Step 10: Run backend server**

```bash
python manage.py runserver
```

### **Step 11: Serve frontend (new terminal)**

> Open a separate terminal window/tab

> From project root directory:

```bash
cd frontend
python -m http.server 8080
```

### **Access:**

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api/
- Admin Panel: http://localhost:8000/admin/

**Stopping the Servers:**

- To stop either the backend or frontend server, go to the terminal window where it is running and press `Ctrl + C`.

## Authentication & User Management

**Authentication is required for URL management operations** including deleting URLs and accessing user-specific features.

### Creating User Accounts

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

### Frontend Authentication

Users can then log in through the frontend interface:

- Enter username and password in the login form
- Authentication uses JWT tokens for secure API access
- Only authenticated users can delete URLs they own
- Staff users can delete any URL

## Project Structure

```
url-shortener/
├── frontend/
│   ├── index.html
│   ├── config.js               # Configuration management
│   ├── css/styles.css
│   └── js/app.js
├── backend/
│   ├── urlshortener/        # Django project
│   ├── urls/                # Django app
│   ├── manage.py
│   ├── requirements.txt
│   └── venv/               # Python virtual environment (not in version control)
├── database/postgresql_schema.sql      # PostgreSQL reference schema
├── .env                     # Shared environment file (not in version control)
├── .env.example             # Environment template
└── README.md
```

## API Documentation

See [docs/API_CONTRACT.md](docs/API_CONTRACT.md) for full API specification details.

### Quick Reference

**Core Endpoints:**

- `POST /api/shorten` - Create shortened URL
- `GET /api/stats` - Get URL statistics
- `GET /{shortCode}` - Redirect to original URL
- `DELETE /api/urls/{shortCode}/` - Delete URL (auth required)

**Authentication:**

- `POST /api/token/` - Login and get JWT tokens
- `GET /api/me` - Get current user info

**System:**

- `GET /api/health` - Health check

### Example Usage

```bash
# Shorten URL
curl -X POST http://localhost:8000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/long-url"}'

# Get statistics
curl http://localhost:8000/api/stats

# Login
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_user", "password": "your_pass"}'
```

## Development

### Daily Workflow

```bash
git pull origin dev
```

Make your changes...

> Backend:

```bash
# Windows
cd backend && .\venv\Scripts\activate.bat
```

```bash
# Unix-based (macOS, Linux, etc)
cd backend && source venv/bin/activate
```

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

> Frontend (**Open separate terminal window/tab**)

```bash
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

### Database Management

#### Check PostgreSQL connection

```bash
python manage.py dbshell
```

#### View migration status

```bash
python manage.py showmigrations
```

#### Reset database (development only)

```bash
# Connect to PostgreSQL
psql -U postgres

# Drop and recreate database
DROP DATABASE IF EXISTS url_shortener;
CREATE DATABASE url_shortener;
GRANT ALL PRIVILEGES ON DATABASE url_shortener TO url_shortener_user;

# Exit and run migrations
\q
python manage.py migrate
```

## Branches

- [**main**](https://github.com/HERALDEXX/url-shortener/tree/main) → stable, production-ready code. This branch is protected: only merge into `main` after changes are reviewed, tested, and approved.
- [**dev**](https://github.com/HERALDEXX/url-shortener/tree/dev) (Default branch) → active development and beta features. Create feature branches off `dev` (e.g., `dev/feature/your-feature`) and open PRs against `dev`.

## Deployment

### Environment Variables for Production

```env
SECRET_KEY=your-production-secret-key-50-chars
DEBUG=False
DATABASE_NAME=production_db_name
DATABASE_USER=production_user
DATABASE_PASSWORD=production_password
DATABASE_HOST=production_host
DATABASE_PORT=5432
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

### Using DATABASE_URL (Heroku/Railway style)

```env
DATABASE_URL=postgresql://user:password@host:port/database_name
```

### Backend (Railway/Render)

1. Connect GitHub repository
2. Add environment variables (or DATABASE_URL)
3. Deploy on push to main

### Frontend (Netlify/Vercel)

1. Connect GitHub repository
2. Set build directory to `frontend`
3. Update API URL in `js/app.js` to production backend URL

## Troubleshooting

**Backend won't start**

- Check PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or `brew services list | grep postgresql` (macOS)
- Verify `.env` database credentials
- Ensure virtual environment is activated
- Test database connection: `python manage.py dbshell`

**Database connection failed**

- Confirm PostgreSQL service is running
- Check database exists: `psql -U postgres -l | grep url_shortener`
- Verify user permissions:
  ```sql
  psql -U postgres
  \c url_shortener;
  \du url_shortener_user;
  ```
- Test connection manually: `psql -U url_shortener_user -d url_shortener -h localhost`

**Migration errors**

- Check migration status: `python manage.py showmigrations`
- Reset migrations (development only):
  ```bash
  rm backend/urls/migrations/0*.py
  python manage.py makemigrations urls
  python manage.py migrate
  ```

**CORS errors**

- Check `CORS_ALLOWED_ORIGINS` in Django settings
- Verify frontend URL is included

**Frontend API calls failing**

- Confirm backend is running on correct port
- Check browser Network tab for errors

**PostgreSQL specific issues**

- **Connection refused**: Ensure PostgreSQL is running and accepting connections
- **Authentication failed**: Check username/password in `.env`
- **Database does not exist**: Create database using the commands in Step 6
- **Permission denied**: Ensure user has proper database privileges

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Support**: Create an [issue](https://github.com/HERALDEXX/url-shortener/issues) for bugs or questions.
