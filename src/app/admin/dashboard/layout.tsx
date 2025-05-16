'use client';
import DashboardLayout from '../../dashboard/layout';
// Default layout for admin dashboard
export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 