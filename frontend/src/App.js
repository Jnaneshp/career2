// src/App.js
import { useState, useEffect } from "react";
import "@/App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import axios from "axios";
import { auth } from "@/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

// ✅ Page Imports
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import OnboardingPage from "@/pages/OnboardingPage";
import ProfilePage from "@/pages/ProfilePage";
import AIAssistantPage from "@/pages/AIAssistantPage";
import MentorshipPage from "@/pages/MentorshipPage";
import DashboardPage from "@/pages/DashboardPage";
import InterviewPrepPage from "@/pages/InterviewPrepPage";
import JobsPage from "@/pages/JobsPage";
import CodeEditorPage from "@/pages/CodeEditorPage";
import ResumeAssistantPage from "@/pages/ResumeAssistantPage";
import ChatPage from "@/pages/ChatPage";
import VideoCallPage from "@/pages/VideoCallPage";
import FeedPage from "@/pages/FeedPage"; // 📰 NEW Feed page

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}`;

// ✅ Protected Route wrapper that avoids onboarding redirect loops
function ProtectedRoute({ children, currentUser, loading }) {
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const storedUser = localStorage.getItem("currentUser");
  const finalUser = currentUser || (storedUser ? JSON.parse(storedUser) : null);

  if (!finalUser) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Avoid infinite redirect when user already on onboarding page
  if (
    finalUser.onboarding_required &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Firebase authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          console.log("✅ Firebase user detected:", user.email);

          const res = await axios.get(`${API}/users`, {
            params: { query: user.email },
          });

          if (res.data.length > 0) {
            const dbUser = res.data[0];
            setCurrentUser(dbUser);
            localStorage.setItem("currentUser", JSON.stringify(dbUser));
          } else {
            console.log("🆕 New Firebase user, needs onboarding");
            setCurrentUser({
              firebase_uid: user.uid,
              email: user.email,
              name: user.displayName || "",
              onboarding_required: true,
            });
          }
        } else {
          console.log("🚪 No Firebase user — logging out");
          setCurrentUser(null);
          localStorage.removeItem("currentUser");
        }
      } catch (error) {
        console.error("Error syncing user with backend:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Public Route (redirect if already authenticated)
  const PublicRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      );
    }

    const storedUser = localStorage.getItem("currentUser");
    const finalUser = currentUser || (storedUser ? JSON.parse(storedUser) : null);

    if (finalUser && !finalUser.onboarding_required) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  // ✅ Global Loading Screen
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

  // ✅ App Routes
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* 🌐 Public Routes */}
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

          {/* 🧭 Onboarding Route (not wrapped in ProtectedRoute to avoid loop) */}
          <Route
            path="/onboarding"
            element={
              <OnboardingPage
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
              />
            }
          />

          {/* 🔒 Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <DashboardPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
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
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <AIAssistantPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-assistant"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <ResumeAssistantPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentorship"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <MentorshipPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview-prep"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <InterviewPrepPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview-prep/question/:questionId"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <CodeEditorPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <JobsPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feed"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <FeedPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:roomId"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <ChatPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/video-call/:roomId"
            element={
              <ProtectedRoute currentUser={currentUser} loading={loading}>
                <VideoCallPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />

          {/* 🧭 Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster />
    </div>
  );
}

export default App;
