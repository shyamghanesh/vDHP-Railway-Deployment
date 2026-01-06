import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, CheckCircle2, XCircle, CalendarDays } from 'lucide-react';

type Appointment = {
  id: number;
  patient: string;
  patientId: string;
  date: string;
  time: string;
  type: 'in-person' | 'virtual';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reason: string;
};

export const AppointmentManagement: React.FC = () => {
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [appointments] = useState<Appointment[]>([
    { id: 1, patient: 'John Doe', patientId: 'P001', date: '2024-01-15', time: '09:00 AM', type: 'in-person', status: 'confirmed', reason: 'Regular Checkup' },
    { id: 2, patient: 'Jane Smith', patientId: 'P002', date: '2024-01-15', time: '10:30 AM', type: 'virtual', status: 'pending', reason: 'Follow-up' },
    { id: 3, patient: 'Robert Johnson', patientId: 'P003', date: '2024-01-15', time: '02:00 PM', type: 'in-person', status: 'confirmed', reason: 'Consultation' },
    { id: 4, patient: 'Emily Davis', patientId: 'P004', date: '2024-01-16', time: '11:00 AM', type: 'virtual', status: 'pending', reason: 'Second Opinion' },
  ]);

  const handleAppointmentAction = (id: number, action: 'approve' | 'reject' | 'complete') => {
    console.log(`Appointment ${id}: ${action}`);
    // Handle appointment action
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-medical-text">Appointment Management</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant={view === 'day' ? 'default' : 'outline'}
                onClick={() => setView('day')}
                size="sm"
              >
                Day
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                onClick={() => setView('week')}
                size="sm"
              >
                Week
              </Button>
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                onClick={() => setView('month')}
                size="sm"
              >
                Month
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 border border-border rounded-lg hover:shadow-soft transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-medical-primary to-medical-secondary rounded-full flex items-center justify-center text-white">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-medical-text">{appointment.patient}</h3>
                      <p className="text-sm text-medical-muted">ID: {appointment.patientId}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-medical-muted flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {appointment.date}
                        </span>
                        <span className="text-sm text-medical-muted flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {appointment.time}
                        </span>
                        <Badge variant="outline">{appointment.type}</Badge>
                      </div>
                      <p className="text-sm text-medical-muted mt-1">Reason: {appointment.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(appointment.status)}
                    {appointment.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAppointmentAction(appointment.id, 'approve')}
                          className="bg-green-500"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAppointmentAction(appointment.id, 'reject')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {appointment.status === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => handleAppointmentAction(appointment.id, 'complete')}
                        className="bg-blue-500"
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-medical-text">Calendar View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-medical-muted">
            <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Calendar integration coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

