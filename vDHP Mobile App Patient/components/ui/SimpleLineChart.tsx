import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

interface SimpleLineChartProps {
  data: number[];
  labels: string[];
  height?: number;
  color?: string;
  unit?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 80;
const defaultHeight = 200;
const padding = 40;

export function SimpleLineChart({ 
  data, 
  labels, 
  height = defaultHeight, 
  color = Colors.dark.primary,
  unit = ''
}: SimpleLineChartProps) {
  if (data.length === 0 || data.every(v => v === 0)) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  const chartHeight = height - padding * 2;
  const maxValue = Math.max(...data) * 1.1;
  const minValue = Math.min(0, Math.min(...data) * 0.9);
  const range = maxValue - minValue;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * (chartWidth - padding * 2) + padding;
    const y = chartHeight - ((value - minValue) / range) * chartHeight + padding;
    return { x, y, value };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const gridLines = 5;
  const gridLineValues: number[] = [];
  for (let i = 0; i <= gridLines; i++) {
    gridLineValues.push(minValue + (range / gridLines) * i);
  }

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        {/* Grid lines */}
        {gridLineValues.map((value, index) => {
          const y = chartHeight - ((value - minValue) / range) * chartHeight + padding;
          return (
            <Line
              key={`grid-${index}`}
              x1={padding}
              y1={y}
              x2={chartWidth - padding}
              y2={y}
              stroke={Colors.dark.borderLight}
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity={0.3}
            />
          );
        })}

        {/* Chart line */}
        <Polyline
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <Circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={color}
            stroke={Colors.dark.background}
            strokeWidth="2"
          />
        ))}

        {/* Labels on X-axis */}
        {labels.map((label, index) => {
          if (index % Math.ceil(labels.length / 5) !== 0 && index !== labels.length - 1) return null;
          const x = (index / (data.length - 1 || 1)) * (chartWidth - padding * 2) + padding;
          return (
            <SvgText
              key={`label-${index}`}
              x={x}
              y={height - 10}
              fontSize="10"
              fill={Colors.dark.textSecondary}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}

        {/* Y-axis values */}
        {gridLineValues.map((value, index) => {
          if (index % 2 !== 0) return null;
          const y = chartHeight - ((value - minValue) / range) * chartHeight + padding;
          return (
            <SvgText
              key={`y-label-${index}`}
              x={padding - 5}
              y={y + 4}
              fontSize="10"
              fill={Colors.dark.textSecondary}
              textAnchor="end"
            >
              {Math.round(value)}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
});

