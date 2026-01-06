import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  User,
  Users,
  Calendar,
  FileText,
  ClipboardList,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Stethoscope,
  PenTool,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getCurrentDoctorProfile } from '@/services/doctorService';

// Import module components
import { DashboardOverview } from '@/components/doctor/DashboardOverview';
import { ConsentWorkflowBuilder } from '@/components/doctor/ConsentWorkflowBuilder';
import { ProfileManagement } from '@/components/doctor/ProfileManagement';
import { PatientManagement } from '@/components/doctor/PatientManagement';
import { AppointmentManagement } from '@/components/doctor/AppointmentManagement';
import { PrescriptionsModule } from '@/components/doctor/PrescriptionsModule';
import { MedicalRecordsModule } from '@/components/doctor/MedicalRecordsModule';
import { CommunicationModule } from '@/components/doctor/CommunicationModule';
import { AnalyticsModule } from '@/components/doctor/AnalyticsModule';
import { SettingsModule } from '@/components/doctor/SettingsModule';

type Module =
  | 'dashboard'
  | 'profile'
  | 'patients'
  | 'appointments'
  | 'prescriptions'
  | 'records'
  | 'communication'
  | 'analytics'
  | 'workflows'
  | 'settings';

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [notifications, setNotifications] = useState(5);

  const [doctorName, setDoctorName] = useState('Doctor');

  // Get doctor profile and name - updates automatically when profile changes
  useEffect(() => {
    const loadDoctorName = () => {
      try {
        // First try to get from doctor profile service (most up-to-date)
        const doctorProfile = getCurrentDoctorProfile();
        if (doctorProfile?.name) {
          setDoctorName(doctorProfile.name);
          console.log('✅ Loaded doctor name from profile:', doctorProfile.name);
          return;
        }
      } catch (e) {
        console.warn('Could not load doctor profile:', e);
      }

      // Fallback to profile from localStorage
      try {
        const profileStr = localStorage.getItem('profile');
        if (profileStr) {
          const profile = JSON.parse(profileStr);
          const name = profile.user || profile.username || 'Doctor';
          setDoctorName(name);
          console.log('✅ Loaded doctor name from localStorage:', name);
        }
      } catch (e) {
        console.error('Error parsing profile:', e);
        setDoctorName('Doctor');
      }
    };

    // Load immediately
    loadDoctorName();

    // Listen for profile updates (same tab)
    const handleProfileUpdate = () => {
      console.log('🔄 Profile updated, reloading doctor name...');
      loadDoctorName();
    };

    // Listen for storage changes (cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'profile' || e.key === 'doctor_profiles') {
        console.log('🔄 Storage changed, reloading doctor name...');
        loadDoctorName();
      }
    };

    window.addEventListener('doctorProfileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('doctorProfileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const userName = doctorName;

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('profile');
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard' as Module, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile' as Module, label: 'Profile', icon: User },
    { id: 'patients' as Module, label: 'Patients', icon: Users },
    { id: 'appointments' as Module, label: 'Appointments', icon: Calendar },
    { id: 'prescriptions' as Module, label: 'Prescriptions', icon: ClipboardList },
    { id: 'records' as Module, label: 'Medical Records', icon: FileText },
    { id: 'workflows' as Module, label: 'Consent Workflows', icon: PenTool },
    { id: 'communication' as Module, label: 'Communication', icon: MessageSquare },
    { id: 'analytics' as Module, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as Module, label: 'Settings', icon: Settings },
  ];

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'profile':
        return <ProfileManagement />;
      case 'patients':
        return <PatientManagement />;
      case 'appointments':
        return <AppointmentManagement />;
      case 'prescriptions':
        return <PrescriptionsModule />;
      case 'records':
        return <MedicalRecordsModule />;
      case 'communication':
        return <CommunicationModule />;
      case 'analytics':
        return <AnalyticsModule />;
      case 'workflows':
        return <ConsentWorkflowBuilder />;
      case 'settings':
        return <SettingsModule onLogout={handleLogout} />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-medical-bg flex">
      {/* Sidebar */}
      <aside className="w-64 bg-medical-card border-r border-border shadow-soft flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-medical-primary to-medical-secondary rounded-lg">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-medical-text">Doctor's Portal</h1>
              <p className="text-xs text-medical-muted">vDHP Care Compass</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeModule === item.id
                  ? 'bg-gradient-to-r from-medical-primary to-medical-secondary text-white'
                  : 'text-medical-text hover:bg-secondary'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full flex items-center space-x-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-medical-card border-b border-border shadow-soft px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-medical-text">
                {menuItems.find(m => m.id === activeModule)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-medical-muted">
                {localStorage.getItem('is_first_login') === 'true' ? 'Hello' : 'Welcome back'}, <span className="font-semibold text-medical-primary">{userName}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="relative">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                    {notifications}
                  </Badge>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-medical-primary to-medical-secondary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{userName[0]?.toUpperCase() || 'D'}</span>
                    </div>
                    <span>{userName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveModule('profile')}>
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveModule('settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderModule()}
        </main>
      </div>
    </div>
  );
};
