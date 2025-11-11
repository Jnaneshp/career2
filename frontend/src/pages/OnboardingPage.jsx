import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import axios from 'axios';
import { toast } from 'sonner';
import { Users, ArrowLeft } from 'lucide-react';
import { auth } from '@/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}`;

export default function OnboardingPage({ setCurrentUser }) {
  const navigate = useNavigate();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: 'student',
    college: '',
    graduation_year: '',
  });

  // ✅ Listen for authenticated Firebase user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        toast.error('Please log in first.');
        navigate('/login');
      } else {
        setFirebaseUser(user);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Submit onboarding form
  const handleSubmit = async () => {
    if (!formData.name || !firebaseUser?.email) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // 🧠 Prepare full user object
      const userPayload = {
        firebase_uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: formData.name,
        role: formData.role,
        college: formData.college,
        graduation_year: formData.graduation_year,
      };

      // 🔗 Send to backend (will auto-create or update)
      const response = await axios.post(`${API}/users/firebase-sync`, userPayload);
      const user = response.data;

      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));

      toast.success('Profile created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting onboarding:', error);
      toast.error(error.response?.data?.detail || 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!firebaseUser) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Checking authentication...
      </div>
    );
  }

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
          <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-btn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      {/* Onboarding Form */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Complete Your Profile
            </h1>
            <p className="text-gray-600">
              Welcome, {firebaseUser.displayName || firebaseUser.email}
            </p>
          </div>

          <Card className="p-8 shadow-lg">
            <div className="space-y-6">
              {/* Role Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 block">I am a *</Label>
                <RadioGroup
                  data-testid="role-selector"
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                  className="grid grid-cols-3 gap-4"
                >
                  {['student', 'mentor', 'both'].map((role) => (
                    <div key={role}>
                      <RadioGroupItem
                        value={role}
                        id={role}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={role}
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 hover:border-blue-500 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                      >
                        <span className="text-sm font-medium capitalize">
                          {role}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name" className="text-base font-semibold mb-2 block">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-base"
                />
              </div>

              {/* College */}
              {(formData.role === 'student' || formData.role === 'both') && (
                <div>
                  <Label htmlFor="college" className="text-base font-semibold mb-2 block">
                    College/University
                  </Label>
                  <Input
                    id="college"
                    placeholder="Enter your college name"
                    value={formData.college}
                    onChange={(e) => handleInputChange('college', e.target.value)}
                    className="text-base"
                  />
                </div>
              )}

              {/* Graduation Year */}
              {(formData.role === 'student' || formData.role === 'both') && (
                <div>
                  <Label
                    htmlFor="grad-year"
                    className="text-base font-semibold mb-2 block"
                  >
                    Graduation Year
                  </Label>
                  <Input
                    id="grad-year"
                    placeholder="2025"
                    value={formData.graduation_year}
                    onChange={(e) =>
                      handleInputChange('graduation_year', e.target.value)
                    }
                    className="text-base"
                  />
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base py-6"
              >
                {isLoading ? 'Saving...' : 'Complete Profile'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
