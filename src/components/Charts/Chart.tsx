import React, { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface DataPoint {
  label: string;
  value: number;
}

interface ChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  color?: string;
}

const Chart: React.FC<ChartProps> = ({ 
  data, 
  title, 
  height = 200,
  color = '#4285F4'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set dimensions
    const padding = 40;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);

    // Find max value for scaling
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = chartWidth / data.length - 10;

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw data
    data.forEach((point, index) => {
      const x = padding + (index * (chartWidth / data.length)) + (barWidth / 2);
      const barHeight = (point.value / maxValue) * chartHeight;
      const y = canvas.height - padding - barHeight;

      // Draw bar
      ctx.fillStyle = color;
      ctx.fillRect(
        x, 
        y, 
        barWidth, 
        barHeight
      );

      // Draw label
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.label, x + (barWidth / 2), canvas.height - padding + 20);

      // Draw value
      ctx.fillText(
        point.value.toString(), 
        x + (barWidth / 2), 
        y - 10
      );
    });
  }, [data, color]);

  return (
    <Box sx={{ width: '100%', height: `${height}px`, position: 'relative' }}>
      {title && (
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          {title}
        </Typography>
      )}
      <canvas 
        ref={canvasRef}
        width={800}
        height={height}
        style={{ width: '100%', height: '100%' }}
      />
    </Box>
  );
};

export default Chart; 