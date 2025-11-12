'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/seller/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/seller/products', label: 'My Products', icon: '📦' },
    { href: '/seller/products/new', label: 'Add New Product', icon: '➕' },
    { href: '/seller/orders', label: 'Orders', icon: '📋' },
    { href: '/seller/settings', label: 'Settings', icon: '⚙️' },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col h-screen">
      {/* User Info Section */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          {user?.image ? (
            <img 
              src={user.image} 
              alt={user.name || 'User'} 
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Client ID</p>
            <p className="text-sm font-medium truncate" title={user?.id}>
              {user?.id || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Name</p>
            <p className="text-sm font-medium truncate" title={user?.name || undefined}>
              {user?.name || 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
            <p className="text-sm font-medium truncate" title={user?.email || undefined}>
              {user?.email || 'Not set'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}



