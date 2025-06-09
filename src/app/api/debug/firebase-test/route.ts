import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';

export async function GET(req: NextRequest) {
  try {
    // Test Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Check if all required env vars are present
    const missingVars = Object.entries(firebaseConfig)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing Firebase environment variables',
          missingVariables: missingVars,
        },
        { status: 400 }
      );
    }

    // Test Firebase auth initialization
    const authInstance = auth;

    return NextResponse.json({
      status: 'success',
      message: 'Firebase configuration is valid',
      config: {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        hasApiKey: !!firebaseConfig.apiKey,
        authInitialized: !!authInstance,
      },
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Firebase configuration test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
