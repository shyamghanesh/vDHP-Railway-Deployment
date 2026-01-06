import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Video, Send, Search, User } from 'lucide-react';

type Message = {
  id: number;
  patientName: string;
  patientId: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
};

export const CommunicationModule: React.FC = () => {
  const [messages] = useState<Message[]>([
    { id: 1, patientName: 'John Doe', patientId: 'P001', lastMessage: 'Thank you for the prescription', timestamp: '2 hours ago', unread: 2 },
    { id: 2, patientName: 'Jane Smith', patientId: 'P002', lastMessage: 'When is my next appointment?', timestamp: '5 hours ago', unread: 1 },
  ]);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-medical-text">Communication & Consultation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medical-muted w-4 h-4" />
                <Input placeholder="Search patients..." className="pl-10" />
              </div>
              <div className="space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => setSelectedChat(message.id)}
                    className={`p-3 border rounded-lg cursor-pointer hover:shadow-soft transition-all ${
                      selectedChat === message.id ? 'border-medical-primary bg-secondary' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-medical-primary to-medical-secondary rounded-full flex items-center justify-center text-white">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-medical-text">{message.patientName}</h4>
                          <p className="text-sm text-medical-muted truncate">{message.lastMessage}</p>
                        </div>
                      </div>
                      {message.unread > 0 && (
                        <Badge className="bg-medical-primary">{message.unread}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-medical-muted mt-2">{message.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2">
              {selectedChat ? (
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{messages.find(m => m.id === selectedChat)?.patientName}</CardTitle>
                      <Button variant="outline" size="sm">
                        <Video className="w-4 h-4 mr-2" />
                        Video Call
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex-1 space-y-4 mb-4 p-4 bg-secondary rounded-lg overflow-y-auto">
                      <div className="flex justify-end">
                        <div className="bg-medical-primary text-white p-3 rounded-lg max-w-xs">
                          <p>Hello, how can I help you today?</p>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-medical-card border p-3 rounded-lg max-w-xs">
                          <p>Thank you for the prescription</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage} className="bg-gradient-to-r from-medical-primary to-medical-secondary">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center text-medical-muted">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

