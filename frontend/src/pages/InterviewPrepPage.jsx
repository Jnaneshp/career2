import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Users,
  Code,
  Target,
  TrendingUp,
  Award,
  ChevronRight,
  Loader2,
  BookOpen,
  Zap,
  RefreshCcw,
  User as UserIcon,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}`;

export default function InterviewPrepPage({ currentUser }) {
  const navigate = useNavigate();

  // Prevent breaking if currentUser has not yet loaded
  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const [selectedCompany, setSelectedCompany] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [readiness, setReadiness] = useState([]);

  const targetCompanies = currentUser?.target_companies || [];

  // Initialize selected company
  useEffect(() => {
    if (targetCompanies.length > 0 && !selectedCompany) {
      setSelectedCompany(targetCompanies[0]);
    }
  }, [targetCompanies]);

  // Fetch progress & readiness
  useEffect(() => {
    if (!currentUser?.id) return;
    fetchProgress();
    fetchReadiness();
  }, [currentUser?.id]);

  // Fetch questions when company changes
  useEffect(() => {
    if (selectedCompany && currentUser?.id) {
      fetchQuestions(false);
    }
  }, [selectedCompany]);

  // ------------------------------------------
  // API Calls
  // ------------------------------------------

  const fetchQuestions = async (forceRefresh = false) => {
    if (!selectedCompany) return;
    setLoading(true);

    try {
      const res = await axios.get(`${API}/interview-prep/questions`, {
        params: {
          company: selectedCompany,
          student_id: currentUser.id,
          force_refresh: forceRefresh,
        },
      });

      setQuestions(res.data.questions || []);

      if (forceRefresh) toast.success('✨ Fetched new AI-generated questions!');
      else if (res.data.cached) toast.info('Loaded cached questions ⚡');
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => fetchQuestions(true);

  const fetchProgress = async () => {
    try {
      const res = await axios.get(`${API}/interview-prep/progress/${currentUser.id}`);
      setProgress(res.data.profile || {});
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchReadiness = async () => {
    try {
      const res = await axios.get(`${API}/interview-prep/readiness/${currentUser.id}`);
      setReadiness(res.data.readiness || []);
    } catch (error) {
      console.error('Error fetching readiness:', error);
    }
  };

  // ------------------------------------------
  // Helpers
  // ------------------------------------------

  const getDifficultyColor = (diff) => {
    if (diff === 'Easy') return 'bg-green-100 text-green-800';
    if (diff === 'Medium') return 'bg-yellow-100 text-yellow-800';
    if (diff === 'Hard') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getReadinessColor = (p) => {
    if (p >= 80) return 'text-green-600';
    if (p >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // ------------------------------------------
  // Empty State — No Target Companies
  // ------------------------------------------

  if (!targetCompanies || targetCompanies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <nav className="border-b bg-white/80 backdrop-blur">
          <div className="container mx-auto flex justify-between px-4 py-4">
            <h1 className="text-xl font-bold">CareerConnect</h1>
            <Button variant="outline" onClick={() => navigate('/profile')}>
              <UserIcon className="w-4 h-4 mr-2" /> Profile
            </Button>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-xl mx-auto text-center">
            <Target className="w-14 h-14 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3">Set Your Target Companies</h2>
            <p className="text-gray-600 mb-6">
              Add target companies to generate personalized interview questions.
            </p>
            <Button size="lg" onClick={() => navigate('/profile')}>
              Go to Profile <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // MAIN PAGE UI
  // ------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">

      {/* NAVBAR */}
      <nav className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto flex justify-between items-center px-4 py-4">
          <div className="flex gap-2 items-center">
            <Users className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-xl">CareerConnect</span>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>Dashboard</Button>
            <Button variant="ghost" onClick={() => navigate('/ai-assistant')}>AI Assistant</Button>
            <Button variant="outline" onClick={() => navigate('/profile')}>
              <UserIcon className="w-4 h-4 mr-2" /> Profile
            </Button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Interview Preparation</h1>
            <p className="text-gray-600">AI-generated interview questions tailored to your goals</p>
          </div>

          <Button onClick={handleRefresh} disabled={loading} className="flex items-center gap-2 bg-blue-600 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex justify-between mb-4">
              <Award className="text-green-600 w-8 h-8" />
              <span className="text-3xl font-bold">{progress?.solved_questions?.length || 0}</span>
            </div>
            <p className="font-semibold">Questions Solved</p>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between mb-4">
              <TrendingUp className="text-blue-600 w-8 h-8" />
              <span className="text-3xl font-bold">{Math.round(progress?.readiness_score || 0)}%</span>
            </div>
            <p className="font-semibold">Overall Readiness</p>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between mb-4">
              <Zap className="text-purple-600 w-8 h-8" />
              <span className="text-3xl font-bold">{progress?.strong_topics?.length || 0}</span>
            </div>
            <p className="font-semibold">Strong Topics</p>
          </Card>
        </div>

        {/* Company Selector */}
        <Card className="p-6 mb-6">
          <Label className="text-lg font-semibold mb-3 block">Select Target Company</Label>
          <div className="flex gap-2 flex-wrap">
            {targetCompanies.map((company) => (
              <Button
                key={company}
                variant={selectedCompany === company ? 'default' : 'outline'}
                onClick={() => setSelectedCompany(company)}
                className={selectedCompany === company ? 'bg-blue-600 text-white' : ''}
              >
                {company}
              </Button>
            ))}
          </div>
        </Card>

        {/* Questions */}
        <h2 className="text-2xl font-bold mb-4">
          Questions for {selectedCompany}
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {questions.map((q, index) => (
              <Card
                key={q.id}
                className="p-6 hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/interview-prep/question/${q.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-500">#{index + 1}</span>
                      <h3 className="font-semibold text-lg">{q.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm">{q.description.slice(0, 160)}...</p>
                  </div>
                  <ChevronRight className="text-gray-400 w-5 h-5" />
                </div>

                <div className="mt-3 flex gap-2 flex-wrap">
                  <Badge className={getDifficultyColor(q.difficulty)}>{q.difficulty}</Badge>
                  <Badge variant="outline">{q.category}</Badge>
                  {q.frequency && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      🔥 {q.frequency} Frequency
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
