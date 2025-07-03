import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import Input from './Input';

interface UserProfileProps {
  user?: {
    name?: string;
    email?: string;
    role?: string;
  };
  onSave?: (data: any) => void;
  loading?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  onSave, 
  loading = false 
}) => {
  const [formData, setFormData] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
  };

  if (loading) {
    return <UserProfileSkeleton />;
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Full Name
          </label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter your full name"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-2">
            Role
          </label>
          <Input
            id="role"
            type="text"
            value={formData.role}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            placeholder="Your role"
            disabled
          />
        </div>
        
        <Button type="submit" className="w-full">
          Save Changes
        </Button>
      </form>
    </Card>
  );
};

export const UserProfileSkeleton: React.FC = () => {
  return (
    <Card className="p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-6"></div>
        <div className="space-y-4">
          <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </Card>
  );
}; 