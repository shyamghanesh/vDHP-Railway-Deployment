import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Bot, 
  Send, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle,
  MessageSquare,
  FileText,
  Heart,
  Activity
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  riskLevel: 'low' | 'medium' | 'high';
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSat: number;
  };
}

interface AIAssistantProps {
  onClose: () => void;
  patient?: Patient;
}

interface AIInsight {
  type: 'trend' | 'alert' | 'recommendation' | 'message';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

const mockInsights: AIInsight[] = [
  {
    type: 'alert',
    title: 'Blood Pressure Trend Alert',
    content: 'Patient shows consistent upward trend in systolic BP over the past week. Current reading of 140/90 is above target range for hypertensive patients.',
    priority: 'high',
    icon: <AlertTriangle className="w-4 h-4" />
  },
  {
    type: 'recommendation',
    title: 'Medication Adjustment Suggested',
    content: 'Consider increasing Lisinopril from 10mg to 15mg daily, or adding a low-dose thiazide diuretic to current regimen.',
    priority: 'medium',
    icon: <Lightbulb className="w-4 h-4" />
  },
  {
    type: 'trend', 
    title: 'Positive Lifestyle Changes',
    content: 'Patient has maintained consistent calorie logging and shows improvement in daily step count over the past month.',
    priority: 'low',
    icon: <TrendingUp className="w-4 h-4" />
  }
];

const suggestedMessages = [
  {
    title: "Blood Pressure Follow-up",
    message: "Hi Sarah, I've been reviewing your recent blood pressure readings and noticed they've been running a bit higher than our target. Let's schedule a quick check-in this week to discuss some adjustments to help get these numbers back on track. You've been doing great with your lifestyle changes!"
  },
  {
    title: "Medication Reminder",
    message: "Hello! I wanted to reach out about your blood pressure medication. Based on your recent readings, we may need to make a small adjustment to help you reach your target goals. This is very common and nothing to worry about. Please call the office to schedule a brief appointment."
  },
  {
    title: "Lifestyle Congratulations",
    message: "Sarah, I'm so impressed with your commitment to tracking your nutrition and staying active! Your consistency is really showing. Let's work together to fine-tune your care plan to get your blood pressure readings into that perfect range we're aiming for."
  }
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ onClose, patient }) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'messages' | 'plan'>('insights');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-destructive bg-destructive/5';
      case 'medium': return 'border-l-warning bg-warning/5';
      case 'low': return 'border-l-success bg-success/5';
      default: return 'border-l-medical-primary bg-medical-primary/5';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-medical-card shadow-elevated overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-medical-primary to-medical-secondary text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="w-6 h-6" />
              <div>
                <CardTitle className="text-white">AI Care Assistant</CardTitle>
                <p className="text-white/80 text-sm">
                  {patient ? `Analyzing ${patient.name}` : 'Patient Care Analysis'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-y-auto max-h-[70vh]">
          {/* Tab Navigation */}
          <div className="flex border-b border-border bg-medical-bg">
            {[
              { id: 'insights', label: 'AI Insights', icon: <Lightbulb className="w-4 h-4" /> },
              { id: 'messages', label: 'Draft Messages', icon: <MessageSquare className="w-4 h-4" /> },
              { id: 'plan', label: 'Care Plans', icon: <FileText className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-medical-primary text-medical-primary bg-medical-primary/5'
                    : 'border-transparent text-medical-muted hover:text-medical-text hover:bg-medical-card'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* AI Insights Tab */}
            {activeTab === 'insights' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-medical-text mb-4">Current Analysis</h3>
                  <div className="space-y-4">
                    {mockInsights.map((insight, index) => (
                      <div
                        key={index}
                        className={`p-4 border-l-4 rounded-lg ${getPriorityColor(insight.priority)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {insight.icon}
                            <h4 className="font-semibold text-medical-text">{insight.title}</h4>
                          </div>
                          <Badge variant={getPriorityBadge(insight.priority)} className="text-xs">
                            {insight.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-medical-text leading-relaxed">{insight.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {patient && (
                  <div className="bg-gradient-to-r from-medical-primary/10 to-medical-secondary/10 p-4 rounded-lg border border-medical-primary/20">
                    <h4 className="font-semibold text-medical-text mb-2 flex items-center space-x-2">
                      <Heart className="w-4 h-4" />
                      <span>Key Metrics Summary</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-medical-muted">Risk Level:</span>
                        <span className={`ml-2 font-medium ${patient.riskLevel === 'high' ? 'text-destructive' : patient.riskLevel === 'medium' ? 'text-warning' : 'text-success'}`}>
                          {patient.riskLevel.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-medical-muted">Current BP:</span>
                        <span className="ml-2 font-medium text-medical-text">{patient.vitals.bloodPressure}</span>
                      </div>
                      <div>
                        <span className="text-medical-muted">Heart Rate:</span>
                        <span className="ml-2 font-medium text-medical-text">{patient.vitals.heartRate} bpm</span>
                      </div>
                      <div>
                        <span className="text-medical-muted">Condition:</span>
                        <span className="ml-2 font-medium text-medical-text">{patient.condition}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-medical-text mb-4">Suggested Messages</h3>
                  <div className="space-y-4">
                    {suggestedMessages.map((template, index) => (
                      <div
                        key={index}
                        className="p-4 border border-border rounded-lg hover:shadow-soft transition-all cursor-pointer"
                        onClick={() => setSelectedTemplate(template.message)}
                      >
                        <h4 className="font-semibold text-medical-text mb-2">{template.title}</h4>
                        <p className="text-sm text-medical-muted">{template.message}</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomMessage(template.message);
                            setSelectedTemplate(template.message);
                          }}
                        >
                          Use Template
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-medical-text mb-4">Custom Message</h3>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Write a personalized message to the patient..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-medical-muted">
                        Tip: Use empathetic language and focus on actionable next steps
                      </p>
                      <Button className="bg-gradient-to-r from-medical-primary to-medical-secondary">
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Care Plan Tab */}
            {activeTab === 'plan' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-medical-text mb-4">AI-Generated Care Plan</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-success/10 to-medical-secondary/10 rounded-lg border border-success/20">
                      <h4 className="font-semibold text-medical-text mb-2 flex items-center space-x-2">
                        <Activity className="w-4 h-4" />
                        <span>Immediate Actions (Next 1-2 weeks)</span>
                      </h4>
                      <ul className="space-y-2 text-sm text-medical-text">
                        <li className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                          <span>Schedule follow-up appointment for blood pressure reassessment</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                          <span>Consider medication adjustment (increase Lisinopril or add diuretic)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                          <span>Provide dietary counseling materials focusing on sodium reduction</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-warning/10 to-medical-primary/10 rounded-lg border border-warning/20">
                      <h4 className="font-semibold text-medical-text mb-2 flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Medium-term Goals (1-3 months)</span>
                      </h4>
                      <ul className="space-y-2 text-sm text-medical-text">
                        <li className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
                          <span>Achieve target blood pressure &lt;130/80 mmHg consistently</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
                          <span>Establish regular exercise routine (150 minutes moderate activity/week)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
                          <span>Weight reduction of 5-10 pounds through dietary modifications</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-medical-primary/10 to-medical-secondary/10 rounded-lg border border-medical-primary/20">
                      <h4 className="font-semibold text-medical-text mb-2 flex items-center space-x-2">
                        <Heart className="w-4 h-4" />
                        <span>Long-term Management (3+ months)</span>
                      </h4>
                      <ul className="space-y-2 text-sm text-medical-text">
                        <li className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-medical-primary rounded-full mt-2"></div>
                          <span>Maintain optimal cardiovascular health with regular monitoring</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-medical-primary rounded-full mt-2"></div>
                          <span>Annual comprehensive cardiovascular risk assessment</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-medical-primary rounded-full mt-2"></div>
                          <span>Patient self-management education and ongoing lifestyle support</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline">Save as Draft</Button>
                  <Button className="bg-gradient-to-r from-medical-primary to-medical-secondary">
                    Generate Care Plan Document
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};