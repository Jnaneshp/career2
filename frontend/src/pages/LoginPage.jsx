// src/pages/LoginPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, LogIn, Users } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider as provider } from '@/firebaseConfig';
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}`;

export default function LoginPage({ setCurrentUser }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      // 🔹 Step 1: Google Sign-In
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user?.email) {
        toast.error("Could not fetch your email from Google.");
        return;
      }

      // 🔹 Step 2: Check if user exists in backend
      const res = await axios.get(`${API}/users`, {
        params: { query: user.email },
      });

      if (res.data.length > 0) {
        // ✅ Existing user → Save and redirect to dashboard
        const existingUser = res.data[0];
        localStorage.setItem("currentUser", JSON.stringify(existingUser));
        setCurrentUser(existingUser);
        toast.success(`Welcome back, ${existingUser.name || "User"}!`);
        navigate("/dashboard");
      } else {
        // 🆕 New user → Redirect to onboarding
        toast.info("New user detected! Let’s complete your profile.");
        navigate("/onboarding");
      }
    } catch (error) {
      console.error("Google login failed:", error);
      toast.error("Google sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Card className="p-10 max-w-md w-full text-center shadow-xl border border-gray-200">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Welcome to CareerConnect
          </h1>
          <p className="text-gray-600 mb-8">
            Sign in securely using your Google account to get started.
          </p>

          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-6 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting to Google...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign in with Google
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
