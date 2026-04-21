import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import { AuthProvider } from './context/AuthContext';
import CreateStudent from './pages/admin/CreateStudent';
import StudentList from './pages/admin/StudentList';
import ManageFees from './pages/admin/ManageFees';
import CreateSemester from './pages/admin/CreateSemester';
import CreateFeeStructure from './pages/admin/CreateFeeStructure';
import CreateInstallmentPlan from './pages/admin/CreateInstallmentPlan';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPaymentHistory from './pages/admin/AdminPaymentHistory';
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentFees from './pages/student/StudentFees';
import StudentHistory from './pages/student/StudentHistory';
import StudentRequests from './pages/student/StudentRequests';
import AdminRequests from './pages/admin/AdminRequests';
import Settings from './pages/shared/Settings';
import FeeReminders from './pages/admin/FeeReminders';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<StudentList />} />
          <Route path="students/new" element={<CreateStudent />} />
          <Route path="fees" element={<ManageFees />} />
          <Route path="semesters/new" element={<CreateSemester />} />
          <Route path="fees/new" element={<CreateFeeStructure />} />
          <Route path="installments/new" element={<CreateInstallmentPlan />} />
          <Route path="history" element={<AdminPaymentHistory />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="reminders" element={<FeeReminders />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="history" element={<StudentHistory />} />
          <Route path="requests" element={<StudentRequests />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Redirect root to login for now */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
