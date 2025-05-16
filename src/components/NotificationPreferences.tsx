"use client";

import React from 'react';

interface NotificationPreferencesProps {
  userId: string;
}

export default function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Notification Preferences</h2>
      <p>
        Manage your notification preferences for user <span className="font-medium">{userId}</span>.
      </p>
      {/* TODO: Implement notification preferences UI */}
    </div>
  );
} 