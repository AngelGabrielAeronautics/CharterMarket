import { useDarkMode } from '@/contexts/DarkModeContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface LogoProps {
  href?: string;
  height?: number;
  className?: string;
}

export default function Logo({ href, height = 40, className = '' }: LogoProps) {
  const { isDarkMode } = useDarkMode();
  const [imageError, setImageError] = useState(false);
  
  const logoSrc = isDarkMode 
    ? '/branding/logos/light/charter logo - dark mode.png'
    : '/branding/logos/dark/charter logo - light mode.png';
    
  const logoComponent = (
    <div className={`relative transition-opacity duration-200 ${className}`}>
      {imageError ? (
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          CHARTER
        </h1>
      ) : (
        <Image
          src={logoSrc}
          alt="Charter Logo"
          height={height}
          width={height * 3.5}
          className="object-contain"
          priority
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity duration-200">
        {logoComponent}
      </Link>
    );
  }

  return logoComponent;
} 