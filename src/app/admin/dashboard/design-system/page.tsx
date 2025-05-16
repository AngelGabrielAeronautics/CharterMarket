import React from 'react';
// This route has been consolidated into the Style Guide
export default function Page() {
  // Redirect to the Style Guide
  if (typeof window !== 'undefined') {
    window.location.href = '/admin/dashboard/style-guide';
  }
  return null;
} 