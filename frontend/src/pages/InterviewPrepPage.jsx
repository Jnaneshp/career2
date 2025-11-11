import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Users, Code, Target, TrendingUp, Award, 
  ChevronRight, Loader2, BookOpen, Zap, RefreshCcw
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}`;

export default function InterviewPrepPage({ currentUser }) {
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [readiness, setReadiness] = useState([]);

  const targetCompanies = currentUser?.target_companies || [];

  useEffect(() => {
    if (targetCompanies.length > 0 && !selectedCompany) {
      setSelectedCompany(targetCompanies[0]);
    }
    fetchProgress();
    fetchReadiness();
  }, [currentUser]);

  useEffect(() => {
    if (selectedCompany) {
      fetchQuestions(false);
    }
  }, [selectedCompany]);

  // ✅ Fetch Questions (force_refresh optional)
  const fetchQuestions = async (forceRefresh = false) => {
    if (!selectedCompany) return;
    setLoading(true);

    try {
      const response = await axios.get(`${API}/interview-prep/questions`, {
        params: {
          company: selectedCompany,
          student_id: currentUser.id,
          force_refresh: forceRefresh
        }
      });

      setQuestions(response.data.questions);
      if (forceRefresh) {
        toast.success('✨ Fetched new AI-generated questions!');
      } else if (response.data.cached) {
        toast.info('Loaded cached questions for faster access ⚡');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Refresh Questions
  const handleRefresh = () => {
    fetchQuestions(true);
  };

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`${API}/interview-prep/progress/${currentUser.id}`);
      setProgress(response.data.profile);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchReadiness = async () => {
    try {
      const response = await axios.get(`${API}/interview-prep/readiness/${currentUser.id}`);
      setReadiness(response.data.readiness);
    } catch (error) {
      console.error('Error fetching readiness:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReadinessColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // ✅ Empty State (if no target companies)
  if (targetCompanies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CareerConnect</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>Dashboard</Button>
              <Button variant="ghost" onClick={() => navigate('/ai-assistant')}>AI Assistant</Button>
              <Button variant="ghost" onClick={() => navigate('/mentorship')}>Mentorship</Button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Set Your Target Companies First</h1>
            <p className="text-gray-600 mb-8">
              To get personalized interview questions, please add your target companies in your profile.
            </p>
            <Button onClick={() => navigate('/profile')} size="lg">
              Go to Profile
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Main UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CareerConnect</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>Dashboard</Button>
            <Button variant="ghost" onClick={() => navigate('/ai-assistant')}>AI Assistant</Button>
            <Button variant="ghost" onClick={() => navigate('/mentorship')}>Mentorship</Button>
            <Button variant="outline" onClick={() => navigate('/interview-prep')}>
              <Code className="w-4 h-4 mr-2" />
              Interview Prep
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header + Refresh */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Preparation</h1>
              <p className="text-gray-600">Practice coding problems tailored to your target companies</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCcw className="w-4 h-4" />
                  Refresh Questions
                </>
              )}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {progress?.solved_questions?.length || 0}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">Questions Solved</h3>
              <p className="text-sm text-gray-600">Keep going!</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {Math.round(progress?.readiness_score || 0)}%
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">Overall Readiness</h3>
              <p className="text-sm text-gray-600">Target: 80%+</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {progress?.strong_topics?.length || 0}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">Strong Topics</h3>
              <p className="text-sm text-gray-600">
                {progress?.strong_topics?.[0] || 'Start solving!'}
              </p>
            </Card>
          </div>

          {/* Company Readiness */}
          {readiness.length > 0 && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Company Readiness</h2>
              <div className="space-y-4">
                {readiness.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{item.company}</span>
                        <span className={`font-bold ${getReadinessColor(item.readiness_percentage)}`}>
                          {item.readiness_percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            item.readiness_percentage >= 80 ? 'bg-green-600' :
                            item.readiness_percentage >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${item.readiness_percentage}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.questions_solved} / {item.questions_needed} questions solved
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Company Selector */}
          <Card className="p-6 mb-6">
            <Label className="text-lg font-semibold mb-3 block">Select Target Company</Label>
            <div className="flex flex-wrap gap-3">
              {targetCompanies.map((company) => (
                <Button
                  key={company}
                  variant={selectedCompany === company ? 'default' : 'outline'}
                  onClick={() => setSelectedCompany(company)}
                  className={selectedCompany === company ? 'bg-blue-600' : ''}
                >
                  {company}
                </Button>
              ))}
            </div>
          </Card>

          {/* Questions List */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Questions for {selectedCompany}
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid gap-4">
                {questions.map((question, index) => (
                  <Card
                    key={question.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/interview-prep/question/${question.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-gray-500 font-mono">#{index + 1}</span>
                          <h3 className="text-lg font-semibold text-gray-900">{question.title}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">
                          {question.description.slice(0, 150)}...
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                      <Badge variant="outline">{question.category}</Badge>
                      {question.frequency && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          🔥 {question.frequency} Frequency
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
