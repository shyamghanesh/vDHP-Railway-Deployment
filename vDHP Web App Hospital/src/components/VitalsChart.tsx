import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface VitalsData {
  date: string;
  heartRate: number;
  systolic: number;
  diastolic: number;
  temperature: number;
  oxygenSat: number;
}

interface VitalsChartProps {
  data: VitalsData[];
}

export const VitalsChart: React.FC<VitalsChartProps> = ({ data }) => {
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));

  return (
    <div className="space-y-8">
      {/* Blood Pressure Chart */}
      <div>
        <h3 className="text-lg font-semibold text-medical-text mb-4">Blood Pressure Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--medical-muted))' }} 
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--medical-muted))' }} 
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--medical-card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }} 
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="systolic" 
              stroke="hsl(var(--medical-primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--medical-primary))' }}
              name="Systolic"
            />
            <Line 
              type="monotone" 
              dataKey="diastolic" 
              stroke="hsl(var(--medical-secondary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--medical-secondary))' }}
              name="Diastolic"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Heart Rate Chart */}
      <div>
        <h3 className="text-lg font-semibold text-medical-text mb-4">Heart Rate & Vitals</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--medical-muted))' }} 
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--medical-muted))' }} 
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--medical-card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }} 
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="heartRate" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--destructive))' }}
              name="Heart Rate (bpm)"
            />
            <Line 
              type="monotone" 
              dataKey="oxygenSat" 
              stroke="hsl(var(--success))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--success))' }}
              name="Oxygen Saturation (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};