# Student Management System

A modern, responsive, and full-featured School Management System built with the **PERN Stack** (PostgreSQL/MySQL, Express, React, Node.js). This application provides distinct portals for **Teachers** and **Students** to manage attendance, profiles, and academic activities.

## 🚀 Features

### 🎓 Student Portal
- **Dashboard**: View personal profile, class details, and roll number.
- **Attendance Overview**: Real-time attendance percentage and total present days.
- **Calendar View**: Visual history of attendance with color-coded indicators (Green for Present, Red for Absent).
- **Responsive Design**: Mobile-friendly interface with card layouts.

### 👨‍🏫 Teacher Portal
- **Dashboard Stats**: Quick view of total students and daily attendance status.
- **Student Management**: Add new students with automatic ID generation.
- **Attendance Marking**: 
  - Mark attendance for specific classes and dates.
  - "Bulk Save" feature for efficiency.
- **Defaulters List**: Automatically identifies students with **< 75% attendance** and provides a one-click email button.
- **Monthly Reports**: Detailed monthly attendance sheets with percentage calculations and visual alerts.
- **Mobile Support**: Bottom tab navigation for easy use on mobile devices.

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Lucide React (Icons), Axios.
- **Backend**: Node.js, Express.js.
- **Database**: MySQL (using `mysql2` driver).
- **Authentication**: JWT (JSON Web Tokens) & Bcrypt for security.

## ⚙️ Installation & Setup

### Prerequisites
- Node.js installed.
- MySQL Server installed and running.

### 1. Clone the Repository
```bash
git clone <repository_url>
cd SchoolManagement/Project
```

### 2. Backend Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

**Database Configuration**:
1. Create a MySQL database (e.g., `school_db`).
2. Configure the `.env` file in the `server` directory:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_password
   DB_NAME=school_db
   JWT_SECRET=your_jwt_secret
   ```
3. Run the database initialization (if scripts are provided) or allow the server to handle simple schema checks.

**Start the Server**:
```bash
npx nodemon index.js
```
The server will run on `http://localhost:5000`.

### 3. Frontend Setup
Navigate to the client directory and install dependencies:
```bash
cd ../client
npm install
```

**Start the React App**:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## 📂 Project Structure

```
Project/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── api/            # Axios setup
│   │   ├── context/        # Auth & Toast Contexts
│   │   ├── pages/          # Dashboard & Login Pages
│   │   └── ...
├── server/                 # Node.js Backend
│   ├── controllers/        # Business Logic
│   ├── middleware/         # Auth Middleware
│   ├── routes/             # API Routes
│   └── ...
└── README.md
```

## 🔒 Default Credentials (for testing)
- **Teacher/Admin Login**: `admin@school.com` / `admin123`
- **Student Login**: Use credentials created via the Teacher Portal.

## 🎨 UI/UX Design
The application features a dark-themed, premium aesthetic using:
- **Glassmorphism** effects.
- **Gradient** accents (Indigo/Purple).
- **Tailwind CSS** for rapid and consistent styling.
