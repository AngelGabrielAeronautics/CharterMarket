import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy, limit as limitQuery, Timestamp } from 'firebase/firestore';
import { Notification, NotificationType, NotificationPreferences } from '@/types/notification';

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Notification['metadata'],
  link?: string
): Promise<string> => {
  try {
    // Build notification object without undefined fields
    const notificationData: Omit<Notification, 'id'> & { [key: string]: any } = {
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: Timestamp.now(),
    };

    if (link !== undefined) {
      notificationData.link = link;
    }

    if (metadata !== undefined) {
      notificationData.metadata = metadata;
    }

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
};

export const getUserNotifications = async (
  userId: string,
  limit = 20
): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limitQuery(limit)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw new Error('Failed to get user notifications');
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw new Error('Failed to get unread count');
  }
};

export const getUserNotificationPreferences = async (
  userId: string
): Promise<NotificationPreferences | null> => {
  try {
    const preferencesRef = collection(db, 'notificationPreferences');
    const q = query(preferencesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const data = querySnapshot.docs[0].data();
    return {
      userId: data.userId,
      email: data.email,
      push: data.push,
      sms: data.sms,
      types: data.types,
    } as NotificationPreferences;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    throw new Error('Failed to get notification preferences');
  }
};

export const updateNotificationPreferences = async (
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> => {
  try {
    const preferencesRef = collection(db, 'notificationPreferences');
    const q = query(preferencesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      await addDoc(preferencesRef, {
        userId,
        ...preferences,
      });
    } else {
      const docRef = doc(db, 'notificationPreferences', querySnapshot.docs[0].id);
      await updateDoc(docRef, preferences);
    }
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw new Error('Failed to update notification preferences');
  }
}; 