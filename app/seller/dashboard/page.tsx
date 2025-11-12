'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

export default function SellerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalItems: 0,
    activeItems: 0,
    totalRevenue: 0,
    isLoading: true,
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/seller/login');
      return;
    }

    // Redirect to login if user doesn't have SELLER role
    if (status === 'authenticated' && session?.user?.role !== 'SELLER') {
      router.push('/seller/login?error=unauthorized');
      return;
    }

    // Fetch seller stats
    if (status === 'authenticated' && session?.user?.role === 'SELLER') {
      fetchStats();
    }
  }, [status, session, router]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/seller/products');
      const products = response.data.products || [];
      
      // Calculate stats
      const totalItems = products.length;
      const activeItems = products.filter((p: any) => p.stock > 0).length;
      
      // Calculate revenue (would need orders data, for now set to 0)
      const totalRevenue = 0;

      setStats({
        totalItems,
        activeItems,
        totalRevenue,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Failed to fetch seller stats:', error);
      setStats({
        totalItems: 0,
        activeItems: 0,
        totalRevenue: 0,
        isLoading: false,
      });
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading' || stats.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show loading state while redirecting
  if (status === 'unauthenticated' || session?.user?.role !== 'SELLER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={session?.user} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Seller Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Items</h2>
              <p className="text-3xl font-bold text-indigo-600">{stats.totalItems}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Active Items</h2>
              <p className="text-3xl font-bold text-green-600">{stats.activeItems}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Revenue</h2>
              <p className="text-3xl font-bold text-purple-600">S$ {stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <p className="text-gray-500">No recent activity</p>
          </div>
        </div>
      </main>
    </div>
  );
}

