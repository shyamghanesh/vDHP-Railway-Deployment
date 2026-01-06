import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, CheckCircle2, XCircle, CalendarDays } from 'lucide-react';

type Appointment = {
  id: string;
  patient: string;
  patientId: string;
  date: string;
  time: string;
  type: 'in-person' | 'virtual';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reason: string;
};

import { getDoctorAppointments, updateAppointmentStatus, Appointment as ApiAppointment } from '@/services/appointmentService';

export const AppointmentManagement: React.FC = () => {
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const profile = JSON.parse(localStorage.getItem('profile') || '{}');
        const doctorId = profile.doctorId;
        if (doctorId) {
          const data = await getDoctorAppointments(doctorId);
          // Map API data to UI format
          const mapped: Appointment[] = data.map(appt => ({
            id: appt.id,
            patient: appt.patientName || 'Patient ' + appt.patientId, // Fallback name
            patientId: appt.patientId,
            date: appt.scheduledDate,
            time: appt.scheduledTime,
            type: 'in-person', // Default for now
            status: (appt.status as any) || 'confirmed',
            reason: appt.reason
          }));
          setAppointments(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
      }
    };
    fetchAppointments();
  }, []);

  const handleAppointmentAction = async (id: string, action: 'approve' | 'reject' | 'complete') => {
    try {
      let status = '';
      if (action === 'approve') status = 'confirmed';
      if (action === 'reject') status = 'cancelled';
      if (action === 'complete') status = 'completed';

      await updateAppointmentStatus(id, status);

      // Update local state
      setAppointments(prev => prev.map(appt =>
        appt.id === id ? { ...appt, status: status as any } : appt
      ));
    } catch (error) {
      console.error(`Failed to ${action} appointment:`, error);
    }
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

