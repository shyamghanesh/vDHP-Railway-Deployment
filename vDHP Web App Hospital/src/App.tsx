import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import AddPatient from "./pages/AddPatient";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { DoctorDashboard } from "./pages/DoctorDashboard";

const queryClient = new QueryClient();

// Protected Route wrapper that checks auth dynamically
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');
    if (!isAuthed) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

// Role-based route component
const RoleBasedRoute = () => {
    const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');
    if (!isAuthed) {
        return <Login />;
    }

    const userRole = localStorage.getItem('user_role');
    if (userRole === 'doctor') {
        return <Navigate to="/doctor/dashboard" replace />;
    } else if (userRole === 'healthcare_provider') {
        return <Navigate to="/provider/dashboard" replace />;
    }

    // Default to login if role is not set
    return <Navigate to="/login" replace />;
};

const App = () => {
    console.log("App.tsx: App component rendering");
    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/" element={<RoleBasedRoute />} />

                        {/* Doctor Routes */}
                        <Route
                            path="/doctor/dashboard"
                            element={
                                <ProtectedRoute>
                                    <DoctorDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Healthcare Provider Routes */}
                        <Route
                            path="/provider/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Index />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/add-patient"
                            element={
                                <ProtectedRoute>
                                    <AddPatient />
                                </ProtectedRoute>
                            }
                        />

                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
            </TooltipProvider>
        </QueryClientProvider>
    );
};

export default App;
