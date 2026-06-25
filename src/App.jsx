import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Upload from "./pages/Upload";
import MyFiles from "./pages/MyFiles";
import Homepage from "./pages/Homepage";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ResetPassword from './components/ResetPassword';
import Enable2FA from './components/Enable2FA';
import Verify2FA from "./components/Verify2FA";
import AuthCallback from "./pages/authCallback.jsx";
import { NavBar } from "./components/NavBar";
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { NotificationPreferencesProvider } from './contexts/NotificationPreferencesContext';



// ---------------------- Layout Wrapper ----------------------
function Layout({ user, children }) {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'
      }`}
    >
      {/* Glowing gradient orbs in background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl bg-cyan-500/10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl bg-purple-500/10"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <NavBar user={user} />
        <main className="p-0">{children}</main>
      </div>
    </div>
  );
}


// ---------------------- Loading Component ----------------------
function LoadingSpinner() {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-blue-900 via-blue-950 to-blue-900' 
        : 'bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50'
    }`}>
      <div className="text-center">
        <div className={`animate-spin h-10 w-10 border-b-2 rounded-full mx-auto mb-3 ${
          theme === 'dark' ? 'border-white' : 'border-gray-900'
        }`}></div>
        <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
          Loading...
        </p>
      </div>
    </div>
  );
}

// ---------------------- Protected Route Loading ----------------------
function ProtectedRouteLoading() {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-blue-900 via-blue-950 to-blue-900' 
        : 'bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50'
    }`}>
      <div className="text-center">
        <div className={`animate-spin h-10 w-10 border-b-2 rounded-full mx-auto mb-3 ${
          theme === 'dark' ? 'border-white' : 'border-gray-900'
        }`}></div>
        <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
          Verifying access...
        </p>
      </div>
    </div>
  );
}

// ---------------------- Routing Logic ----------------------
function AuthRoutes({ user, loading }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (location.pathname === '/login') {
      const verificationSuccess = sessionStorage.getItem('verification_success');
      const verificationError = sessionStorage.getItem('verification_error');
      
      if (verificationSuccess) {
        alert('✅ Email verified successfully! You can now log in.');
        sessionStorage.removeItem('verification_success');
      }
      
      if (verificationError) {
        alert('❌ Email verification failed: ' + verificationError);
        sessionStorage.removeItem('verification_error');
      }
    }
  }, [location.pathname]);
  

  useEffect(() => {
    // Prevent multiple simultaneous checks
    if (isChecking || loading) return;

    setIsChecking(true);
    
    const is2FARequired = sessionStorage.getItem('2fa_required') === 'true';
    const is2FAVerified = sessionStorage.getItem('2fa_verified') === 'true';
    const currentPath = location.pathname;

    console.log('🛡️ AuthRoutes Check:', { 
      currentPath, 
      user: !!user, 
      is2FARequired, 
      is2FAVerified,
      loading 
    });

    // Always allow public routes regardless of auth state
    const publicRoutes = ['/', '/login', '/register', '/reset-password', '/auth/callback'];
    if (publicRoutes.includes(currentPath)) {
      setIsChecking(false);
      return;
    }

    // User NOT authenticated
    if (!user) {
      if (currentPath !== '/verify-2fa') {
        console.log('🔐 No user, redirecting to login');
        navigate('/', { replace: true });
      }
      setIsChecking(false);
      return;
    }

    // User IS authenticated
    if (currentPath === '/verify-2fa') {
      // User is on verify-2fa page - allow access
      setIsChecking(false);
      return;
    }

    // Check 2FA requirements
    if (is2FARequired && !is2FAVerified) {
      // User needs 2FA verification for protected routes
      const protectedRoutes = ['/dashboard', '/upload', '/files', '/profile'];
      if (protectedRoutes.includes(currentPath)) {
        console.log('🔐 2FA required, redirecting to verification');
        navigate('/verify-2fa', { replace: true });
      }
    } else {
      // No 2FA required or already verified - handle normal redirects
      if (['/login', '/register'].includes(currentPath)) {
        navigate('/dashboard', { replace: true });
      }
    }

    setIsChecking(false);
  }, [user, loading, location.pathname, navigate, isChecking]);

  // Simplified popstate handler - only block navigation to protected routes
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const is2FARequired = sessionStorage.getItem('2fa_required') === 'true';
      const is2FAVerified = sessionStorage.getItem('2fa_verified') === 'true';
      
      if (is2FARequired && !is2FAVerified) {
        const protectedRoutes = ['/dashboard', '/upload', '/files', '/profile'];
        if (protectedRoutes.includes(currentPath)) {
          console.log('🚫 Blocking back navigation to protected route without 2FA');
          setTimeout(() => {
            navigate('/verify-2fa', { replace: true });
          }, 0);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {!user ? (
        // PUBLIC ROUTES
        <>
          <Route path="/" element={<Homepage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Homepage />} />
        </>
      ) : (
        // PROTECTED ROUTES
        <>
          <Route path="/verify-2fa" element={<Verify2FA />} />
          
          {/* Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Dashboard user={user} />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Upload Route */}
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Upload user={user} />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* My Files Route */}
          <Route
            path="/files"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <MyFiles />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Profile Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Profile user={user} />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect to dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Dashboard user={user} />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Catch all - redirect to dashboard */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <Layout user={user}>
                  <Dashboard user={user} />
                </Layout>
              </ProtectedRoute>
            }
          />
        </>
      )}
    </Routes>
  );
}

// Enhanced ProtectedRoute with additional safeguards
function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = () => {
      const is2FARequired = sessionStorage.getItem('2fa_required') === 'true';
      const is2FAVerified = sessionStorage.getItem('2fa_verified') === 'true';
      
      if (is2FARequired && !is2FAVerified) {
        console.log('🚫 ProtectedRoute: 2FA required but not verified');
        navigate('/verify-2fa', { replace: true });
        return;
      }
      setIsChecking(false);
    };

    const timer = setTimeout(checkAccess, 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  if (isChecking) {
    return <ProtectedRouteLoading />;
  }

  return children;
}

// ---------------------- Root App ----------------------
function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Email verification handler
  useEffect(() => {
    const handleEmailVerification = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const type = urlParams.get('type');
      
      console.log('🔐 Email verification callback detected:', { 
        token: token ? 'YES' : 'NO', 
        type,
        fullURL: window.location.href 
      });
      
      if (type === 'signup' && token) {
        try {
          setLoading(true);
          console.log('🔄 Verifying email token...', token.substring(0, 20) + '...');
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          });
          
          if (error) {
            console.error('❌ Email verification API error:', error);
            sessionStorage.setItem('verification_error', JSON.stringify({
              message: error.message,
              code: error.code,
              status: error.status
            }));
            window.location.href = '/login?error=verification_failed';
            return;
          }
          
          console.log('✅ Email verification successful:', data);
          
          const { data: sessionData } = await supabase.auth.getSession();
          console.log('🔄 Session after verification:', sessionData);
          
          sessionStorage.setItem('verification_success', 'true');
          window.location.href = '/login?message=email_verified_success';
          
        } catch (error) {
          console.error('❌ Email verification catch error:', error);
          sessionStorage.setItem('verification_error', error.toString());
          window.location.href = '/login?error=verification_exception';
        } finally {
          setLoading(false);
        }
      }
    };

    handleEmailVerification();
  }, []);

  return (
    <Router>
      <AuthRoutes user={user} loading={loading} />
    </Router>
  );
}

// ---------------------- Main App Export ----------------------
export default function App() {
  return (
    <NotificationPreferencesProvider>

    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
        </NotificationPreferencesProvider>

  );
}