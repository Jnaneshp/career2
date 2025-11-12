import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Firebase authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          console.log("✅ Firebase user detected:", user.email);

          // Check if user exists in backend
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

  // ✅ Protected Route Component (with localStorage fallback)
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      );
    }

    const storedUser = localStorage.getItem("currentUser");
    const finalUser = currentUser || (storedUser ? JSON.parse(storedUser) : null);

    if (!finalUser) return <Navigate to="/login" replace />;
    if (finalUser.onboarding_required) return <Navigate to="/onboarding" replace />;
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
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage setCurrentUser={setCurrentUser} />
              </ProtectedRoute>
            }
          />

          {/* 🔒 Protected Routes */}
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

          {/* 💼 Jobs Route */}
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobsPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />

          {/* 📰 Feed Route (NEW) */}
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <FeedPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />

          {/* 💬 Chat Route */}
          <Route
            path="/chat/:roomId"
            element={
              <ProtectedRoute>
                <ChatPage currentUser={currentUser} />
              </ProtectedRoute>
            }
          />

          {/* 🎥 Video Call Route */}
          <Route
            path="/video-call/:roomId"
            element={
              <ProtectedRoute>
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
