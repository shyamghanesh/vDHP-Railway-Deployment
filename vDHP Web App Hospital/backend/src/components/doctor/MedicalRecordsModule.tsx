import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Download, Eye, Trash2, Search } from 'lucide-react';

type MedicalRecord = {
  id: number;
  patientName: string;
  patientId: string;
  type: 'lab' | 'scan' | 'xray' | 'other';
  fileName: string;
  uploadDate: string;
  category: string;
};

export const MedicalRecordsModule: React.FC = () => {
  const [records] = useState<MedicalRecord[]>([
    { id: 1, patientName: 'John Doe', patientId: 'P001', type: 'lab', fileName: 'blood_test.pdf', uploadDate: '2024-01-10', category: 'Laboratory' },
    { id: 2, patientName: 'Jane Smith', patientId: 'P002', type: 'scan', fileName: 'ct_scan.pdf', uploadDate: '2024-01-08', category: 'Radiology' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || record.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTypeBadge = (type: string) => {
    const badges = {
      lab: <Badge className="bg-blue-500">Lab</Badge>,
      scan: <Badge className="bg-purple-500">Scan</Badge>,
      xray: <Badge className="bg-gray-500">X-Ray</Badge>,
      other: <Badge variant="secondary">Other</Badge>,
    };
    return badges[type as keyof typeof badges] || <Badge>{type}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-medical-card shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-medical-text">Medical Records & Reports</CardTitle>
            <Button className="bg-gradient-to-r from-medical-primary to-medical-secondary">
              <Upload className="w-4 h-4 mr-2" />
              Upload Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medical-muted w-4 h-4" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-border rounded-md"
            >
              <option value="all">All Categories</option>
              <option value="lab">Laboratory</option>
              <option value="scan">Scans</option>
              <option value="xray">X-Ray</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <Card key={record.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-medical-primary to-medical-secondary rounded-full flex items-center justify-center text-white">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-medical-text">{record.patientName}</h3>
                        <p className="text-sm text-medical-muted">ID: {record.patientId}</p>
                        <p className="text-sm font-medium text-medical-text mt-1">{record.fileName}</p>
                        <p className="text-xs text-medical-muted">Uploaded: {record.uploadDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getTypeBadge(record.type)}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

