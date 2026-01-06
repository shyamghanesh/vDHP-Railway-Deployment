import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/config';

type UserRole = 'doctor' | 'healthcare_provider';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('doctor');
  const [error, setError] = useState('');

  // Redirect if already authenticated (when accessing /login directly)
  useEffect(() => {
    const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');
    if (isAuthed) {
      const userRole = localStorage.getItem('user_role') as UserRole;
      if (userRole === 'doctor') {
        navigate('/doctor/dashboard', { replace: true });
      } else if (userRole === 'healthcare_provider') {
        navigate('/provider/dashboard', { replace: true });
      } else {
        // If role is not set, redirect to root which will handle it
        navigate('/', { replace: true });
      }
    }
  }, [navigate]);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    try {
      // Create form data for OAuth2 password flow
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Save token and role
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user_role', data.role);
      if (data.is_first_login) {
        localStorage.setItem('is_first_login', 'true');
      } else {
        localStorage.removeItem('is_first_login');
      }

      // Store profile info
      localStorage.setItem('profile', JSON.stringify({
        hospitalName: 'City General Hospital',
        branch: 'Downtown Campus',
        user: data.username,
        username: data.username,
        role: data.role,
        doctorId: data.id // Store the correct Doctor ID
      }));

      // Route based on role
      if (data.role === 'doctor') {
        navigate('/doctor/dashboard', { replace: true });
      } else {
        navigate('/provider/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Diagonal stripe mask to reveal the gradient background (static)
  const stripeMask = 'repeating-linear-gradient(135deg, black 0 64px, transparent 64px 128px)';

  return (
    <div className="min-h-screen bg-white md:bg-medical-bg flex md:flex-row flex-col">
      {/* Left visual panel with gradient stripes */}
      <div
        className="hidden md:block md:w-1/2 h-screen bg-gradient-to-br from-medical-primary to-medical-secondary"
        style={{
          WebkitMaskImage: stripeMask,
          maskImage: stripeMask,
          WebkitMaskRepeat: 'repeat',
          maskRepeat: 'repeat',
        }}
      />

      {/* Right content (form) */}
      <div className="flex-1 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Brand + Welcome */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-medical-text">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-medical-primary to-medical-secondary">
                vDHP Care Compass
              </span>
            </h1>
            <p className="text-medical-muted mt-1">Welcome back!</p>
          </div>

          <Card className="bg-medical-card shadow-elevated">
            <CardHeader>
              <div className="text-center space-y-1">
                <CardTitle className="text-medical-text">Sign in</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="healthcare_provider">Healthcare Provider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="name@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex items-center justify-between text-sm text-medical-muted">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="accent-medical-primary" />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="text-medical-text hover:underline">Reset password</button>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-medical-primary to-medical-secondary text-white">Sign in</Button>
              </form>
              <div className="mt-4 text-center text-sm text-medical-muted">
                Don’t have an account? <span className="text-medical-text hover:underline cursor-pointer" onClick={() => navigate('/signup')}>Sign up</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;


