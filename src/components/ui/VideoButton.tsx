import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface VideoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  videoSrcWebm?: string;
  videoSrcMp4?: string;
  label: string;
  className?: string;
}

const VideoButton = forwardRef<HTMLButtonElement, VideoButtonProps>(
  ({ videoSrcWebm, videoSrcMp4, label, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-lg',
          'min-w-[120px] min-h-[40px]',
          'flex items-center justify-center',
          'text-white font-medium',
          'transition-all duration-200',
          'hover:scale-[1.02]',
          className
        )}
        {...props}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster={props.disabled ? undefined : '/path-to-fallback-image.jpg'} // Optional: Add a poster image
        >
          {videoSrcWebm && <source src={videoSrcWebm} type="video/webm" />}
          {videoSrcMp4 && <source src={videoSrcMp4} type="video/mp4" />}
        </video>
        
        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-black/20 hover:bg-black/30 transition-colors" />
        
        {/* Button content */}
        <span className="relative z-10">{label}</span>
      </button>
    );
  }
);

VideoButton.displayName = 'VideoButton';

export default VideoButton; 