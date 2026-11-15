import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, token, adminUser, adminToken, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // ============ ADMIN ROUTES ============
  if (allowedRoles.includes('admin')) {
    if (!adminToken || !adminUser) {
      return <Navigate to="/dw-admin" replace />;
    }
    if (adminUser.role !== 'admin') {
      return <Navigate to="/dw-admin" replace />;
    }
    return children;
  }

  // ============ USER ROUTES (Owner/Driver) ============
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to their correct dashboard
    if (user.role === 'owner') {
      return <Navigate to="/boatownerdashboard" replace />;
    } else if (user.role === 'driver') {
      return <Navigate to="/boatdriverdashboard" replace />;
    } else if (user.role === 'transport_manager') {
      return <Navigate to="/transport" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;