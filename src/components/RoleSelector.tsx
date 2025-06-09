'use client';

import { UserRole } from '@/lib/utils';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, CardActionArea, SvgIcon } from '@mui/material';

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
      mp4: '/videos/roles/passenger.mp4',
    },
    placeholderColor: '#4A90E2', // Blue
    icon: (
      <SvgIcon>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </SvgIcon>
    ),
  },
  {
    id: 'agent',
    title: 'Travel Agent / Broker',
    description: 'Book flights for clients and manage bookings',
    image: '/images/agent-role.jpg',
    placeholderColor: '#50C878', // Emerald Green
    icon: (
      <SvgIcon>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </SvgIcon>
    ),
  },
  {
    id: 'operator',
    title: 'Aircraft Operator',
    description: 'Manage your fleet and handle charter requests',
    image: '/images/operator-role.jpg',
    placeholderColor: '#FF7F50', // Coral
    icon: (
      <SvgIcon>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        />
      </SvgIcon>
    ),
  },
];

interface ImagePlaceholderProps {
  role: RoleData;
}

function ImagePlaceholder({ role }: ImagePlaceholderProps) {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: role.placeholderColor,
      }}
    >
      <Box sx={{ color: 'white' }}>{role.icon}</Box>
    </Box>
  );
}

export default function RoleSelector({
  selectedRole,
  onRoleSelect,
  showOptions,
  onContinue,
}: RoleSelectorProps) {
  const selectedRoleData = selectedRole ? roles.find((r) => r.id === selectedRole) : null;
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleImageError = (roleId: string) => {
    setImageError((prev) => ({
      ...prev,
      [roleId]: true,
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* Left side - Video/Image */}
      <Box
        sx={{
          width: '100%',
          height: { xs: '300px', md: '520px' },
          position: 'relative',
          flex: { md: '0 0 50%' },
        }}
      >
        {selectedRoleData?.id === 'passenger' && selectedRoleData.video && !videoError ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            poster={currentImage}
            onError={handleVideoError}
          >
            <source src={selectedRoleData.video.mp4} type="video/mp4" />
            {selectedRoleData.video.webm && (
              <source src={selectedRoleData.video.webm} type="video/webm" />
            )}
          </video>
        ) : !imageError[selectedRole || 'passenger'] ? (
          <Image
            src={currentImage}
            alt="Role illustration"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
            priority
            onError={() => handleImageError(selectedRole || 'passenger')}
          />
        ) : (
          <ImagePlaceholder role={selectedRoleData || roles[0]} />
        )}
      </Box>

      {/* Right side - Form */}
      <Box
        sx={{
          width: '100%',
          flex: { md: '0 0 50%' },
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ color: 'text.primary', fontWeight: 600, mb: 2 }}
          >
            Create your account
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', mb: 1.5 }}>
              Select your role
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {roles.map((role) => (
                <Card
                  key={role.id}
                  variant="outlined"
                  sx={{
                    borderColor: selectedRole === role.id ? 'primary.main' : 'divider',
                    bgcolor: selectedRole === role.id ? 'primary.lighter' : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.light',
                      boxShadow: 1,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => onRoleSelect(role.id as UserRole)}
                    sx={{ p: 1.5, textAlign: 'left' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ color: 'primary.main' }}>{role.icon}</Box>
                      <Box sx={{ ml: 2 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: 'text.primary', fontWeight: 500 }}
                        >
                          {role.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', display: 'block' }}
                        >
                          {role.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </Box>

          <Box sx={{ mt: 'auto' }}>
            <Button
              onClick={onContinue}
              disabled={!selectedRole}
              variant="contained"
              fullWidth
              size="large"
              sx={{ py: 1.5 }}
            >
              CONTINUE
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
