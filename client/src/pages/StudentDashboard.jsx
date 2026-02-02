import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const [profile, setProfile] = useState(null);
    const [summary, setSummary] = useState({ percentage: 0, total_present: 0, total_days: 0 });
    const [rawAttendance, setRawAttendance] = useState([]);

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchDashboard();
        fetchCalendar();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/student/dashboard');
            setProfile(res.data.profile);
            setSummary(res.data.attendance_summary);
        } catch (err) {
            console.error(err);
            addToast('Failed to load profile', 'error');
        }
    };

    const fetchCalendar = async () => {
        try {
            const res = await api.get('/student/calendar');
            setRawAttendance(res.data);
        } catch (err) {
            console.error(err);
            addToast('Failed to load attendance history', 'error');
        }
    };

    // Calendar Helper Functions
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
        setCurrentDate(new Date(newDate));
    };

    const renderCalendarGrid = () => {
        const totalDays = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells for padding
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-gray-800/30 rounded-lg"></div>);
        }

        // Correctly handling local date strings for comparison
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 1-12

        for (let day = 1; day <= totalDays; day++) {
            // Format date as YYYY-MM-DD to match API
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const record = rawAttendance.find(r => r.date === dateStr);

            let statusColor = "bg-gray-700/30 border-gray-700 text-gray-500";
            let statusText = "";

            if (record) {
                if (record.status === 'PRESENT') {
                    statusColor = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400";
                    statusText = "Present";
                } else if (record.status === 'ABSENT') {
                    statusColor = "bg-red-500/20 border-red-500/50 text-red-400";
                    statusText = "Absent";
                } else {
                    statusColor = "bg-gray-600/20 border-gray-600/50 text-gray-400";
                    statusText = record.status;
                }
            }

            days.push(
                <div key={day} className={`h-full w-full rounded-lg border p-1 md:p-2 flex flex-col justify-between transition-all hover:scale-105 ${statusColor}`}>
                    <span className="font-bold text-xs md:text-base">{day}</span>
                    {statusText && <span className="text-[8px] md:text-xs font-semibold uppercase tracking-wider hidden sm:block">{statusText}</span>}
                    {/* Mobile dot indicator */}
                    {statusText && <span className={`w-1.5 h-1.5 rounded-full sm:hidden self-end ${record.status === 'PRESENT' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>}
                </div>
            );
        }
        return days;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-10">
            {/* Navbar */}
            <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400">
                                <User size={20} />
                            </div>
                            <span className="font-bold text-lg tracking-tight text-white">Student Portal</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-400 text-sm hidden sm:block">Hello, {profile?.name || user?.name}</span>
                            <button onClick={logout} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Profile Card */}
                    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-sm col-span-1 md:col-span-2 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg shrink-0">
                            {profile?.name?.charAt(0) || 'S'}
                        </div>
                        <div className="w-full">
                            <h2 className="text-2xl font-bold text-white">{profile?.name}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 border-t border-gray-800 pt-4">
                                <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">ID Code</p>
                                    <p className="font-mono text-white text-lg">{profile?.id_code || '---'}</p>
                                </div>
                                <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Class</p>
                                    <p className="text-white text-lg">{profile?.class || '---'}</p>
                                </div>
                                <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Roll No</p>
                                    <p className="text-white text-lg">{profile?.roll_no || '---'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Percentage */}
                    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[200px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent"></div>
                        <p className="text-gray-400 relative z-10 w-full text-center uppercase text-xs tracking-widest font-semibold">Attendance</p>
                        <h3 className={`text-6xl font-bold mt-4 relative z-10 ${summary.percentage >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {summary.percentage}%
                        </h3>
                        <div className="mt-4 inline-flex items-center gap-2 bg-gray-950 px-3 py-1 rounded-full border border-gray-800 z-10">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <p className="text-xs text-gray-400">
                                {summary.total_present} / {summary.total_days} Days
                            </p>
                        </div>
                    </div>
                </div>

                {/* Calendar Section */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-sm overflow-hidden p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400"><ChevronRight size={16} /></span>
                            History
                        </h3>
                        <div className="flex items-center gap-4 bg-gray-950 rounded-xl p-1 border border-gray-800">
                            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"><ChevronLeft size={18} /></button>
                            <span className="min-w-[120px] text-center font-medium text-sm">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </span>
                            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"><ChevronRight size={18} /></button>
                        </div>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 gap-1 md:gap-4 mb-2 text-center text-gray-500 text-[10px] md:text-xs font-semibold uppercase tracking-widest">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 md:gap-4">
                        {renderCalendarGrid().map((dayNode, i) => (
                            <div key={i} className="aspect-square md:aspect-auto md:h-24">
                                {dayNode}
                            </div>
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
};

export default StudentDashboard;
