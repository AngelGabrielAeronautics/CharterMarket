import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    return NextResponse.json({
      success: true,
      firebaseConfig: {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        // Only show safe config values for debugging
        apiKeyExists: !!firebaseConfig.apiKey,
        appIdExists: !!firebaseConfig.appId,
        messagingSenderIdExists: !!firebaseConfig.messagingSenderId,
        storageBucketExists: !!firebaseConfig.storageBucket,
      },
      expectedProjectId: 'charter-ef2c2',
      projectMatch: firebaseConfig.projectId === 'charter-ef2c2',
      adminProjectId: process.env.FIREBASE_PROJECT_ID, // Admin SDK project ID
    });
  } catch (error) {
    console.error('Error checking Firebase config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
