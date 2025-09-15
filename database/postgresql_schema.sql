-- URL Shortener Database Schema for PostgreSQL
-- PostgreSQL 12+ Compatible

-- Create database (run this first as superuser)
-- CREATE DATABASE url_shortener WITH ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';

-- Use the database
-- \c url_shortener;

-- URLs table (Django will create this, but here's the reference)
CREATE TABLE IF NOT EXISTS urls (
    id BIGSERIAL PRIMARY KEY,
    original_url VARCHAR(2048) NOT NULL,
    short_code VARCHAR(10) NOT NULL UNIQUE,
    click_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    owner_id BIGINT REFERENCES auth_user(id) ON DELETE SET NULL,
    
    -- Indexes for better performance
    CONSTRAINT urls_short_code_unique UNIQUE (short_code)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS urls_short_code_idx ON urls(short_code);
CREATE INDEX IF NOT EXISTS urls_created_at_idx ON urls(created_at);
CREATE INDEX IF NOT EXISTS urls_click_count_idx ON urls(click_count);
CREATE INDEX IF NOT EXISTS urls_owner_id_idx ON urls(owner_id);

-- Sample data for testing (optional)
INSERT INTO urls (original_url, short_code, click_count, created_at, updated_at) VALUES 
('https://www.example.com/very-long-url-that-needs-shortening', 'abc123', 15, NOW(), NOW()),
('https://www.google.com', 'xyz789', 23, NOW(), NOW()),
('https://github.com/user/repository', 'def456', 7, NOW(), NOW()),
('https://stackoverflow.com/questions/example', 'stack1', 45, NOW(), NOW()),
('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'video1', 89, NOW(), NOW())
ON CONFLICT (short_code) DO UPDATE SET 
    short_code = EXCLUDED.short_code,
    updated_at = NOW();

-- Check all shortened URLs in the database
-- \c url_shortener;
-- SELECT * FROM urls;    

-- Check table structure
-- \d urls;

-- Get click statistics
-- SELECT 
--     COUNT(*) AS total_urls,
--     SUM(click_count) AS total_clicks,
--     AVG(click_count::numeric) AS avg_clicks_per_url,
--     MAX(click_count) AS max_clicks
-- FROM urls;