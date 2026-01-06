import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Save, Calendar, MapPin, Phone, Mail, GraduationCap } from 'lucide-react';
import { getCurrentDoctorId, getCurrentDoctorProfile, saveDoctorProfile, type DoctorProfile } from '@/services/doctorService';
import { useToast } from '@/hooks/use-toast';

export const ProfileManagement: React.FC = () => {
  const { toast } = useToast();
  const doctorId = getCurrentDoctorId();
  const existingProfile = getCurrentDoctorProfile();

  const [profile, setProfile] = useState({
    name: existingProfile?.name || '',
    email: existingProfile?.email || '',
    phone: existingProfile?.phone || '',
    specialization: existingProfile?.specialization || '',
    qualifications: existingProfile?.qualifications || '',
    experience: existingProfile?.experience || '',
    address: existingProfile?.address || '',
    city: existingProfile?.city || '',
    state: existingProfile?.state || '',
    zipCode: existingProfile?.zipCode || '',
    bio: existingProfile?.bio || '',
    consultationFee: existingProfile?.consultationFee || 0,
    availableHours: existingProfile?.availableHours || '',
    holidays: [] as string[],
    // New fields
    photo: existingProfile?.photo || '',
    gender: existingProfile?.gender || '',
    birthDate: existingProfile?.birthDate || ''
  });

  // Load profile when component mounts
  useEffect(() => {
    const currentProfile = getCurrentDoctorProfile();
    // Also try to get basic info from localStorage 'profile' object set during login
    const storedProfile = JSON.parse(localStorage.getItem('profile') || '{}');

    setProfile({
      name: currentProfile?.name || storedProfile.username || storedProfile.user || '',
      email: currentProfile?.email || storedProfile.email || '', // Email might not be in storedProfile depending on login response
      phone: currentProfile?.phone || '',
      specialization: currentProfile?.specialization || '',
      qualifications: currentProfile?.qualifications || '',
      experience: currentProfile?.experience || '',
      address: currentProfile?.address || '',
      city: currentProfile?.city || '',
      state: currentProfile?.state || '',
      zipCode: currentProfile?.zipCode || '',
      bio: currentProfile?.bio || '',
      consultationFee: currentProfile?.consultationFee || 0,
      availableHours: currentProfile?.availableHours || '',
      holidays: [],
      photo: currentProfile?.photo || '',
      gender: currentProfile?.gender || '',
      birthDate: currentProfile?.birthDate || ''
    });
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      // Save profile to localStorage (this will persist all changes)
      await saveDoctorProfile(doctorId, profile);

      // Also update the profile in localStorage for header display (immediate update)
      const currentProfile = JSON.parse(localStorage.getItem('profile') || '{}');
      localStorage.setItem('profile', JSON.stringify({
        ...currentProfile,
        user: profile.name,
        username: profile.name,
        doctorId: doctorId
      }));

      // Dispatch storage event for cross-tab updates
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'profile',
        newValue: JSON.stringify({
          ...currentProfile,
          user: profile.name,
          username: profile.name,
          doctorId: doctorId
        })
      }));

      // Trigger custom event for same-tab updates
      window.dispatchEvent(new Event('doctorProfileUpdated'));

      toast({
        title: 'Success',
        description: 'Profile saved successfully! Changes will be reflected everywhere.',
      });

      console.log('✅ Profile changes saved for doctor:', doctorId, profile.name);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-medical-text">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-medical-primary to-medical-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {profile.photo ? (
                <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                profile.name.split(' ').map(n => n[0]).join('')
              )}
            </div>
            <div>
              <Button variant="outline" className="relative">
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </Button>
              <p className="text-xs text-medical-muted mt-2">JPG, PNG up to 2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <div className="flex space-x-2">
                <select
                  className="w-24 flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={profile.phone.split(' ')[0] || '+91'}
                  onChange={(e) => {
                    const parts = profile.phone.split(' ');
                    const number = parts.length > 1 ? parts.slice(1).join(' ') : parts[0];
                    setProfile({ ...profile, phone: `${e.target.value} ${number}` });
                  }}
                >
                  <option value="+91">IN (+91)</option>
                  <option value="+1">US (+1)</option>
                  <option value="+44">UK (+44)</option>
                  <option value="+61">AU (+61)</option>
                  <option value="+81">JP (+81)</option>
                </select>
                <Input
                  value={profile.phone.split(' ').slice(1).join(' ')}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    const code = profile.phone.split(' ')[0] || '+91';
                    setProfile({ ...profile, phone: `${code} ${val}` });
                  }}
                  placeholder="9876543210"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={profile.birthDate} onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Specialization</Label>
              <Input value={profile.specialization} onChange={(e) => setProfile({ ...profile, specialization: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Qualifications</Label>
              <Input value={profile.qualifications} onChange={(e) => setProfile({ ...profile, qualifications: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Years of Experience</Label>
              <Input value={profile.experience} onChange={(e) => setProfile({ ...profile, experience: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={4} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-medical-text">Address Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Street Address</Label>
            <Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Zip Code</Label>
              <Input value={profile.zipCode} onChange={(e) => setProfile({ ...profile, zipCode: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-medical-text">Consultation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Consultation Fee ($)</Label>
              <Input type="number" value={profile.consultationFee} onChange={(e) => setProfile({ ...profile, consultationFee: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Available Hours</Label>
              <Input value={profile.availableHours} onChange={(e) => setProfile({ ...profile, availableHours: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Set Holidays</Label>
            <Input type="date" placeholder="Select holiday dates" />
            <p className="text-xs text-medical-muted">Select dates when you're not available</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-gradient-to-r from-medical-primary to-medical-secondary">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

