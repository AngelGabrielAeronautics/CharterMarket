'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import NotificationList from '@/components/NotificationList';
import NotificationPreferences from '@/components/NotificationPreferences';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage your notifications and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <NotificationList userId={user.uid} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <NotificationPreferences userId={user.uid} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 