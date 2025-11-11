import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import axios from 'axios';
import { toast } from 'sonner';
import { Users, Sparkles, Target, ArrowRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}`;

export default function HomePage({ setCurrentUser }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      // Check if user exists
      const response = await axios.get(`${API}/users?query=${email}`);
      
      if (response.data && response.data.length > 0) {
        const user = response.data[0];
        setCurrentUser(user);
        toast.success(`Welcome back, ${user.name}!`);
        navigate('/dashboard');
      } else {
        // New user - go to onboarding
        navigate('/onboarding', { state: { email } });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CareerConnect</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">AI-Powered Career Guidance</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your Career Journey
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Starts Here
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Connect with experienced mentors, get personalized AI career guidance, and unlock opportunities tailored for Indian college students.
          </p>

          {/* Email Input */}
          <div className="max-w-md mx-auto mb-16">
            <Card className="p-2 flex items-center gap-2 shadow-lg border-2 border-gray-200" data-testid="email-input-card">
              <Input
                data-testid="email-input"
                type="email"
                placeholder="Enter your email to begin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGetStarted()}
                className="border-0 focus-visible:ring-0 text-base"
              />
              <Button
                data-testid="get-started-btn"
                onClick={handleGetStarted}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6"
              >
                {isLoading ? 'Loading...' : 'Get Started'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 text-left hover:shadow-lg transition-shadow" data-testid="feature-ai-mentor">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">AI Career Assistant</h3>
              <p className="text-gray-600 text-sm">
                Get instant career guidance, resume feedback, and interview prep from our AI-powered assistant.
              </p>
            </Card>

            <Card className="p-6 text-left hover:shadow-lg transition-shadow" data-testid="feature-mentor-matching">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Smart Mentorship Matching</h3>
              <p className="text-gray-600 text-sm">
                Connect with mentors who match your career goals using our AI-powered compatibility algorithm.
              </p>
            </Card>

            <Card className="p-6 text-left hover:shadow-lg transition-shadow" data-testid="feature-personalized">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Personalized Dashboard</h3>
              <p className="text-gray-600 text-sm">
                Track your progress, view recommendations, and manage your career development journey.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-blue-100">Active Mentors</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5000+</div>
              <div className="text-blue-100">Students Helped</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Success Rate</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}