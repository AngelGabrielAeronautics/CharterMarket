// @ts-nocheck
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Box, Button, useTheme } from '@mui/material';

interface VideoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  videoSrcWebm?: string;
  videoSrcMp4?: string;
  label: string;
  className?: string;
}

const VideoButton = forwardRef<HTMLButtonElement, VideoButtonProps>(
  ({ videoSrcWebm, videoSrcMp4, label, className, ...props }, ref) => {
    const theme = useTheme();

    return (
      <Button
        ref={ref}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: theme.shape.borderRadius,
          minWidth: 120,
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: theme.typography.fontWeightMedium,
          transition: theme.transitions.create(['transform'], {
            duration: theme.transitions.duration.shorter,
          }),
          '&:hover': {
            transform: 'scale(1.02)',
          },
          ...(className && { className })
        }}
        {...props}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          poster={props.disabled ? undefined : '/path-to-fallback-image.jpg'} // Optional: Add a poster image
        >
          {videoSrcWebm && <source src={videoSrcWebm} type="video/webm" />}
          {videoSrcMp4 && <source src={videoSrcMp4} type="video/mp4" />}
        </video>
        
        {/* Semi-transparent overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            transition: theme.transitions.create('background-color'),
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            }
          }}
        />
        
        {/* Button content */}
        <Box sx={{ position: 'relative', zIndex: 10 }}>{label}</Box>
      </Button>
    );
  }
);

VideoButton.displayName = 'VideoButton';

export default VideoButton; 