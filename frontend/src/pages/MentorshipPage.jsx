import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { toast } from 'sonner';
import { Users, User, Search, Star, Send, CheckCircle, XCircle, Clock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}`;

export default function MentorshipPage({ currentUser }) {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [matches, setMatches] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchMentors();
    if (currentUser.role === 'student' || currentUser.role === 'both') {
      fetchMatches();
    }
    fetchMyRequests();
  }, [currentUser]);

  const fetchMentors = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/mentorship/mentors`);
      setMentors(response.data || []);
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`${API}/mentorship/matches/${currentUser.id}`);
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const response = await axios.get(`${API}/mentorship/my-requests/${currentUser.id}`);
      setMyRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleRequestMentorship = (mentor) => {
    setSelectedMentor(mentor);
    setIsDialogOpen(true);
  };

  const handleSendRequest = async () => {
    if (!requestMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      await axios.post(`${API}/mentorship/request`, {
        mentor_id: selectedMentor.id,
        mentee_id: currentUser.id,
        message: requestMessage
      });
      toast.success('Mentorship request sent!');
      setIsDialogOpen(false);
      setRequestMessage('');
      fetchMyRequests();
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('Failed to send request');
    } finally {
      setIsSending(false);
    }
  };

  const handleRespondToRequest = async (requestId, status) => {
    try {
      await axios.put(`${API}/mentorship/${requestId}/respond`, {
        request_id: requestId,
        status
      });
      toast.success(`Request ${status}!`);
      fetchMyRequests();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Failed to respond to request');
    }
  };

  const filteredMentors = mentors.filter(mentor => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      mentor.name.toLowerCase().includes(query) ||
      mentor.skills?.some(skill => skill.toLowerCase().includes(query)) ||
      mentor.mentor_profile?.expertise?.some(exp => exp.toLowerCase().includes(query))
    );
  });

  const MentorCard = ({ mentor, compatibilityScore, onRequestClick }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow" data-testid="mentor-card">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xl">{mentor.name.charAt(0)}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{mentor.name}</h3>
            {compatibilityScore && (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100" data-testid="compatibility-score">
                <Star className="w-3 h-3 mr-1" />
                {compatibilityScore}% Match
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{mentor.current_role || 'Professional'}</p>
          {mentor.mentor_profile?.years_experience > 0 && (
            <p className="text-sm text-gray-500">{mentor.mentor_profile.years_experience} years experience</p>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4 line-clamp-2">{mentor.bio || 'Experienced professional ready to guide you.'}</p>

      <div className="space-y-3">
        {mentor.skills && mentor.skills.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Skills</p>
            <div className="flex flex-wrap gap-1">
              {mentor.skills.slice(0, 4).map((skill, idx) => (
                <Badge key={idx} variant="outline" className="text-xs" data-testid={`skill-${idx}`}>
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {mentor.mentor_profile?.expertise && mentor.mentor_profile.expertise.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Expertise</p>
            <div className="flex flex-wrap gap-1">
              {mentor.mentor_profile.expertise.slice(0, 4).map((exp, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs" data-testid={`expertise-${idx}`}>
                  {exp}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {onRequestClick && (
        <Button
          data-testid="request-mentorship-btn"
          onClick={() => onRequestClick(mentor)}
          className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Request Mentorship
        </Button>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CareerConnect</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')} data-testid="nav-dashboard">
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => navigate('/ai-assistant')} data-testid="nav-ai-assistant">
                AI Assistant
              </Button>
              <Button variant="ghost" onClick={() => navigate('/resume-assistant')} data-testid="nav-resume-assistant">
                Resume Assistant
              </Button>
              <Button variant="ghost" onClick={() => navigate('/mentorship')} data-testid="nav-mentorship">
                Mentorship
              </Button>
              <Button variant="ghost" onClick={() => navigate('/interview-prep')} data-testid="nav-interview-prep">
                Interview Prep
              </Button>
              <Button variant="outline" onClick={() => navigate('/profile')} data-testid="nav-profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentorship</h1>
            <p className="text-gray-600">Connect with experienced mentors to guide your career</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="discover" className="space-y-6">
            <TabsList data-testid="mentorship-tabs">
              <TabsTrigger value="discover" data-testid="tab-discover">Discover Mentors</TabsTrigger>
              {(currentUser.role === 'student' || currentUser.role === 'both') && (
                <TabsTrigger value="matches" data-testid="tab-matches">Top Matches</TabsTrigger>
              )}
              <TabsTrigger value="requests" data-testid="tab-requests">My Requests</TabsTrigger>
            </TabsList>

            {/* Discover Mentors Tab */}
            <TabsContent value="discover" data-testid="discover-tab-content">
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    data-testid="search-mentors-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search mentors by name, skills, or expertise..."
                    className="pl-10"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading mentors...</p>
                </div>
              ) : filteredMentors.length === 0 ? (
                <Card className="p-12 text-center" data-testid="no-mentors-card">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">No Mentors Found</h3>
                  <p className="text-gray-600">Try adjusting your search query</p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMentors.map((mentor) => (
                    <MentorCard
                      key={mentor.id}
                      mentor={mentor}
                      onRequestClick={(currentUser.role === 'student' || currentUser.role === 'both') ? handleRequestMentorship : null}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Top Matches Tab */}
            {(currentUser.role === 'student' || currentUser.role === 'both') && (
              <TabsContent value="matches" data-testid="matches-tab-content">
                {matches.length === 0 ? (
                  <Card className="p-12 text-center" data-testid="no-matches-card">
                    <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">No Matches Yet</h3>
                    <p className="text-gray-600 mb-4">Complete your profile to get AI-powered mentor recommendations</p>
                    <Button onClick={() => navigate('/profile')} data-testid="complete-profile-btn">
                      Complete Profile
                    </Button>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {matches.map((match) => (
                      <MentorCard
                        key={match.mentor.id}
                        mentor={match.mentor}
                        compatibilityScore={match.compatibility_score}
                        onRequestClick={handleRequestMentorship}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* My Requests Tab */}
            <TabsContent value="requests" data-testid="requests-tab-content">
              {myRequests.length === 0 ? (
                <Card className="p-12 text-center" data-testid="no-requests-card">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">No Requests Yet</h3>
                  <p className="text-gray-600">Start connecting with mentors to see your requests here</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {myRequests.map((request, index) => (
                    <Card key={request.id} className="p-6" data-testid={`request-card-${index}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {request.mentor_id === currentUser.id ? 'Request from Mentee' : 'Request to Mentor'}
                            </h3>
                            <Badge
                              data-testid={`request-status-${index}`}
                              className={`
                                ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                                ${request.status === 'accepted' ? 'bg-green-100 text-green-700' : ''}
                                ${request.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
                              `}
                            >
                              {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {request.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {request.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{request.message}</p>
                          {request.compatibility_score > 0 && (
                            <p className="text-xs text-gray-500">Compatibility: {request.compatibility_score}%</p>
                          )}
                        </div>
                        
                        {request.status === 'pending' && request.mentor_id === currentUser.id && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              data-testid={`accept-request-btn-${index}`}
                              onClick={() => handleRespondToRequest(request.id, 'accepted')}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              data-testid={`reject-request-btn-${index}`}
                              onClick={() => handleRespondToRequest(request.id, 'rejected')}
                              size="sm"
                              variant="destructive"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="request-dialog">
          <DialogHeader>
            <DialogTitle>Request Mentorship from {selectedMentor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Introduce yourself and explain why you'd like {selectedMentor?.name} as your mentor.
            </p>
            <Textarea
              data-testid="request-message-input"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Hi, I'm interested in learning more about..."
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="cancel-request-btn">
              Cancel
            </Button>
            <Button
              data-testid="send-request-btn"
              onClick={handleSendRequest}
              disabled={isSending}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isSending ? 'Sending...' : 'Send Request'}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}