-- ===================================================================
-- POSTGRESQL DATABASE SCHEMA FOR SCHOOL MANAGEMENT SYSTEM
-- ===================================================================
-- This file defines the database structure for the application.
-- It creates tables for users, students, teachers, and attendance.
-- 
-- KEY DIFFERENCES FROM MySQL:
-- 1. PostgreSQL uses SERIAL instead of AUTO_INCREMENT
-- 2. PostgreSQL has native UUID type support
-- 3. ENUMs are created as separate types in PostgreSQL
-- 4. No "USE database" statement (connect directly to the database)
-- ===================================================================

-- Create custom ENUM types for PostgreSQL
-- These define allowed values for specific columns
CREATE TYPE user_role AS ENUM ('STUDENT', 'TEACHER');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'HOLIDAY');

-- ===================================================================
-- USERS TABLE
-- ===================================================================
-- Stores authentication credentials for all users (students & teachers)
-- The 'role' field determines whether the user is a student or teacher
-- 
-- RELATIONSHIP: One user can be either ONE student OR ONE teacher
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,                        -- Unique identifier (UUID format)
    email VARCHAR(255) UNIQUE NOT NULL,         -- Login email (must be unique)
    password_hash VARCHAR(255) NOT NULL,        -- Encrypted password (never store plain text!)
    role user_role NOT NULL,                    -- Either 'STUDENT' or 'TEACHER'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Account creation time
);

-- ===================================================================
-- STUDENTS TABLE
-- ===================================================================
-- Stores student-specific information (profile data)
-- Each student record links to ONE user account via user_id
-- 
-- RELATIONSHIP: students.user_id → users.id (Foreign Key)
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,                      -- Auto-incrementing student ID
    user_id UUID,                               -- Links to users table (can be NULL if user deleted)
    name VARCHAR(255) NOT NULL,                 -- Full name of student
    class_name VARCHAR(50),                     -- Class/Section (e.g., "10th-A")
    roll_no INT,                                -- Roll number within the class
    student_id_code VARCHAR(50) UNIQUE,         -- Human-readable ID (e.g., "STD001")
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    -- ON DELETE SET NULL: if user is deleted, student record remains but user_id becomes NULL
);

-- ===================================================================
-- TEACHERS TABLE
-- ===================================================================
-- Stores teacher-specific information (profile data)
-- Each teacher record links to ONE user account via user_id
-- 
-- RELATIONSHIP: teachers.user_id → users.id (Foreign Key)
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,                      -- Auto-incrementing teacher ID
    user_id UUID,                               -- Links to users table
    name VARCHAR(255) NOT NULL,                 -- Full name of teacher
    subject VARCHAR(100),                       -- Subject taught (optional)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ===================================================================
-- ATTENDANCE TABLE
-- ===================================================================
-- Stores daily attendance records for students
-- Each record represents ONE student's attendance for ONE specific date
-- 
-- RELATIONSHIPS:
-- - attendance.student_id → students.id (Foreign Key)
-- 
-- UNIQUE CONSTRAINT:
-- - One student can only have ONE attendance record per date
-- - This prevents duplicate entries for the same student on the same day
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,                      -- Auto-incrementing attendance record ID
    student_id INT,                             -- Which student (links to students table)
    date DATE NOT NULL,                         -- Which date (YYYY-MM-DD format)
    status attendance_status NOT NULL,          -- 'PRESENT', 'ABSENT', or 'HOLIDAY'
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    -- ON DELETE CASCADE: if student is deleted, all their attendance records are also deleted
    CONSTRAINT unique_attendance UNIQUE (student_id, date)
    -- This ensures we can't have duplicate attendance entries for same student on same date
);
