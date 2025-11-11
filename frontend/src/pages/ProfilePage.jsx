import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';
import { Users, User, X, Plus, Briefcase } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}`;

// Popular companies list for autocomplete
const POPULAR_COMPANIES = [
  'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Adobe',
  'Flipkart', 'Swiggy', 'Zomato', 'Paytm', 'PhonePe', 'Razorpay',
  'Oracle', 'Salesforce', 'IBM', 'Intel', 'NVIDIA', 'Tesla', 'Uber'
];

export default function ProfilePage({ currentUser, setCurrentUser }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: currentUser.name || '',
    bio: currentUser.bio || '',
    college: currentUser.college || '',
    graduation_year: currentUser.graduation_year || '',
    current_role: currentUser.current_role || '',
    location: currentUser.location || '',
    skills: currentUser.skills || [],
    target_companies: currentUser.target_companies || [], // ✅ NEW: Target companies
  });
  
  const [newSkill, setNewSkill] = useState('');
  const [newCompany, setNewCompany] = useState(''); // ✅ NEW
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false); // ✅ NEW
  
  const [mentorProfile, setMentorProfile] = useState(currentUser.mentor_profile || {
    is_available: true,
    expertise: [],
    years_experience: 0,
    max_mentees: 5,
    availability: ''
  });
  
  const [menteeProfile, setMenteeProfile] = useState(currentUser.mentee_profile || {
    seeking_mentor: true,
    career_goals: [],
    skills_to_learn: [],
    preferred_mentor_type: ''
  });
  
  const [newExpertise, setNewExpertise] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newSkillToLearn, setNewSkillToLearn] = useState('');

  // ✅ NEW: Filter companies based on input
  const filteredCompanies = POPULAR_COMPANIES.filter(company =>
    company.toLowerCase().includes(newCompany.toLowerCase()) &&
    !profileData.target_companies.includes(company)
  );

  // Skills handlers
  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setProfileData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  // ✅ NEW: Company handlers
  const handleAddCompany = (company) => {
    const companyToAdd = company || newCompany.trim();
    if (companyToAdd && !profileData.target_companies.includes(companyToAdd)) {
      setProfileData(prev => ({ 
        ...prev, 
        target_companies: [...prev.target_companies, companyToAdd] 
      }));
      setNewCompany('');
      setShowCompanySuggestions(false);
    }
  };

  const handleRemoveCompany = (company) => {
    setProfileData(prev => ({ 
      ...prev, 
      target_companies: prev.target_companies.filter(c => c !== company) 
    }));
  };

  // Expertise handlers
  const handleAddExpertise = () => {
    if (newExpertise.trim() && !mentorProfile.expertise.includes(newExpertise.trim())) {
      setMentorProfile(prev => ({ ...prev, expertise: [...prev.expertise, newExpertise.trim()] }));
      setNewExpertise('');
    }
  };

  const handleRemoveExpertise = (expertise) => {
    setMentorProfile(prev => ({ ...prev, expertise: prev.expertise.filter(e => e !== expertise) }));
  };

  // Career goals handlers
  const handleAddGoal = () => {
    if (newGoal.trim() && !menteeProfile.career_goals.includes(newGoal.trim())) {
      setMenteeProfile(prev => ({ ...prev, career_goals: [...prev.career_goals, newGoal.trim()] }));
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (goal) => {
    setMenteeProfile(prev => ({ ...prev, career_goals: prev.career_goals.filter(g => g !== goal) }));
  };

  // Skills to learn handlers
  const handleAddSkillToLearn = () => {
    if (newSkillToLearn.trim() && !menteeProfile.skills_to_learn.includes(newSkillToLearn.trim())) {
      setMenteeProfile(prev => ({ ...prev, skills_to_learn: [...prev.skills_to_learn, newSkillToLearn.trim()] }));
      setNewSkillToLearn('');
    }
  };

  const handleRemoveSkillToLearn = (skill) => {
    setMenteeProfile(prev => ({ ...prev, skills_to_learn: prev.skills_to_learn.filter(s => s !== skill) }));
  };

  // Save profile
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updatePayload = {
        ...profileData,
        mentor_profile: (currentUser.role === 'mentor' || currentUser.role === 'both') ? mentorProfile : null,
        mentee_profile: (currentUser.role === 'student' || currentUser.role === 'both') ? menteeProfile : null
      };

      const response = await axios.put(`${API}/users/${currentUser.id}`, updatePayload);
      setCurrentUser(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

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
              <Button variant="ghost" onClick={() => navigate('/mentorship')} data-testid="nav-mentorship">
                Mentorship
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-gray-600">Manage your profile and preferences</p>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} data-testid="edit-profile-btn">
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} data-testid="cancel-edit-btn">
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={isSaving} data-testid="save-profile-btn">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <Card className="p-6 mb-6" data-testid="basic-info-card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  data-testid="name-input"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  data-testid="email-display"
                  value={currentUser.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  data-testid="bio-input"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="college">College/University</Label>
                  <Input
                    id="college"
                    data-testid="college-input"
                    value={profileData.college}
                    onChange={(e) => setProfileData(prev => ({ ...prev, college: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="grad-year">Graduation Year</Label>
                  <Input
                    id="grad-year"
                    data-testid="graduation-year-input"
                    value={profileData.graduation_year}
                    onChange={(e) => setProfileData(prev => ({ ...prev, graduation_year: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Current Role</Label>
                  <Input
                    id="role"
                    data-testid="current-role-input"
                    value={profileData.current_role}
                    onChange={(e) => setProfileData(prev => ({ ...prev, current_role: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    data-testid="location-input"
                    value={profileData.location}
                    onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="e.g., Bangalore, India"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Skills */}
          <Card className="p-6 mb-6" data-testid="skills-card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Skills</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {profileData.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1" data-testid={`skill-badge-${index}`}>
                  {skill}
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      data-testid={`remove-skill-${index}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {profileData.skills.length === 0 && !isEditing && (
                <p className="text-gray-500 text-sm">No skills added yet</p>
              )}
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <Input
                  data-testid="new-skill-input"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  placeholder="Add a skill (e.g., React, Python)"
                />
                <Button onClick={handleAddSkill} data-testid="add-skill-btn">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </Card>

          {/* ✅ NEW: Target Companies Section */}
          <Card className="p-6 mb-6" data-testid="target-companies-card">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Target Companies</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Select companies you're targeting for interviews. We'll personalize interview prep questions for you!
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {profileData.target_companies.map((company, index) => (
                <Badge 
                  key={index} 
                  variant="default" 
                  className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200" 
                  data-testid={`company-badge-${index}`}
                >
                  {company}
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveCompany(company)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                      data-testid={`remove-company-${index}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {profileData.target_companies.length === 0 && !isEditing && (
                <p className="text-gray-500 text-sm">No target companies selected</p>
              )}
            </div>
            {isEditing && (
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    data-testid="new-company-input"
                    value={newCompany}
                    onChange={(e) => {
                      setNewCompany(e.target.value);
                      setShowCompanySuggestions(e.target.value.length > 0);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCompany();
                      }
                    }}
                    placeholder="Add target company (e.g., Google, Amazon)"
                    onFocus={() => setShowCompanySuggestions(newCompany.length > 0)}
                  />
                  <Button onClick={() => handleAddCompany()} data-testid="add-company-btn">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Company Suggestions Dropdown */}
                {showCompanySuggestions && filteredCompanies.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCompanies.slice(0, 10).map((company, index) => (
                      <button
                        key={index}
                        onClick={() => handleAddCompany(company)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors"
                        data-testid={`company-suggestion-${index}`}
                      >
                        {company}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Mentor Profile */}
          {(currentUser.role === 'mentor' || currentUser.role === 'both') && (
            <Card className="p-6 mb-6" data-testid="mentor-profile-card">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Mentor Profile</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="years-exp">Years of Experience</Label>
                    <Input
                      id="years-exp"
                      data-testid="years-experience-input"
                      type="number"
                      value={mentorProfile.years_experience}
                      onChange={(e) => setMentorProfile(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-mentees">Max Mentees</Label>
                    <Input
                      id="max-mentees"
                      data-testid="max-mentees-input"
                      type="number"
                      value={mentorProfile.max_mentees}
                      onChange={(e) => setMentorProfile(prev => ({ ...prev, max_mentees: parseInt(e.target.value) || 0 }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <Input
                    id="availability"
                    data-testid="availability-input"
                    value={mentorProfile.availability}
                    onChange={(e) => setMentorProfile(prev => ({ ...prev, availability: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="e.g., Weekends, 2 hours per week"
                  />
                </div>
                <div>
                  <Label>Areas of Expertise</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {mentorProfile.expertise.map((exp, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1" data-testid={`expertise-badge-${index}`}>
                        {exp}
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveExpertise(exp)}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                            data-testid={`remove-expertise-${index}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        data-testid="new-expertise-input"
                        value={newExpertise}
                        onChange={(e) => setNewExpertise(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddExpertise()}
                        placeholder="Add expertise area"
                      />
                      <Button onClick={handleAddExpertise} data-testid="add-expertise-btn">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Mentee Profile */}
          {(currentUser.role === 'student' || currentUser.role === 'both') && (
            <Card className="p-6" data-testid="mentee-profile-card">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Mentee Profile</h2>
              <div className="space-y-4">
                <div>
                  <Label>Career Goals</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {menteeProfile.career_goals.map((goal, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1" data-testid={`goal-badge-${index}`}>
                        {goal}
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveGoal(goal)}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                            data-testid={`remove-goal-${index}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        data-testid="new-goal-input"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
                        placeholder="Add career goal"
                      />
                      <Button onClick={handleAddGoal} data-testid="add-goal-btn">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Skills to Learn</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {menteeProfile.skills_to_learn.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1" data-testid={`skill-to-learn-badge-${index}`}>
                        {skill}
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveSkillToLearn(skill)}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                            data-testid={`remove-skill-to-learn-${index}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        data-testid="new-skill-to-learn-input"
                        value={newSkillToLearn}
                        onChange={(e) => setNewSkillToLearn(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkillToLearn()}
                        placeholder="Add skill to learn"
                      />
                      <Button onClick={handleAddSkillToLearn} data-testid="add-skill-to-learn-btn">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="mentor-type">Preferred Mentor Type</Label>
                  <Input
                    id="mentor-type"
                    data-testid="preferred-mentor-input"
                    value={menteeProfile.preferred_mentor_type}
                    onChange={(e) => setMenteeProfile(prev => ({ ...prev, preferred_mentor_type: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="e.g., Industry expert, Startup founder"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
