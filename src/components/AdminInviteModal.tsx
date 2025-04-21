'use client';

import { Dialog } from '@headlessui/react';
import { useState, FormEvent } from 'react';
import Input from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { AdminPermissions } from '@/lib/admin';
import { sendAdminInvitation } from '@/lib/admin';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserData } from '@/lib/auth';

interface AdminInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminInviteModal = ({ isOpen, onClose }: AdminInviteModalProps) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });
  
  const [permissions, setPermissions] = useState<AdminPermissions>({
    userManagement: false,
    bookingManagement: false,
    financialAccess: false,
    systemConfig: false,
    contentManagement: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (!user) throw new Error('You must be logged in to invite admins');

      // Fetch the user's data from Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Unable to find your account information. Please contact support.');
      }

      const userData = querySnapshot.docs[0].data() as UserData;

      await sendAdminInvitation(
        formData.email,
        formData.firstName,
        formData.lastName,
        permissions,
        {
          uid: user.uid,
          email: user.email!,
          userCode: userData.userCode,
        }
      );

      setSuccess(true);
      setFormData({ email: '', firstName: '', lastName: '' });
      setPermissions({
        userManagement: false,
        bookingManagement: false,
        financialAccess: false,
        systemConfig: false,
        contentManagement: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permission: keyof AdminPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded bg-white p-6 shadow-xl dark:bg-dark-primary">
          <Dialog.Title className="text-lg font-medium mb-4">Invite Admin User</Dialog.Title>
          
          {success && (
            <div className="mb-4 p-2 bg-green-100 text-green-700 rounded dark:bg-green-900 dark:text-green-300">
              Invitation sent successfully!
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded dark:bg-red-900 dark:text-red-300">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              label="Email"
              name="email"
              required
              disabled={loading}
            />
            
            <Input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              label="First Name"
              name="firstName"
              required
              disabled={loading}
            />
            
            <Input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              label="Last Name"
              name="lastName"
              required
              disabled={loading}
            />

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Permissions</h3>
              <div className="space-y-2">
                {Object.keys(permissions).map((permission) => (
                  <label key={permission} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permissions[permission as keyof AdminPermissions]}
                      onChange={() => handlePermissionChange(permission as keyof AdminPermissions)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-dark-secondary"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {permission.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:text-gray-300 dark:hover:bg-dark-accent"
                disabled={loading}
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600"
                disabled={loading}
              >
                {loading ? 'SENDING...' : 'SEND INVITATION'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AdminInviteModal; 