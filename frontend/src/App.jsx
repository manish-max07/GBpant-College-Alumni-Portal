import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute, PublicRoute } from './components/AuthRoutes';
import AuthDebug from './components/AuthDebug';
import Home from './pages/Home';
import About from './pages/About';
import Network from './pages/Network';
import Events from './pages/Events';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import SetPassword from './pages/SetPassword';
import FirstTimeForm from './pages/FirstTimeForm';
import AlumniDashboard from './pages/AlumniDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AlumniList from './pages/AlumniList';
import StudentList from './pages/StudentList';
import Settings from './pages/Settings';
import CaptchaTest from './pages/CaptchaTest';
import DebugCaptcha from './pages/DebugCaptcha';
import NotFound from './pages/NotFound';
import AdminPanel from './components/AdminPanel';
import AdminPanelFixed from './components/AdminPanelWorkingFull';

function App() {
  return (
    <>
      <Routes>
        {/* Public routes - accessible to everyone, but redirect authenticated users */}
        <Route path="/" element={
          <PublicRoute redirectIfAuthenticated={false}>
            <Home />
          </PublicRoute>
        } />
        <Route path="/about" element={<About />} />
        <Route path="/network" element={<Network />} />
        <Route path="/events" element={<Events />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* Auth routes - redirect if already authenticated */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />
        <Route path="/verify-otp" element={
          <PublicRoute>
            <VerifyOtp />
          </PublicRoute>
        } />
        <Route path="/set-password" element={
          <PublicRoute>
            <SetPassword />
          </PublicRoute>
        } />
        
        {/* Protected routes - require authentication */}
        <Route path="/first-time" element={
          <ProtectedRoute>
            <FirstTimeForm />
          </ProtectedRoute>
        } />
        <Route path="/alumni-dashboard" element={
          <ProtectedRoute>
            <AlumniDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student-dashboard" element={
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/alumni-list" element={
          <ProtectedRoute>
            <AlumniList />
          </ProtectedRoute>
        } />
        <Route path="/student-list" element={
          <ProtectedRoute>
            <StudentList />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        
        {/* Debug/Test routes */}
        <Route path="/captcha-test" element={<CaptchaTest />} />
        <Route path="/debug-captcha" element={<DebugCaptcha />} />
        
        {/* Catch-all route for handling direct URL visits */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Add AuthDebug component for development */}
      <AuthDebug />
      
      {/* Admin Panel - only visible to admin users */}
      <AdminPanelFixed />
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;
