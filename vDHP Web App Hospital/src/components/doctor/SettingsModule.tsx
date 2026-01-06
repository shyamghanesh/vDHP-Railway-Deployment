import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Lock, Bell, Shield, LogOut } from 'lucide-react';

type SettingsModuleProps = {
  onLogout: () => void;
};

export const SettingsModule: React.FC<SettingsModuleProps> = ({ onLogout }) => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true,
      appointmentReminders: true,
      newMessages: true,
      reportUploads: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
    },
    privacy: {
      shareData: false,
      allowTelemedicine: true,
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveSettings = () => {
    console.log('Saving settings:', settings);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    console.log('Changing password');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-medical-text flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Password Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            />
          </div>
          <Button onClick={handleChangePassword} className="bg-gradient-to-r from-medical-primary to-medical-secondary">
            Change Password
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-medical-text flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-medical-muted">Receive notifications via email</p>
            </div>
            <Switch
              checked={settings.notifications.email}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, email: checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>SMS Notifications</Label>
              <p className="text-sm text-medical-muted">Receive notifications via SMS</p>
            </div>
            <Switch
              checked={settings.notifications.sms}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, sms: checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Push Notifications</Label>
              <p className="text-sm text-medical-muted">Receive push notifications</p>
            </div>
            <Switch
              checked={settings.notifications.push}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, push: checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Appointment Reminders</Label>
              <p className="text-sm text-medical-muted">Get reminded about upcoming appointments</p>
            </div>
            <Switch
              checked={settings.notifications.appointmentReminders}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, appointmentReminders: checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>New Messages</Label>
              <p className="text-sm text-medical-muted">Notify when receiving new messages</p>
            </div>
            <Switch
              checked={settings.notifications.newMessages}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, newMessages: checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Report Uploads</Label>
              <p className="text-sm text-medical-muted">Notify when new reports are uploaded</p>
            </div>
            <Switch
              checked={settings.notifications.reportUploads}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, reportUploads: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-medical-text flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-medical-muted">Add an extra layer of security</p>
            </div>
            <Switch
              checked={settings.security.twoFactorAuth}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  security: { ...settings.security, twoFactorAuth: checked },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Session Timeout (minutes)</Label>
            <Input
              type="number"
              value={settings.security.sessionTimeout}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  security: { ...settings.security, sessionTimeout: Number(e.target.value) },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-medical-text">Privacy Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Share Data for Analytics</Label>
              <p className="text-sm text-medical-muted">Allow anonymized data sharing</p>
            </div>
            <Switch
              checked={settings.privacy.shareData}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, shareData: checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Allow Telemedicine</Label>
              <p className="text-sm text-medical-muted">Enable video consultations</p>
            </div>
            <Switch
              checked={settings.privacy.allowTelemedicine}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, allowTelemedicine: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-medical-primary to-medical-secondary">
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

