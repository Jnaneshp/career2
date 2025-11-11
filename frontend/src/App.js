import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import OnboardingPage from '@/pages/OnboardingPage';
import ProfilePage from '@/pages/ProfilePage';
import AIAssistantPage from '@/pages/AIAssistantPage';
import MentorshipPage from '@/pages/MentorshipPage';
import DashboardPage from '@/pages/DashboardPage';
import InterviewPrepPage from '@/pages/InterviewPrepPage';
import CodeEditorPage from '@/pages/CodeEditorPage';
import { auth } from '@/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import axios from 'axios';
import ResumeAssistantPage from '@/pages/ResumeAssistantPage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}`;

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Firebase authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          console.log('✅ Firebase user detected:', user.email);

          // Check if user exists in backend
          const res = await axios.get(`${API}/users`, {
            params: { query: user.email },
          });

          if (res.data.length > 0) {
            const dbUser = res.data[0];
            setCurrentUser(dbUser);
            localStorage.setItem('currentUser', JSON.stringify(dbUser));
          } else {
            console.log('🆕 New Firebase user, needs onboarding');
            setCurrentUser({
              firebase_uid: user.uid,
              email: user.email,
              name: user.displayName || '',
              onboarding_required: true,
            });
          }
        } else {
          console.log('🚪 No Firebase user — logging out');
          setCurrentUser(null);
          localStorage.removeItem('currentUser');
        }
      } catch (error) {
        console.error('Error syncing user with backend:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Protected Route Component
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      );
    }
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }
    if (currentUser.onboarding_required) {
      return <Navigate to="/onboarding" replace />;
    }
    return children;
  };

  // ✅ Public Route (redirect if already authenticated)
  const PublicRoute = ({ children }) => {
    if (currentUser && !currentUser.onboarding_required) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  // ✅ Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading CareerConnect...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <HomePage setCurrentUser={setCurrentUser} />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage setCurrentUser={setCurrentUser} />
              </PublicRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage setCurrentUser={setCurrentUser} />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage
                  currentUser={currentUser}
                  setCurrentUser={setCurrentUser}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-assistant"
            element={
              <ProtectedRoute>
                <AIAssistantPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/resume-assistant" 
            element={
              <ProtectedRoute>
                <ResumeAssistantPage currentUser={currentUser} />
              </ProtectedRoute>
            } 
          />

          <Route
            path="/mentorship"
            element={
              <ProtectedRoute>
                <MentorshipPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview-prep"
            element={
              <ProtectedRoute>
                <InterviewPrepPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview-prep/question/:questionId"
            element={
              <ProtectedRoute>
                <CodeEditorPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster />
    </div>
  );
}

export default App;
