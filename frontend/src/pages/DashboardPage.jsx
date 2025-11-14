import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { 
  Users, Sparkles, User, ArrowRight, 
  Code, Target, TrendingUp, Award, LogOut, Loader2 
} from 'lucide-react';

import { auth } from "@/firebaseConfig";        // ✅ Added
import { signOut } from "firebase/auth";        // ✅ Added

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}`;



export default function DashboardPage({ currentUser }) {
  const navigate = useNavigate();
  const [mentorMatches, setMentorMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [interviewProgress, setInterviewProgress] = useState(null);

  // ============================
  //  Show loading if user is null
  // ============================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ============================
  // Fetch mentor matches & interview prep
  // ============================
  useEffect(() => {
    if (currentUser?.id && (currentUser.role === "student" || currentUser.role === "both")) {
      fetchMentorMatches();
      fetchInterviewProgress();
    }
  }, [currentUser]);

  const fetchMentorMatches = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/mentorship/matches/${currentUser.id}`);
      setMentorMatches(response.data.matches || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInterviewProgress = async () => {
    try {
      const response = await axios.get(`${API}/interview-prep/progress/${currentUser.id}`);
      setInterviewProgress(response.data.profile);
    } catch (error) {
      console.error("Error fetching interview progress:", error);
    }
  };

  // ============================
  //  LOGOUT HANDLER (FULL FIX)
  // ============================
  const handleLogout = async () => {
    try {
      await signOut(auth);               // 🔥 Full Firebase logout
      localStorage.removeItem("currentUser");
      sessionStorage.clear();

      navigate("/login", { replace: true });
      window.location.reload();          // Reset all React state

    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to logout. Try again.");
    }
  };

  const hasTargetCompanies = currentUser?.target_companies?.length > 0;

  const [menuOpen, setMenuOpen] = useState(false);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">

      {/* ================= NAV BAR ================= */}
<nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md">
  <div className="container mx-auto px-4 py-4">

    {/* TOP BAR */}
    <div className="flex items-center justify-between">

      {/* LOGO */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate('/dashboard')}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">CareerConnect</span>
      </div>

      {/* DESKTOP MENU */}
      <div className="hidden md:flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Dashboard</Button>
        <Button variant="ghost" onClick={() => navigate('/ai-assistant')}>AI Assistant</Button>
        <Button variant="ghost" onClick={() => navigate('/resume-assistant')}>Resume Assistant</Button>
        <Button variant="ghost" onClick={() => navigate('/mentorship')}>Mentorship</Button>
        <Button variant="ghost" onClick={() => navigate('/interview-prep')}>Interview Prep</Button>
        <Button variant="ghost" onClick={() => navigate('/feed')}>Feed</Button>
        <Button variant="ghost" onClick={() => navigate('/jobs')}>Job Portal</Button>

        <Button variant="outline" onClick={() => navigate('/profile')}>
          <User className="w-4 h-4 mr-2" /> Profile
        </Button>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>

      {/* MOBILE MENU BUTTON */}
      <button
        className="md:hidden p-2 rounded-lg border border-gray-300"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

    </div>

    {/* MOBILE DROPDOWN MENU */}
    {menuOpen && (
      <div className="md:hidden mt-4 space-y-2 pb-3 animate-fadeIn">
        <Button className="w-full" variant="ghost" onClick={() => navigate('/dashboard')}>Dashboard</Button>
        <Button className="w-full" variant="ghost" onClick={() => navigate('/ai-assistant')}>AI Assistant</Button>
        <Button className="w-full" variant="ghost" onClick={() => navigate('/resume-assistant')}>Resume Assistant</Button>
        <Button className="w-full" variant="ghost" onClick={() => navigate('/mentorship')}>Mentorship</Button>
        <Button className="w-full" variant="ghost" onClick={() => navigate('/interview-prep')}>Interview Prep</Button>
        <Button className="w-full" variant="ghost" onClick={() => navigate('/feed')}>Feed</Button>
        <Button className="w-full" variant="ghost" onClick={() => navigate('/jobs')}>Job Portal</Button>

        <Button className="w-full" variant="outline" onClick={() => navigate('/profile')}>
          <User className="w-4 h-4 mr-2" /> Profile
        </Button>

        <Button
          className="w-full text-red-600 hover:bg-red-50"
          variant="ghost"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>
    )}

  </div>
</nav>


      {/* ================= MAIN CONTENT ================= */}
      <div className="container mx-auto px-4 py-8">

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {currentUser.name}! 👋
          </h1>
          <p className="text-gray-600">Here's what's happening with your career journey</p>
        </div>

        {/* Interview prep stats */}
        {hasTargetCompanies && interviewProgress && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Your Interview Prep Progress</h2>
              <Button variant="outline" size="sm" onClick={() => navigate('/interview-prep')}>
                View Details
              </Button>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {/* Card 1 */}
              <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700 font-medium">Solved</p>
                    <p className="text-2xl font-bold text-green-900">
                      {interviewProgress?.solved_questions?.length || 0}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Card 2 */}
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Readiness</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {Math.round(interviewProgress?.readiness_score || 0)}%
                    </p>
                  </div>
                </div>
              </Card>

              {/* Card 3 */}
              <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Target Companies</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {currentUser?.target_companies?.length || 0}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Card 4 */}
              <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <Code className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-700 font-medium">Strong Topics</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {interviewProgress?.strong_topics?.length || 0}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>

          <div className="grid md:grid-cols-4 gap-6">

            <Card
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => navigate('/ai-assistant')}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">AI Career Assistant</h3>
            </Card>

            <Card
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer group bg-gradient-to-br from-purple-50 to-purple-100"
              onClick={() => navigate('/interview-prep')}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Interview Prep</h3>
            </Card>

            <Card
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => navigate('/mentorship')}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Find Mentors</h3>
            </Card>

            <Card
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => navigate('/profile')}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Complete Profile</h3>
            </Card>

          </div>
        </div>

        {/* ================= Mentor Recommendation Section ================= */}
        {(currentUser.role === "student" || currentUser.role === "both") && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recommended Mentors For You</h2>
              <Button variant="outline" onClick={() => navigate('/mentorship')}>
                View All
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-500">Loading recommendations...</p>
              </div>
            ) : mentorMatches.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900">No Mentor Matches Yet</h3>
                <p className="text-gray-600 mb-4">
                  Complete your profile to get personalized mentor recommendations
                </p>
                <Button onClick={() => navigate('/profile')}>Complete Profile</Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mentorMatches.slice(0, 3).map((match, index) => (
                  <Card key={match.mentor.id} className="p-6 hover:shadow-lg transition-shadow">

                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {match.mentor.name.charAt(0)}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {match.mentor.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {match.mentor.current_role || "Professional"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        {match.compatibility_score}% Match
                      </Badge>
                      {match.mentor.mentor_profile?.years_experience > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {match.mentor.mentor_profile.years_experience}+ yrs
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {match.mentor.bio || "Experienced professional ready to guide you"}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {match.mentor.skills?.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {match.mentor.skills?.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{match.mentor.skills.length - 3} more
                        </span>
                      )}
                    </div>

                    <Button
                      onClick={() => navigate('/mentorship')}
                      variant="outline"
                      className="w-full hover:bg-blue-50 hover:border-blue-300"
                    >
                      View Profile
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
