import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, DollarSign, MessageSquare, Calendar } from 'lucide-react';

export const AnalyticsModule: React.FC = () => {
  const analytics = {
    patientsConsulted: 142,
    totalAppointments: 89,
    earnings: 17800,
    patientSatisfaction: 4.8,
    trends: {
      patients: '+12%',
      appointments: '+8%',
      earnings: '+15%',
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-medical-card shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-medical-muted">Patients Consulted</CardTitle>
            <Users className="h-4 w-4 text-medical-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-text">{analytics.patientsConsulted}</div>
            <p className="text-xs text-medical-muted mt-1">
              <span className="text-green-500">{analytics.trends.patients}</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-medical-card shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-medical-muted">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-medical-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-text">{analytics.totalAppointments}</div>
            <p className="text-xs text-medical-muted mt-1">
              <span className="text-green-500">{analytics.trends.appointments}</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-medical-card shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-medical-muted">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-text">${analytics.earnings.toLocaleString()}</div>
            <p className="text-xs text-medical-muted mt-1">
              <span className="text-green-500">{analytics.trends.earnings}</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-medical-card shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-medical-muted">Patient Satisfaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-text">{analytics.patientSatisfaction}/5.0</div>
            <p className="text-xs text-medical-muted mt-1">Based on 89 reviews</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-medical-text">Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-medical-muted">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Chart visualization coming soon</p>
            <p className="text-sm mt-2">Monthly patient consultations, appointment trends, and earnings analysis</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-medical-text">Treatment Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Cardiology</span>
              <span className="text-medical-muted">35% of consultations</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">General Medicine</span>
              <span className="text-medical-muted">28% of consultations</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Preventive Care</span>
              <span className="text-medical-muted">22% of consultations</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">Follow-ups</span>
              <span className="text-medical-muted">15% of consultations</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

