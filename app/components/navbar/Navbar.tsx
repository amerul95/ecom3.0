'use client';

import React, { useContext, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import cart from '../../Assets/shopping-cart (1).png';
import bbm_logo from '../../Assets/BBM_ECOMM.png';
import { FiAlignJustify } from 'react-icons/fi';
import { RxCross2 } from 'react-icons/rx';
import { ShopContext } from '../../shopContext/ShopContext';
import { AuthContext } from '../../shopContext/AuthContext';
import { useCart } from '../../hooks/useCart';
import type { StaticImageData } from 'next/image';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const shopContext = useContext(ShopContext);
  const authContext = useContext(AuthContext);
  const router = useRouter();
  const { data: session } = useSession();
  const { itemCount } = useCart();
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  if (!shopContext || !authContext) {
    throw new Error('Navbar must be used within ShopContextProvider and AuthProvider');
  }
  
  const { isAuthenticated, logout } = authContext;

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await logout();
    // signOut will handle redirect, but we can also refresh
    router.refresh();
  };

  const getImageSrc = (img: string | StaticImageData): string => {
    return typeof img === 'string' ? img : img.src;
  };

  return (
    <nav>
      <div className='flex mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 lg:my-9 mt-3'>
        <div>
          <Link href='/'><img className='w-48 sm:w-60 h-full' src={getImageSrc(bbm_logo)} alt="" /></Link>
        </div>
        <div className='flex flex-1 items-center sm:items-stretch justify-end gap-x-3'>
          <div className='self-center xl:space-x-2 hidden lg:block'>
            <Link className='text-gray-700 hover:bg-gray-700 hover:text-white rounded-md px-1 xl:px-3 py-2 text-lg font-thin' href='/'>Home</Link>
            <Link className='text-gray-700 hover:bg-gray-700 hover:text-white rounded-md px-1 xl:px-3 py-2 text-lg font-thin' href='/apparel'>Apparel</Link>
            <Link className='text-gray-700 hover:bg-gray-700 hover:text-white rounded-md px-1 xl:px-3 py-2 text-lg font-thin' href='/technology'>Technology</Link>
            <Link className='text-gray-700 hover:bg-gray-700 hover:text-white rounded-md px-1 xl:px-3 py-2 text-lg font-thin' href='/drinkware'>Drinkware</Link>
            <Link className='text-gray-700 hover:bg-gray-700 hover:text-white rounded-md px-1 xl:px-3 py-2 text-lg font-thin' href='/bag'>Bags</Link>
            <Link className='text-gray-700 hover:bg-gray-700 hover:text-white rounded-md px-1 xl:px-3 py-2 text-lg font-thin' href='/office'>Office</Link>
          </div>
          <div className='flex self-center justify-center justify-items-center justify-self-center content-center items-center space-x-4 mr-5'>
            {isAuthenticated ? (
              <>
                {/* User Icon with Dropdown */}
                <div className='relative' ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className='flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 hover:border-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  >
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className='w-full h-full rounded-full object-cover'
                      />
                    ) : (
                      <div className='w-full h-full rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm'>
                        {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50'>
                      <div className='px-4 py-2 border-b border-gray-200'>
                        <p className='text-sm font-semibold text-gray-900 truncate'>
                          {session?.user?.name || 'User'}
                        </p>
                        <p className='text-xs text-gray-500 truncate'>
                          {session?.user?.email}
                        </p>
                      </div>
                      <Link
                        href='/settings'
                        onClick={() => setIsUserMenuOpen(false)}
                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors'
                      >
                        ⚙️ Settings
                      </Link>
                      <Link
                        href='/orders'
                        onClick={() => setIsUserMenuOpen(false)}
                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors'
                      >
                        📦 My Orders
                      </Link>
                      <div className='border-t border-gray-200 mt-1'>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleLogout();
                          }}
                          className='block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors'
                        >
                          🚪 Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={handleLogout} className='border rounded-2xl border-slate-800 px-4 py-1 hover:bg-gray-700 hover:text-white hidden lg:block'>Logout</button>
              </>
            ) : (
              <Link className='border rounded-2xl border-slate-800 px-4 py-1 hover:bg-gray-700 hover:text-white hidden lg:block' href='/login'>Login</Link>
            )}
            <div className='relative'>
              <Link href={'/carts'}>
                <img className='w-6 sm:w-full' src={getImageSrc(cart)} alt="" />
              </Link>
              <div className='absolute lg:top-0 lg:right-[-5px] top-[-5px] right-[-9px] rounded-full px-1 text-xs text-white bg-red-600'>{itemCount}</div>
            </div>
            <div className='lg:hidden' onClick={toggleMenu}>
              {isOpen ? <RxCross2 size={24} /> : <FiAlignJustify size={24} />}
            </div>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className='sm:hidden' id='mobile-menu'>
          <div className='space-y-1 px-2 pb-3 pt-2 bg-slate-600 mx-2 rounded-md'>
            <Link className='block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 hover:text-white' href='/'>Home</Link>
            <Link className='block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 hover:text-white' href='/apparel'>Apparel</Link>
            <Link className='block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 hover:text-white' href='/technology'>Technology</Link>
            <Link className='block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 hover:text-white' href='/drinkware'>Drinkware</Link>
            <Link className='block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 hover:text-white' href='/bag'>Bags</Link>
            <Link className='block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 hover:text-white' href='/office'>Office</Link>
            {isAuthenticated ? (
              <>
                <Link className='block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 hover:text-white' href='/settings'>Settings</Link>
                <Link className='block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 hover:text-white' href='/orders'>My Orders</Link>
                <button onClick={handleLogout} className='block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 hover:text-white'>Logout</button>
              </>
            ) : (
              <Link className='block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 hover:text-white' href='/login'>Login</Link>
            )}
          </div>
        </div>
      )}
      <hr />
    </nav>
  );
}
