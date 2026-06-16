import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RoutePlanner from './pages/RoutePlanner';
import AIVision from './pages/AIVision';
import Sensors from './pages/Sensors';
import Alerts from './pages/Alerts';
import Community from './pages/Community';
import Complaints from './pages/Complaints';
import About from './pages/About';
import Hardware from './pages/Hardware';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#555' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isLogin = location.pathname === '/login';
  const showShell = !isLanding && !isLogin;

  return (
    <div className="app-layout">
      {showShell && <Sidebar />}
      {showShell && <Navbar />}
      <div className={showShell ? 'main-content' : ''} style={!showShell ? { width: '100%' } : undefined}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/route-planner" element={<ProtectedRoute><RoutePlanner /></ProtectedRoute>} />
          <Route path="/ai-vision" element={<ProtectedRoute><AIVision /></ProtectedRoute>} />
          <Route path="/sensors" element={<ProtectedRoute><Sensors /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/community" element={<Community />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/about" element={<About />} />
          <Route path="/hardware" element={<ProtectedRoute><Hardware /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId="414730021498-invo88mfak0fcriogq0r75u9q3cbmd1f.apps.googleusercontent.com">
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <AppLayout />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
