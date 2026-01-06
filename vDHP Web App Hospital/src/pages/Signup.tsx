import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/config';

type UserRole = 'doctor' | 'healthcare_provider';

const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<UserRole>('doctor');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            setError('Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (!role) {
            setError('Please select your role');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    name,
                    role,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Signup failed');
            }

            // Show success message and redirect to login
            // We can use a toast here if available, or just alert for now since we haven't imported useToast
            // But let's check imports... we don't have useToast imported.
            // Let's just use alert for simplicity or add toast if easy.
            // Actually, let's just navigate to login with state? 
            // Or just alert. The user asked for "Account created successfully..." message.

            alert("Account created successfully, please sign in with your credentials");
            navigate('/', { replace: true });

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
                        <p className="text-medical-muted mt-1">Create your account</p>
                    </div>

                    <Card className="bg-medical-card shadow-elevated">
                        <CardHeader>
                            <div className="text-center space-y-1">
                                <CardTitle className="text-medical-text">Sign up</CardTitle>
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
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. John Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" />
                                </div>
                                {error && <p className="text-sm text-destructive">{error}</p>}

                                <Button type="submit" className="w-full bg-gradient-to-r from-medical-primary to-medical-secondary text-white" disabled={loading}>
                                    {loading ? 'Creating account...' : 'Sign up'}
                                </Button>
                            </form>
                            <div className="mt-4 text-center text-sm text-medical-muted">
                                Already have an account? <span className="text-medical-text hover:underline cursor-pointer" onClick={() => navigate('/')}>Sign in</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Signup;
