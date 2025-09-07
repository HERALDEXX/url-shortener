-- URL Shortener Database Schema for Django
-- MySQL 8.0+ Compatible

-- Create database (run this first)
CREATE DATABASE IF NOT EXISTS url_shortener 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE url_shortener;

-- Django will create these tables automatically, but this shows the structure
-- This is for reference and manual database setup if needed

-- URLs table (Django model: URLModel)
CREATE TABLE IF NOT EXISTS urls (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    original_url VARCHAR(2048) NOT NULL,
    short_code VARCHAR(10) NOT NULL UNIQUE,
    click_count INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    
    -- Indexes for better performance
    INDEX urls_short_code_idx (short_code),
    INDEX urls_created_at_idx (created_at),
    INDEX urls_click_count_idx (click_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Django's built-in tables (created automatically by migrations)
-- These are just for reference - Django creates them automatically:

-- django_migrations: Tracks applied migrations
-- django_content_type: Content type framework
-- auth_permission: Django permissions
-- auth_group: User groups
-- auth_user: User accounts
-- django_admin_log: Admin action logs
-- django_session: Session data

-- Sample data for testing (optional)
INSERT INTO urls (original_url, short_code, click_count, created_at, updated_at) VALUES 
('https://www.example.com/very-long-url-that-needs-shortening', 'abc123', 15, NOW(), NOW()),
('https://www.google.com', 'xyz789', 23, NOW(), NOW()),
('https://github.com/user/repository', 'def456', 7, NOW(), NOW()),
('https://stackoverflow.com/questions/example', 'stack1', 45, NOW(), NOW()),
('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'video1', 89, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    short_code = VALUES(short_code),
    updated_at = NOW();

-- Create database user for the application (optional, for production)
-- CREATE USER 'url_shortener_user'@'localhost' IDENTIFIED BY 'secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON url_shortener.* TO 'url_shortener_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Useful queries for monitoring:

-- Check all shortened URLs in the database
-- USE url_shortener;
-- SELECT * FROM urls;

-- Check specific number of most recent URLs (replace N with desired number, e.g., 5, 10, 20)
-- SELECT * FROM urls ORDER BY created_at DESC LIMIT N;

-- Check table structure
-- DESCRIBE urls;

-- View all URLs with stats
-- SELECT short_code, original_url, click_count, created_at FROM urls ORDER BY created_at DESC;

-- Get click statistics
-- SELECT 
--     COUNT(*) as total_urls,
--     SUM(click_count) as total_clicks,
--     AVG(click_count) as avg_clicks_per_url,
--     MAX(click_count) as max_clicks
-- FROM urls;