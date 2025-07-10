import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not available' }, { status: 500 });
    }

    // Verify the token and get user claims
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userCode = decodedToken.userCode;
    const role = decodedToken.role;

    if (!userCode || !role) {
      return NextResponse.json(
        { 
          error: 'Missing user claims - need to fix authentication',
          tokenClaims: { userCode, role },
          solution: 'Call /api/auth/fix-user-claims to fix missing claims'
        },
        { status: 400 }
      );
    }

    // Create a test conversation
    const conversationId = `CONV-TEST-${userCode}-${Date.now()}`;
    const conversationData = {
      title: `Test Conversation - ${new Date().toLocaleTimeString()}`,
      type: 'general_inquiry',
      status: 'active',
      participants: [
        {
          userCode,
          name: `Test User (${userCode})`,
          role,
          joinedAt: new Date(),
          isActive: true,
          notificationPreferences: {
            inApp: true,
            email: true,
            whatsapp: false,
          },
        }
      ],
      participantUserCodes: [userCode],
      messageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date(),
      isGroupChat: false,
      allowFileUploads: true,
      maxParticipants: 2,
      unreadCounts: {
        [userCode]: 0,
      },
      priority: 'normal',
      tags: ['test', 'debug'],
      createdBy: userCode,
      emailIntegrationEnabled: true,
      whatsappIntegrationEnabled: false,
    };

    // Save to Firestore
    await adminDb.collection('conversations').doc(conversationId).set(conversationData);

    // Create a test message
    const messageId = `MSG-TEST-${Date.now()}`;
    const messageData = {
      content: 'This is a test message created by the debug endpoint.',
      type: 'text',
      senderId: userCode,
      senderName: `Test User (${userCode})`,
      createdAt: new Date(),
      updatedAt: new Date(),
      readBy: {
        [userCode]: new Date(),
      },
      reactions: {},
      editHistory: [],
      isDeleted: false,
      metadata: {
        platform: 'web',
        debugCreated: true,
      },
    };

    await adminDb
      .collection('conversations')
      .doc(conversationId)
      .collection('messages')
      .doc(messageId)
      .set(messageData);

    // Update conversation with last message
    await adminDb.collection('conversations').doc(conversationId).update({
      messageCount: 1,
      lastMessage: {
        content: messageData.content,
        type: messageData.type,
        senderName: messageData.senderName,
        createdAt: messageData.createdAt,
      },
      lastActivityAt: messageData.createdAt,
    });

    return NextResponse.json({
      success: true,
      message: 'Test conversation created successfully',
      conversationId,
      messageId,
      userClaims: { userCode, role },
      data: {
        conversation: conversationData,
        message: messageData,
      },
    });

  } catch (error: any) {
    console.error('Error creating test conversation:', error);
    return NextResponse.json(
      {
        error: 'Failed to create test conversation',
        details: error.message,
      },
      { status: 500 }
    );
  }
} 