// @ts-nocheck
'use client';

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { UserRole } from './userCode';

// Initialize Firebase Admin
const adminApp = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  : getApp();

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

export interface SuperAdminData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'superAdmin';
  userCode: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  permissions: {
    userManagement: true;
    bookingManagement: true;
    financialAccess: true;
    systemConfig: true;
    contentManagement: true;
  };
}

export interface AdminPermissions {
  userManagement: boolean;
  bookingManagement: boolean;
  financialAccess: boolean;
  systemConfig: boolean;
  contentManagement: boolean;
}

export interface AdminInvitation {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  invitedBy: {
    uid: string;
    email: string;
    userCode: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  invitedAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  permissions: AdminPermissions;
}

export interface AdminUser extends UserData {
  role: 'admin';
  permissions: AdminPermissions;
  status: 'active' | 'suspended';
  suspendedAt?: Date;
  suspendedBy?: {
    uid: string;
    email: string;
    userCode: string;
  };
  suspensionReason?: string;
}

export async function initializeSuperAdmin(email: string, password: string, firstName: string, lastName: string): Promise<SuperAdminData> {
  try {
    // Check if super admin already exists
    const usersRef = adminDb.collection('users');
    const q = usersRef.where('role', '==', 'superAdmin');
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
      throw new Error('A super admin already exists');
    }

    // Create the user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: true,
    });

    // Generate super admin user code
    const userCode = `SA-${lastName.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Prepare super admin data
    const superAdminData: SuperAdminData = {
      email,
      firstName,
      lastName,
      role: 'superAdmin',
      userCode,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true,
      permissions: {
        userManagement: true,
        bookingManagement: true,
        financialAccess: true,
        systemConfig: true,
        contentManagement: true,
      },
    };

    // Save super admin data to Firestore
    await adminDb.collection('users').doc(userCode).set(superAdminData);

    // Set custom claims for super admin
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: 'superAdmin',
      permissions: superAdminData.permissions,
    });

    return superAdminData;
  } catch (error) {
    console.error('Error initializing super admin:', error);
    throw error;
  }
}

export async function verifySuperAdmin(uid: string): Promise<boolean> {
  try {
    const user = await adminAuth.getUser(uid);
    const claims = user.customClaims;
    return claims?.role === 'superAdmin';
  } catch (error) {
    console.error('Error verifying super admin:', error);
    return false;
  }
}

// Function to send admin invitation
export async function sendAdminInvitation(
  email: string,
  firstName: string,
  lastName: string,
  permissions: AdminPermissions,
  invitedBy: { uid: string; email: string; userCode: string }
): Promise<string> {
  try {
    // Check if user is already an admin
    const existingUser = await adminDb
      .collection('users')
      .where('email', '==', email)
      .where('role', 'in', ['admin', 'superAdmin'])
      .get();

    if (!existingUser.empty) {
      throw new Error('User is already an admin');
    }

    // Check for existing pending invitation
    const existingInvite = await adminDb
      .collection('admin_invitations')
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .get();

    if (!existingInvite.empty) {
      throw new Error('User already has a pending invitation');
    }

    // Create invitation document
    const invitation: AdminInvitation = {
      email,
      firstName,
      lastName,
      invitedBy,
      status: 'pending',
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
      permissions
    };

    const inviteRef = await adminDb.collection('admin_invitations').add(invitation);

    // Generate a temporary userCode for the invitation
    const tempUserCode = `AD-${lastName.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Send invitation email with the inviter's info
    await sendAdminInvitationEmail(
      email, 
      firstName, 
      inviteRef.id,
      invitedBy.uid,
      tempUserCode
    );

    return inviteRef.id;
  } catch (error) {
    console.error('Error sending admin invitation:', error);
    throw error;
  }
}

// Function to approve admin registration
export async function approveAdminRegistration(
  invitationId: string,
  approvedBy: { uid: string; email: string; userCode: string }
): Promise<void> {
  try {
    const inviteRef = adminDb.collection('admin_invitations').doc(invitationId);
    const invite = await inviteRef.get();

    if (!invite.exists) {
      throw new Error('Invitation not found');
    }

    const inviteData = invite.data() as AdminInvitation;

    if (inviteData.status !== 'pending') {
      throw new Error('Invitation is not pending');
    }

    // Update user's role and permissions in Auth
    const userRecord = await adminAuth.getUserByEmail(inviteData.email);
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      permissions: inviteData.permissions
    });

    // Generate admin userCode
    const adminUserCode = `AD-${inviteData.lastName.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Update user document in Firestore
    await adminDb.collection('users').doc(userRecord.uid).update({
      role: 'admin',
      permissions: inviteData.permissions,
      status: 'active',
      userCode: adminUserCode,
      updatedAt: new Date()
    });

    // Update invitation status
    await inviteRef.update({
      status: 'accepted',
      acceptedAt: new Date()
    });

    // Send approval email with the new admin's info
    await sendAdminApprovalEmail(
      inviteData.email, 
      inviteData.firstName,
      userRecord.uid,
      adminUserCode
    );
  } catch (error) {
    console.error('Error approving admin registration:', error);
    throw error;
  }
}

// Function to suspend admin account
export async function suspendAdminAccount(
  userCode: string,
  suspendedBy: { uid: string; email: string; userCode: string },
  reason: string
): Promise<void> {
  try {
    const userRef = adminDb.collection('users').doc(userCode);
    const user = await userRef.get();

    if (!user.exists) {
      throw new Error('User not found');
    }

    const userData = user.data() as AdminUser;

    if (userData.role !== 'admin') {
      throw new Error('User is not an admin');
    }

    // Disable user in Auth
    await adminAuth.updateUser(userData.uid, { disabled: true });

    // Update user document
    await userRef.update({
      status: 'suspended',
      suspendedAt: new Date(),
      suspendedBy,
      suspensionReason: reason
    });

    // Send suspension email with the suspended admin's info
    await sendAdminSuspensionEmail(
      userData.email, 
      userData.firstName, 
      reason,
      userData.uid,
      userData.userCode
    );
  } catch (error) {
    console.error('Error suspending admin account:', error);
    throw error;
  }
}

// Function to update admin permissions
export async function updateAdminPermissions(
  userCode: string,
  newPermissions: AdminPermissions
): Promise<void> {
  try {
    const userRef = adminDb.collection('users').doc(userCode);
    const user = await userRef.get();

    if (!user.exists) {
      throw new Error('User not found');
    }

    const userData = user.data() as AdminUser;

    if (userData.role !== 'admin') {
      throw new Error('User is not an admin');
    }

    // Update permissions in Auth
    await adminAuth.setCustomUserClaims(userData.uid, {
      role: 'admin',
      permissions: newPermissions
    });

    // Update user document
    await userRef.update({
      permissions: newPermissions,
      updatedAt: new Date()
    });

    // Send permissions update email with the admin's info
    await sendAdminPermissionsUpdateEmail(
      userData.email, 
      userData.firstName,
      userData.uid,
      userData.userCode
    );
  } catch (error) {
    console.error('Error updating admin permissions:', error);
    throw error;
  }
}

export { adminAuth, adminDb }; 