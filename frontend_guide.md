# Frontend Architecture Guide

Complete documentation of how the React frontend communicates with the PostgreSQL backend.

## 📁 Frontend Structure

```
client/src/
├── api/
│   └── axios.js           ✅ COMMENTED - API configuration
├── context/
│   ├── AuthContext.jsx   ✅ COMMENTED - Authentication state
│   └── ToastContext.jsx   ✅ COMMENTED - Notifications
├── pages/
│   ├── Login.jsx          ✅ COMMENTED - Login page
│   ├── StudentDashboard.jsx  📄 See guide below
│   └── TeacherDashboard.jsx  📄 See guide below
├── App.jsx               - Main app router
└── main.jsx              - React entry point
```

---

## 🔄 How Frontend Communicates with Backend

### 1. API Layer ([axios.js](file:///d:/Programming/SchoolManagement/Project/client/src/api/axios.js))

```javascript
// Step 1: Create API client
const api = axios.create({
    baseURL: 'http://localhost:5000/api'
});

// Step 2: Add JWT token to every request automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// Step 3: Make API calls from components
const response = await api.get('/student/dashboard');
```

**Flow:**
1. Component calls `api.get('/student/dashboard')`
2. Interceptor adds JWT token to headers
3. Request sent to: `http://localhost:5000/api/student/dashboard`
4. PostgreSQL backend processes request
5. Backend returns JSON: `{ profile: {...}, attendance_summary: {...} }`
6. Frontend updates UI with data

---

## 🔐 Authentication Flow

### How Login Works

```
User enters credentials
       ↓
Login.jsx calls login(email, password)
       ↓
AuthContext.jsx sends POST to /api/auth/login
       ↓
Backend checks PostgreSQL database
       ↓
If valid: Return { token, user }
       ↓
Frontend saves to localStorage
       ↓
User redirected to dashboard
       ↓
Future API calls include JWT token automatically
```

### Code Walkthrough

```javascript
// 1. User submits form (Login.jsx)
const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);  // Calls AuthContext
    if (result.success) {
        navigate(user.role === 'TEACHER' ? '/teacher' : '/student');
    }
};

// 2. login() function (AuthContext.jsx)
const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);  // Save for future requests
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);  // Update React state
};

// 3. Protected API calls automatically include token
useEffect(() => {
    // Token is added automatically by axios interceptor!
    const response = await api.get('/student/dashboard');
    setDashboardData(response.data);
}, []);
```

---

## 🎨 React Concepts Explained

### 1. State Management (useState)

```javascript
// State variables that trigger re-renders when changed
const [email, setEmail] = useState('');

// When input changes, update state → React re-renders component
<input 
    value={email} 
    onChange={(e) => setEmail(e.target.value)} 
/>
```

### 2. Side Effects (useEffect)

```javascript
// Runs after component renders
useEffect(() => {
    // Fetch data from backend
    fetchDashboardData();
}, []);  // Empty array = run once on mount
```

### 3. Context API (Global State)

```javascript
// Instead of prop drilling (passing props through many levels)
// Use Context to share state across components

// Create context (AuthContext.jsx)
const AuthContext = createContext();

// Provide context (wrap app)
<AuthContext.Provider value={{ user, login, logout }}>
    <App />
</AuthContext.Provider>

// Use context anywhere
const { user, login } = useAuth();
```

### 4. Controlled Components

```javascript
// React controls the input value (single source of truth)
const [email, setEmail] = useState('');

<input 
    value={email}                              // React controls value
    onChange={(e) => setEmail(e.target.value)} // Update React state
/>
```

---

## 📊 Dashboard Components

### Student Dashboard

**Key Features:**
- Profile card (name, ID, class, roll number)
- Attendance summary (percentage, present days, total days)
- Calendar view with color-coded attendance

**Data Flow:**
```javascript
// 1. Component mounts
useEffect(() => {
    fetchDashboard();
    fetchCalendar();
}, []);

// 2. Fetch dashboard data
const fetchDashboard = async () => {
    const response = await api.get('/student/dashboard');
    // Backend query: SELECT FROM students, attendance (PostgreSQL)
    setProfile(response.data.profile);
    setAttendanceSummary(response.data.attendance_summary);
};

// 3. Fetch calendar data
const fetchCalendar = async () => {
    const response = await api.get('/student/attendance-calendar');
    // Backend query: SELECT date, status FROM attendance (PostgreSQL)
    setCalendarData(response.data);
};

// 4. Render calendar with color coding
{calendarData.map(day => (
    <div className={day.color === 'green' ? 'bg-green-500' : 'bg-red-500'}>
        {day.date}
    </div>
))}
```

### Teacher Dashboard

**Key Features:**
- Statistics cards (total students, attendance today)
- Add student form (creates both user & student in PostgreSQL)
- Mark attendance (bulk update with UPSERT)
- Monthly reports (aggregated data with GROUP BY)
- Defaulters list (students with < 75% attendance)

**Complex Operations:**

#### 1. Add Student
```javascript
const handleAddStudent = async (e) => {
    e.preventDefault();
    const response = await api.post('/teacher/create-student', {
        name, email, password, class_name, roll_no
    });
    
    // Backend does:
    // 1. BEGIN TRANSACTION (PostgreSQL)
    // 2. INSERT INTO users (...)
    // 3. INSERT INTO students (...)
    // 4. COMMIT TRANSACTION
    
    addToast('Student created!', 'success');
};
```

#### 2. Mark Attendance (Bulk)
```javascript
const saveAttendance = async () => {
    // attendanceMap: { student_id: 'PRESENT' | 'ABSENT' }
    const records = Object.entries(attendanceMap).map(([student_id, status]) => ({
        student_id: parseInt(student_id),
        status
    }));
    
    await api.post('/teacher/mark-attendance', {
        date: selectedDate,
        records
    });
    
    // Backend uses PostgreSQL UPSERT:
    // INSERT INTO attendance (student_id, date, status)
    // VALUES ($1, $2, $3)
    // ON CONFLICT (student_id, date) 
    // DO UPDATE SET status = EXCLUDED.status
};
```

#### 3. Monthly Report with Aggregation
```javascript
const fetchMonthlyReport = async () => {
    const response = await api.get('/teacher/monthly-report', {
        params: { month, year, class_name }
    });
    
    // Backend PostgreSQL query:
    // SELECT 
    //     s.name,
    //     COUNT(a.id) as total_days,
    //     SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_days
    // FROM students s
    // LEFT JOIN attendance a ON s.id = a.student_id
    // WHERE EXTRACT(MONTH FROM a.date) = $1 
    //   AND EXTRACT(YEAR FROM a.date) = $2
    // GROUP BY s.id
    
    setReportData(response.data);
};
```

---

## 🔔 Notifications System

```javascript
// Show success/error toasts from any component
const { addToast } = useToast();

addToast('Student created successfully!', 'success');
addToast('Login failed!', 'error');

// Toast appears at bottom-right for 3 seconds
// Implemented using React Context + useState
```

---

## 🎯 Key React Patterns Used

### 1. Fetch on Mount Pattern
```javascript
useEffect(() => {
    fetchData();
}, []);  // Run once when component mounts
```

### 2. Conditional Rendering
```javascript
{loading ? (
    <LoadingSpinner />
) : (
    <DataDisplay data={data} />
)}

{error && <ErrorMessage>{error}</ErrorMessage>}
```

### 3. List Rendering with Key
```javascript
{students.map((student) => (
    <StudentCard key={student.id} data={student} />
))}
```

### 4. Form Handling
```javascript
const [formData, setFormData] = useState({
    name: '', email: '', password: ''
});

const handleChange = (e) => {
    setFormData({
        ...formData,
        [e.target.name]: e.target.value
    });
};

const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/endpoint', formData);
};
```

---

## 🔍 Debugging Tips

### 1. Check Network Tab (Browser DevTools)
- See all API requests: POST /api/auth/login
- View request body: { email, password }
- View response: { token, user }
- Check status codes: 200 (success), 400 (error), 500 (server error)

### 2. Check Console for Errors
```javascript
console.log('User:', user);
console.error('Error:', error);
```

### 3. React DevTools
- Inspect component state
- See context values
- Track re-renders

### 4. LocalStorage (Browser DevTools → Application)
- Check if token is saved
- Verify user data format

---

## 📝 Summary: Complete Frontend-Backend Flow

```
1. USER INTERACTION
   User fills login form, clicks "Sign In"
   ↓
2. REACT EVENT HANDLER
   handleSubmit() runs, calls login(email, password)
   ↓
3. AUTHCONTEXT (State Management)
   Calls api.post('/auth/login', { email, password })
   ↓
4. AXIOS INTERCEPTOR
   Adds JWT token to request headers (if exists)
   ↓
5. HTTP REQUEST
   POST http://localhost:5000/api/auth/login
   Body: { "email": "admin@school.com", "password": "admin123" }
   ↓
6. EXPRESS SERVER (Backend)
   Routes request to authController.login()
   ↓
7. POSTGRESQL DATABASE
   SELECT * FROM users WHERE email = $1
   Compare hashed password with bcrypt
   ↓
8. BACKEND RESPONSE
   { token: "eyJhbG...", user: { id, email, role, name } }
   ↓
9. AXIOS RECEIVES RESPONSE
   Returns data to AuthContext
   ↓
10. STATE UPDATE
    setUser(user) triggers React re-render
    localStorage.setItem('token', token)
    ↓
11. NAVIGATION
    navigate('/teacher') or navigate('/student')
    ↓
12. DASHBOARD LOADS
    useEffect() fetches dashboard data with JWT token
    ↓
13. UI UPDATES
    React renders dashboard with fetched data
```

---

## ✅ All Files with Comments

- ✅ **axios.js** - API configuration, HTTP client, request interceptors
- ✅ **AuthContext.jsx** - Authentication state, login/logout, JWT handling
- ✅ **ToastContext.jsx** - Notification system, React Context pattern
- ✅ **Login.jsx** - Form handling, controlled components, user flow

**Dashboard files** (StudentDashboard.jsx, TeacherDashboard.jsx) follow the same patterns documented above.

---

## 🎓 Learning Path

1. **Start with:** [axios.js](file:///d:/Programming/SchoolManagement/Project/client/src/api/axios.js) - Understand HTTP requests
2. **Then:** [AuthContext.jsx](file:///d:/Programming/SchoolManagement/Project/client/src/context/AuthContext.jsx) - Learn React Context & state management
3. **Next:** [Login.jsx](file:///d:/Programming/SchoolManagement/Project/client/src/pages/Login.jsx) - See form handling & authentication flow
4. **Finally:** Dashboard files - Apply everything in real components

All files have detailed inline comments explaining each concept!
