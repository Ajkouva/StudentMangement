import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Users, UserPlus, Calendar, LogOut, CheckCircle, XCircle, AlertTriangle, Mail, BarChart2 } from 'lucide-react';

const TeacherDashboard = () => {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const [stats, setStats] = useState({ total_students: 0, present_today: 0, absent_today: 0 });
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, attendance, add-student, defaulters
    const [students, setStudents] = useState([]);
    const [defaulters, setDefaulters] = useState([]);
    const [monthlyReport, setMonthlyReport] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedClass, setSelectedClass] = useState('All');
    const [availableClasses, setAvailableClasses] = useState([]);
    const [loading, setLoading] = useState(false);

    // Stats
    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/teacher/dashboard');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Attendance
    useEffect(() => {
        if (activeTab === 'attendance') {
            fetchAttendanceSheet();
        }
    }, [date, activeTab, selectedClass]);

    useEffect(() => {
        if (activeTab === 'defaulters') {
            fetchDefaulters();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'monthly') {
            fetchMonthlyReport();
        }
    }, [activeTab, selectedMonth, selectedYear, selectedClass]);

    const fetchMonthlyReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/teacher/monthly-report?month=${selectedMonth}&year=${selectedYear}&class_name=${selectedClass}`);
            setMonthlyReport(res.data);

            // Extract classes if needed, similar to attendance
            if (activeTab === 'monthly' && selectedClass === 'All') {
                const classes = [...new Set(res.data.map(s => s.class_name))].filter(Boolean);
                if (classes.length > 0) setAvailableClasses(['All', ...classes.sort()]);
            }
        } catch (err) {
            console.error(err);
            addToast('Failed to load monthly report', 'error');
        }
        setLoading(false);
    };

    const fetchDefaulters = async () => {
        setLoading(true);
        try {
            const res = await api.get('/teacher/low-attendance');
            setDefaulters(res.data);
        } catch (err) {
            console.error(err);
            addToast('Failed to load defaulters', 'error');
        }
        setLoading(false);
    };

    const fetchAttendanceSheet = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/teacher/attendance-sheet?date=${date}&class_name=${selectedClass}`);
            setStudents(res.data);

            // Extract unique classes for filter if we are loading for the first time or blindly
            // Ideally should be a separate API, but we can derive from data if 'All' is selected
            if (activeTab === 'attendance' && selectedClass === 'All') {
                const classes = [...new Set(res.data.map(s => s.class_name))].filter(Boolean);
                if (classes.length > 0) setAvailableClasses(['All', ...classes.sort()]);
            }

        } catch (err) {
            console.error(err);
            addToast('Failed to load attendance', 'error');
        }
        setLoading(false);
    };

    const markAttendance = (studentId, status) => {
        setStudents(prev => prev.map(s =>
            s.student_id === studentId ? { ...s, status } : s
        ));
    };

    const saveAttendance = async () => {
        try {
            const records = students
                .filter(s => s.status) // Only send marked ones
                .map(s => ({ student_id: s.student_id, status: s.status }));

            await api.post('/teacher/attendance/bulk', { date, records });
            addToast('Attendance saved successfully!', 'success');
            fetchStats(); // Update stats
        } catch (err) {
            addToast('Failed to save attendance', 'error');
        }
    };

    // Add Student Form
    const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '', class_name: '', roll_no: '' });
    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/teacher/students/create', newStudent);
            addToast('Student created successfully!', 'success');
            setNewStudent({ name: '', email: '', password: '', class_name: '', roll_no: '' });
            fetchStats();
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to create student', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-20 md:pb-8">
            {/* Navbar */}
            <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400">
                                <Users size={20} />
                            </div>
                            <span className="font-bold text-lg tracking-tight text-white hidden sm:block">Teacher Portal</span>
                            <span className="font-bold text-lg tracking-tight text-white sm:hidden">Portal</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-400 text-sm hidden sm:block">Welcome, {user?.name}</span>
                            <button onClick={logout} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Mobile Tab Navigation (Bottom Bar) */}
                <div className="fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-800 md:hidden z-40 flex justify-around p-2">
                    <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'dashboard' ? 'text-indigo-400' : 'text-gray-500'}`}>
                        <Users size={20} />
                        <span className="text-xs mt-1">Dash</span>
                    </button>
                    <button onClick={() => setActiveTab('attendance')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'attendance' ? 'text-indigo-400' : 'text-gray-500'}`}>
                        <Calendar size={20} />
                        <span className="text-xs mt-1">Attend</span>
                    </button>
                    <button onClick={() => setActiveTab('add-student')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'add-student' ? 'text-indigo-400' : 'text-gray-500'}`}>
                        <UserPlus size={20} />
                        <span className="text-xs mt-1">Add</span>
                    </button>
                    <button onClick={() => setActiveTab('defaulters')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'defaulters' ? 'text-indigo-400' : 'text-gray-500'}`}>
                        <AlertTriangle size={20} />
                        <span className="text-xs mt-1">Faults</span>
                    </button>
                    <button onClick={() => setActiveTab('monthly')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'monthly' ? 'text-indigo-400' : 'text-gray-500'}`}>
                        <BarChart2 size={20} />
                        <span className="text-xs mt-1">Report</span>
                    </button>
                </div>

                {/* Desktop Tab Navigation */}
                <div className="hidden md:flex gap-2 mb-8 bg-gray-900 p-1 rounded-xl w-fit border border-gray-800">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'attendance' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        Take Attendance
                    </button>
                    <button
                        onClick={() => setActiveTab('add-student')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'add-student' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        Add Student
                    </button>
                    <button
                        onClick={() => setActiveTab('defaulters')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'defaulters' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        Defaulters
                    </button>
                    <button
                        onClick={() => setActiveTab('monthly')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'monthly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        Monthly Report
                    </button>
                </div>

                {/* Dashboard View */}
                {activeTab === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-sm">
                            <h3 className="text-gray-500 text-sm font-medium">Total Students</h3>
                            <p className="text-4xl font-bold mt-2 text-white">{stats.total_students}</p>
                        </div>
                        <div className="bg-emerald-950/30 p-6 rounded-2xl border border-emerald-900/50 shadow-sm">
                            <h3 className="text-emerald-500 text-sm font-medium">Present Today</h3>
                            <p className="text-4xl font-bold mt-2 text-emerald-400">{stats.present_today}</p>
                        </div>
                        <div className="bg-red-950/30 p-6 rounded-2xl border border-red-900/50 shadow-sm">
                            <h3 className="text-red-500 text-sm font-medium">Absent Today</h3>
                            <p className="text-4xl font-bold mt-2 text-red-400">{stats.absent_today}</p>
                        </div>
                    </div>
                )}

                {/* Attendance View */}
                {activeTab === 'attendance' && (
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-lg font-bold text-white">Attendance Register</h2>
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full sm:w-auto bg-gray-950 border border-gray-700 text-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="All">All Classes</option>
                                    {availableClasses.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full sm:w-auto bg-gray-950 border border-gray-700 text-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                                <button
                                    onClick={saveAttendance}
                                    className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-6 py-2 rounded-lg font-semibold text-sm transition-all"
                                >
                                    Save
                                </button>
                            </div>
                        </div>

                        <div className="p-4 md:p-0">
                            {loading ? (
                                <div className="p-8 text-center text-gray-400">Loading students...</div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <table className="w-full text-left border-collapse hidden md:table">
                                        <thead>
                                            <tr className="bg-gray-950/50 text-gray-500 border-b border-gray-800">
                                                <th className="p-4 font-medium text-xs uppercase tracking-wider">Roll No</th>
                                                <th className="p-4 font-medium text-xs uppercase tracking-wider">Student Name</th>
                                                <th className="p-4 font-medium text-xs uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map((student) => (
                                                <tr key={student.student_id} className="border-b border-gray-800 last:border-0">
                                                    <td className="p-4 text-gray-300 font-mono text-sm">{student.roll_no}</td>
                                                    <td className="p-4 font-medium text-white">{student.name}</td>
                                                    <td className="p-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => markAttendance(student.student_id, 'PRESENT')}
                                                                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${student.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-500 border border-transparent'}`}
                                                            >
                                                                <CheckCircle size={14} /> Present
                                                            </button>
                                                            <button
                                                                onClick={() => markAttendance(student.student_id, 'ABSENT')}
                                                                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${student.status === 'ABSENT' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-800 text-gray-500 border border-transparent'}`}
                                                            >
                                                                <XCircle size={14} /> Absent
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Mobile Cards */}
                                    <div className="flex flex-col gap-3 md:hidden">
                                        {students.map((student) => (
                                            <div key={student.student_id} className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-mono text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded">#{student.roll_no}</span>
                                                        <span className="font-semibold text-white">{student.name}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">{student.class_name || 'N/A'}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => markAttendance(student.student_id, 'PRESENT')} className={`p-2 rounded-lg transition-all ${student.status === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-600'}`}>
                                                        <CheckCircle size={20} />
                                                    </button>
                                                    <button onClick={() => markAttendance(student.student_id, 'ABSENT')} className={`p-2 rounded-lg transition-all ${student.status === 'ABSENT' ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-600'}`}>
                                                        <XCircle size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Add Student View */}
                {activeTab === 'add-student' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-sm">
                            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                                <UserPlus size={20} className="text-indigo-400" /> Add Student
                            </h2>
                            <form onSubmit={handleAddStudent} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-gray-400 font-medium">Full Name</label>
                                        <input type="text" required className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-white transition-colors"
                                            value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-gray-400 font-medium">Class</label>
                                        <input type="text" required className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-white transition-colors"
                                            value={newStudent.class_name} onChange={e => setNewStudent({ ...newStudent, class_name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-gray-400 font-medium">Roll Number</label>
                                        <input type="number" required className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-white transition-colors"
                                            value={newStudent.roll_no} onChange={e => setNewStudent({ ...newStudent, roll_no: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-gray-400 font-medium">Email Address</label>
                                        <input type="email" required className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-white transition-colors"
                                            value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-xs text-gray-400 font-medium">Temporary Password</label>
                                        <input type="text" required className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm focus:border-indigo-500 outline-none text-white transition-colors"
                                            value={newStudent.password} onChange={e => setNewStudent({ ...newStudent, password: e.target.value })} />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-white text-gray-900 font-semibold py-2.5 rounded-lg hover:bg-gray-100 transition-colors mt-2">
                                    Create Account
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Defaulters View */}
                {activeTab === 'defaulters' && (
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-800">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <AlertTriangle className="text-red-400" size={24} />
                                Low Attendance List (<span className="text-red-400">{'< 75%'}</span>)
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">Students appearing here need immediate attention.</p>
                        </div>

                        <div className="p-4 md:p-0">
                            {loading ? (
                                <div className="p-8 text-center text-gray-400">Loading data...</div>
                            ) : defaulters.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center">
                                    <div className="bg-emerald-500/10 p-4 rounded-full mb-4">
                                        <CheckCircle size={40} className="text-emerald-400" />
                                    </div>
                                    <h3 className="text-emerald-400 font-medium text-lg">All caught up!</h3>
                                    <p className="text-gray-500 mt-1">No students have low attendance.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                    {defaulters.map((s, idx) => (
                                        <div key={idx} className="bg-gray-950 border border-gray-800 rounded-xl p-5 hover:border-red-500/30 transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{s.name}</h3>
                                                    <p className="text-gray-500 text-sm">{s.class_name} • Roll: {s.roll_no}</p>
                                                </div>
                                                <div className="bg-red-500/10 text-red-400 px-2 py-1 rounded text-xs font-bold border border-red-500/20">
                                                    {s.percentage}%
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Total Days</span>
                                                    <span className="text-gray-300">{s.total_days}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Present</span>
                                                    <span className="text-gray-300">{s.present_days}</span>
                                                </div>
                                            </div>

                                            <a href={`mailto:${s.email}`} className="flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-indigo-600 hover:text-white text-gray-400 border border-gray-800 hover:border-indigo-500 py-2.5 rounded-lg transition-all text-sm font-medium">
                                                <Mail size={16} /> Contact Student
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Monthly Report View */}
                {activeTab === 'monthly' && (
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <BarChart2 className="text-indigo-400" size={24} />
                                Monthly Report
                            </h2>
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full sm:w-auto bg-gray-950 border border-gray-700 text-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="All">All Classes</option>
                                    {availableClasses.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full sm:w-auto bg-gray-950 border border-gray-700 text-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="w-full sm:w-auto bg-gray-950 border border-gray-700 text-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                    {[2024, 2025, 2026, 2027].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-4 md:p-0">
                            {loading ? (
                                <div className="p-8 text-center text-gray-400">Loading report...</div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <table className="w-full text-left border-collapse hidden md:table">
                                        <thead>
                                            <tr className="bg-gray-950/50 text-gray-500 border-b border-gray-800">
                                                <th className="p-4 font-medium text-xs uppercase tracking-wider">Student</th>
                                                <th className="p-4 font-medium text-xs uppercase tracking-wider">Class</th>
                                                <th className="p-4 font-medium text-xs uppercase tracking-wider text-center">Total Days</th>
                                                <th className="p-4 font-medium text-xs uppercase tracking-wider text-center">Present</th>
                                                <th className="p-4 font-medium text-xs uppercase tracking-wider text-right">Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {monthlyReport.map((s) => (
                                                <tr key={s.student_id} className="border-b border-gray-800 last:border-0 hover:bg-gray-950/50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-semibold text-white">{s.name}</div>
                                                        <div className="text-xs text-gray-500 font-mono">Roll: {s.roll_no}</div>
                                                    </td>
                                                    <td className="p-4 text-gray-400 text-sm">{s.class_name}</td>
                                                    <td className="p-4 text-center text-gray-300 font-mono">{s.total_days}</td>
                                                    <td className="p-4 text-center text-emerald-400 font-bold font-mono">{s.present_days}</td>
                                                    <td className="p-4 text-right">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${parseFloat(s.percentage) < 75 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                            {s.percentage}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Mobile Cards */}
                                    <div className="flex flex-col gap-3 md:hidden">
                                        {monthlyReport.map((s) => (
                                            <div key={s.student_id} className="bg-gray-950 border border-gray-800 p-4 rounded-xl">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-white text-lg">{s.name}</h3>
                                                        <div className="text-xs text-gray-500">{s.class_name} • Roll: {s.roll_no}</div>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${parseFloat(s.percentage) < 75 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                        {s.percentage}%
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="bg-gray-900 p-2 rounded-lg text-center border border-gray-800">
                                                        <div className="text-gray-500 text-xs">Total Days</div>
                                                        <div className="font-mono text-white">{s.total_days}</div>
                                                    </div>
                                                    <div className="bg-gray-900 p-2 rounded-lg text-center border border-gray-800">
                                                        <div className="text-gray-500 text-xs">Present</div>
                                                        <div className="font-mono text-emerald-400">{s.present_days}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default TeacherDashboard;
