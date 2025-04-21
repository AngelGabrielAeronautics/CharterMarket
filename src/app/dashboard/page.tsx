'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserData } from '@/lib/auth';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Users,
  Plane,
  Building2,
  CalendarDays,
  Settings,
  UserPlus,
  PlaneTakeoff,
} from 'lucide-react';

interface QuickAction {
  name: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const superAdminQuickActions: QuickAction[] = [
  {
    name: 'Manage Users',
    description: 'View and manage all users in the system',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Manage Companies',
    description: 'View and manage operator companies',
    href: '/admin/companies',
    icon: Building2,
  },
  {
    name: 'System Settings',
    description: 'Configure system-wide settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

const agentQuickActions: QuickAction[] = [
  {
    name: 'Book Flight',
    description: 'Create a new flight booking',
    href: '/bookings/new',
    icon: PlaneTakeoff,
  },
  {
    name: 'View Schedule',
    description: 'Check upcoming flights and bookings',
    href: '/schedule',
    icon: CalendarDays,
  },
];

const operatorQuickActions: QuickAction[] = [
  {
    name: 'Manage Fleet',
    description: 'View and manage your aircraft fleet',
    href: '/fleet',
    icon: Plane,
  },
  {
    name: 'Invite Staff',
    description: 'Add new staff members to your team',
    href: '/staff/invite',
    icon: UserPlus,
  },
];

const getQuickActions = (role: string | undefined): QuickAction[] => {
  switch (role) {
    case 'superAdmin':
      return superAdminQuickActions;
    case 'agent':
      return agentQuickActions;
    case 'operator':
      return operatorQuickActions;
    default:
      return [];
  }
};

const getDashboardTitle = (role: string | undefined): string => {
  switch (role) {
    case 'superAdmin':
      return 'Super Admin Dashboard';
    case 'admin':
      return 'Admin Dashboard';
    case 'operator':
      return 'Operator Dashboard';
    case 'agent':
      return 'Agent Dashboard';
    case 'passenger':
      return 'Passenger Dashboard';
    default:
      return 'Dashboard';
  }
};

export default function DashboardPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.email) return;

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', user.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setUserData(querySnapshot.docs[0].data() as UserData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <div>Please sign in to access the dashboard.</div>;
  }

  if (!userData) {
    return <LoadingSpinner />;
  }

  const quickActions = getQuickActions(userData.role);
  const dashboardTitle = getDashboardTitle(userData.role);
  const greeting = userData.company
    ? `Welcome back to ${userData.company}, ${userData.firstName}!`
    : `Welcome back, ${userData.firstName}!`;

  return (
    <div className="container mx-auto px-4 py-8">
      {!user.emailVerified && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            Please verify your email address. We've sent a verification link to {user.email}
          </p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-900 dark:text-cream-100">{dashboardTitle}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">{greeting}</p>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-primary-800 dark:text-cream-200">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Card key={action.name} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <action.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{action.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                  <Button variant="outline" className="w-full" onClick={() => window.location.href = action.href}>
                    Get Started
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 