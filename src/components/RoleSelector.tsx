'use client';

import { UserRole } from '@/lib/utils';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface RoleSelectorProps {
  selectedRole: UserRole | null;
  onRoleSelect: (role: UserRole) => void;
  showOptions: boolean;
  onContinue?: () => void;
}

interface RoleData {
  id: string;
  title: string;
  description: string;
  image: string;
  video?: {
    webm?: string;
    mp4: string;
  };
  placeholderColor: string;
  icon: JSX.Element;
}

const roles: RoleData[] = [
  {
    id: 'passenger',
    title: 'Passenger',
    description: 'Book private flights and manage your travel preferences',
    image: '/images/passenger-role.jpg',
    video: {
      mp4: '/videos/roles/passenger.mp4'
    },
    placeholderColor: '#4A90E2', // Blue
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'agent',
    title: 'Travel Agent / Broker',
    description: 'Book flights for clients and manage bookings',
    image: '/images/agent-role.jpg',
    placeholderColor: '#50C878', // Emerald Green
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'operator',
    title: 'Aircraft Operator',
    description: 'Manage your fleet and handle charter requests',
    image: '/images/operator-role.jpg',
    placeholderColor: '#FF7F50', // Coral
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
];

interface ImagePlaceholderProps {
  role: RoleData;
}

function ImagePlaceholder({ role }: ImagePlaceholderProps) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: role.placeholderColor }}
    >
      <div className="text-white">{role.icon}</div>
    </div>
  );
}

export default function RoleSelector({ selectedRole, onRoleSelect, showOptions, onContinue }: RoleSelectorProps) {
  const selectedRoleData = selectedRole ? roles.find(r => r.id === selectedRole) : null;
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleImageError = (roleId: string) => {
    setImageError(prev => ({
      ...prev,
      [roleId]: true
    }));
  };

  const handleVideoError = () => {
    setVideoError(true);
    console.error('Video failed to load');
  };

  // Reset video error when role changes
  useEffect(() => {
    setVideoError(false);
  }, [selectedRole]);

  // Get current image based on selected role or default to first role
  const currentImage = selectedRoleData?.image || roles[0].image;

  return (
    <div className="flex flex-col md:flex-row rounded-lg overflow-hidden bg-white">
      {/* Left side - Video/Image */}
      <div className="w-full md:w-1/2 relative h-[300px] md:h-[520px]">
        {selectedRoleData?.id === 'passenger' && selectedRoleData.video && !videoError ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster={currentImage}
            onError={handleVideoError}
          >
            <source src={selectedRoleData.video.mp4} type="video/mp4" />
            {selectedRoleData.video.webm && (
              <source src={selectedRoleData.video.webm} type="video/webm" />
            )}
          </video>
        ) : (
          !imageError[selectedRole || 'passenger'] ? (
            <Image
              src={currentImage}
              alt="Role illustration"
              fill
              className="object-cover"
              priority
              onError={() => handleImageError(selectedRole || 'passenger')}
            />
          ) : (
            <ImagePlaceholder role={selectedRoleData || roles[0]} />
          )
        )}
      </div>

      {/* Right side - Form */}
      <div className="w-full md:w-1/2 bg-white flex flex-col">
        <div className="p-8 flex flex-col h-full">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Create your account</h2>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Select your role</h3>
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => onRoleSelect(role.id as UserRole)}
                  className={`w-full relative p-3 rounded-lg border transition-all duration-200 text-left hover:shadow-md ${
                    selectedRole === role.id
                      ? 'border-primary-600 bg-primary-50 dark:bg-dark-accent dark:border-primary-400'
                      : 'border-gray-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-600'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 text-primary-600 dark:text-primary-400">
                      {role.icon}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-primary-900 dark:text-cream-100">
                        {role.title}
                      </h3>
                      <p className="text-xs text-primary-500 dark:text-cream-200">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <Button
              onClick={onContinue}
              disabled={!selectedRole}
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition-colors"
            >
              CONTINUE
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 