import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message:
      'Please log out and log back in to refresh your authentication token with updated permissions.',
    instructions: [
      '1. Click the logout button in your dashboard',
      '2. Log back in with the same email and password',
      '3. Your quote requests should now work properly',
    ],
  });
}
