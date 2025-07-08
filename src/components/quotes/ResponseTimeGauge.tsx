'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

interface ResponseTimeGaugeProps {
  averageResponseTime: number; // in minutes
  size?: number;
}

const ResponseTimeGauge: React.FC<ResponseTimeGaugeProps> = ({ 
  averageResponseTime, 
  size = 200 
}) => {
  // Performance levels and their colors (clockwise from top)
  const performanceLevels = [
    { threshold: 60, color: '#4ade80', label: 'Excellent' }, // ≤1 hour (top)
    { threshold: 240, color: '#84cc16', label: 'Good' }, // ≤4 hours
    { threshold: 1440, color: '#eab308', label: 'Fair' }, // ≤24 hours
    { threshold: 4320, color: '#f97316', label: 'Slow' }, // ≤3 days
    { threshold: Infinity, color: '#ef4444', label: 'Needs Improvement' }, // >3 days
  ];

  // Gauge configuration
  const startAngle = -90; // Start at top (12 o'clock position)
  const totalAngle = 360; // Full circle
  const segmentAngle = totalAngle / 5; // 72 degrees per segment
  
  const outerRadius = size * 0.4;
  const innerRadius = size * 0.25;
  const needleLength = size * 0.35;

  // Calculate which segment the response time falls into
  const getPerformanceSegment = (responseTime: number): number => {
    if (responseTime <= 60) return 0; // Excellent (top)
    if (responseTime <= 240) return 1; // Good
    if (responseTime <= 1440) return 2; // Fair
    if (responseTime <= 4320) return 3; // Slow
    return 4; // Needs Improvement
  };

  // Get current performance level
  const getCurrentPerformanceLevel = (responseTime: number) => {
    const segment = getPerformanceSegment(responseTime);
    return performanceLevels[segment];
  };

  // Calculate needle angle based on segment
  const calculateNeedleAngle = (responseTime: number): number => {
    const segment = getPerformanceSegment(responseTime);
    // Calculate the center angle of the segment
    const segmentStart = startAngle + (segment * segmentAngle);
    const segmentCenter = segmentStart + (segmentAngle / 2);
    return segmentCenter;
  };

  // Create SVG arc path
  const createArcPath = (startAngle: number, endAngle: number, innerR: number, outerR: number): string => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    const centerX = (size + 80) / 2;
    const centerY = (size + 80) / 2;
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    const x1 = centerX + innerR * Math.cos(startAngleRad);
    const y1 = centerY + innerR * Math.sin(startAngleRad);
    const x2 = centerX + outerR * Math.cos(startAngleRad);
    const y2 = centerY + outerR * Math.sin(startAngleRad);
    
    const x3 = centerX + outerR * Math.cos(endAngleRad);
    const y3 = centerY + outerR * Math.sin(endAngleRad);
    const x4 = centerX + innerR * Math.cos(endAngleRad);
    const y4 = centerY + innerR * Math.sin(endAngleRad);
    
    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x1} ${y1}`;
  };

  const needleAngle = calculateNeedleAngle(averageResponseTime);
  const currentLevel = getCurrentPerformanceLevel(averageResponseTime);

  // Format time for display - always show the most appropriate unit
  const formatTime = (minutes: number): string => {
    if (minutes === 0) return '0m';
    
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = Math.floor(minutes % 60);
    
    // For values >= 1 day, show days (and hours if significant)
    if (days >= 1) {
      if (hours >= 1) {
        return `${days}d ${hours}h`;
      }
      return `${days}d`;
    }
    
    // For values >= 1 hour, show hours (and minutes if significant)
    if (hours >= 1) {
      if (mins >= 1) {
        return `${hours}h ${mins}m`;
      }
      return `${hours}h`;
    }
    
    // For values < 1 hour, show minutes
    return `${mins}m`;
  };

  // Segment colors in order (clockwise from top)
  const segmentColors = ['#4ade80', '#84cc16', '#eab308', '#f97316', '#ef4444'];

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      gap: 2 
    }}>
      <svg width={size + 80} height={size + 80} viewBox={`0 0 ${size + 80} ${size + 80}`}>
        {/* Background circle */}
        <circle
          cx={(size + 80)/2}
          cy={(size + 80)/2}
          r={outerRadius}
          fill="#f3f4f6"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        
        {/* Color segments */}
        {segmentColors.map((color, index) => {
          const segmentStart = startAngle + (index * segmentAngle);
          const segmentEnd = segmentStart + segmentAngle;
          
          return (
            <path
              key={index}
              d={createArcPath(segmentStart, segmentEnd, innerRadius, outerRadius)}
              fill={color}
              stroke="#ffffff"
              strokeWidth="2"
            />
          );
        })}
        
        {/* Tick marks at segment boundaries */}
        {Array.from({ length: 5 }, (_, i) => {
          const angle = startAngle + (i * segmentAngle);
          const angleRad = (angle * Math.PI) / 180;
          const tickStart = outerRadius + 5;
          const tickEnd = outerRadius + 15;
          const centerX = (size + 80) / 2;
          const centerY = (size + 80) / 2;
          
          const x1 = centerX + tickStart * Math.cos(angleRad);
          const y1 = centerY + tickStart * Math.sin(angleRad);
          const x2 = centerX + tickEnd * Math.cos(angleRad);
          const y2 = centerY + tickEnd * Math.sin(angleRad);
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#374151"
              strokeWidth="2"
            />
          );
        })}
        
        {/* Center hub */}
        <circle
          cx={(size + 80)/2}
          cy={(size + 80)/2}
          r="8"
          fill="#374151"
        />
        
        {/* Needle */}
        <g transform={`rotate(${needleAngle} ${(size + 80)/2} ${(size + 80)/2})`}>
          <line
            x1={(size + 80)/2}
            y1={(size + 80)/2}
            x2={(size + 80)/2}
            y2={(size + 80)/2 - needleLength}
            stroke="#dc2626"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <polygon
            points={`${(size + 80)/2-4},${(size + 80)/2} ${(size + 80)/2+4},${(size + 80)/2} ${(size + 80)/2},${(size + 80)/2-needleLength+10}`}
            fill="#dc2626"
          />
        </g>
        
        {/* Center dot */}
        <circle
          cx={(size + 80)/2}
          cy={(size + 80)/2}
          r="4"
          fill="#dc2626"
        />
        
        {/* Performance labels around the circle */}
        {performanceLevels.map((level, index) => {
          const angle = startAngle + (index * segmentAngle) + (segmentAngle / 2);
          const angleRad = (angle * Math.PI) / 180;
          const labelRadius = outerRadius + 30;
          const centerX = (size + 80) / 2;
          const centerY = (size + 80) / 2;
          
          const x = centerX + labelRadius * Math.cos(angleRad);
          const y = centerY + labelRadius * Math.sin(angleRad);
          
          return (
            <text
              key={index}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#6b7280"
              fontSize="11"
              fontWeight="500"
            >
              {level.label}
            </text>
          );
        })}
      </svg>
      
      {/* Performance indicators */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 'bold', 
          color: currentLevel.color,
          mb: 0.5 
        }}>
          {formatTime(averageResponseTime)}
        </Typography>
        <Typography variant="body2" sx={{ 
          color: '#6b7280',
          fontWeight: 'medium' 
        }}>
          {currentLevel.label}
        </Typography>
      </Box>
      
      {/* Color legend */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 1,
        mt: 1,
        maxWidth: '280px'
      }}>
        {performanceLevels.map((level, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            fontSize: '0.7rem'
          }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: level.color 
            }} />
            <Typography variant="caption" sx={{ color: '#9ca3af' }}>
              {level.threshold === Infinity ? '>3d' : 
               level.threshold === 4320 ? '≤3d' :
               level.threshold === 1440 ? '≤1d' :
               level.threshold === 240 ? '≤4h' : '≤1h'}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ResponseTimeGauge; 