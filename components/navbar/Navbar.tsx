'use client';

import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import cart from '../../Assets/shopping-cart (1).png';
import bbm_logo from '../../Assets/BBM_ECOMM.png';
import { FiAlignJustify } from 'react-icons/fi';
import { RxCross2 } from 'react-icons/rx';
import { ShoppingCart } from 'lucide-react';
import { ShopContext } from '@/shopContext/ShopContext';
import { useCart } from '@/hooks/useCart';
import type { StaticImageData } from 'next/image';
import type { NavbarCategory } from '@/lib/navbar-categories';

const linkClass =
  'text-gray-700 hover:bg-gray-700 hover:text-white rounded-md px-1 xl:px-3 py-2 text-lg font-thin';
const mobileLinkClass =
  'block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 hover:text-white';

interface NavbarProps {
  categories: NavbarCategory[];
}

export default function Navbar({ categories }: NavbarProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const shopContext = useContext(ShopContext);
  const router = useRouter();
  const { itemCount } = useCart();
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  if (!shopContext ) {
    throw new Error('Navbar must be used within ShopContextProvider and AuthProvider');
  }
  
  const { data: session } = useSession();
  const isAuthenticated = !!session;

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
    await signOut();
    // signOut will handle redirect, but we can also refresh
    router.refresh();
  };

  const getImageSrc = (img: string | StaticImageData): string => {
    return typeof img === 'string' ? img : img.src;
  };

  const categoryLinks = useMemo(
    () =>
      categories.map((cat) => (
        <Link
          key={cat.id}
          className={linkClass}
          href={`/${cat.slug}`}
        >
          {cat.name}
        </Link>
      )),
    [categories]
  );

  const mobileCategoryLinks = useMemo(
    () =>
      categories.map((cat) => (
        <Link
          key={cat.id}
          className={mobileLinkClass}
          href={`/${cat.slug}`}
          onClick={toggleMenu}
        >
          {cat.name}
        </Link>
      )),
    [categories]
  );

  return (
    <nav>
      <div className='relative'>
      <div className='flex mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 lg:my-9 mt-3'>
        <div>
          <Link href='/'><img className='w-48 sm:w-60 h-full' src={getImageSrc(bbm_logo)} alt="" /></Link>
        </div>
        <div className='flex flex-1 items-center sm:items-stretch justify-end gap-x-3'>
          <div className='self-center xl:space-x-2 hidden lg:block'>
            <Link className={linkClass} href='/'>Home</Link>
            {categoryLinks}
          </div>
          <div className='flex self-center justify-center justify-items-center justify-self-center content-center items-center gap-4 mr-5'>
            {isAuthenticated ? (
              <>
                {/* User Icon with Dropdown - hidden on mobile < 522px, shown in dropdown instead */}
                <div className='relative hidden min-[523px]:block' ref={userMenuRef}>
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
            <Link
              href='/carts'
              className='relative flex shrink-0 items-center justify-center w-10 h-10 text-gray-700 hover:text-gray-900 max-[522px]:hidden'
              aria-label='Cart'
            >
              <ShoppingCart className='w-6 h-6' strokeWidth={1.5} />
              <span className='absolute -top-0.5 -right-0.5 min-w-5 h-5 flex items-center justify-center rounded-full px-1 text-xs text-white bg-red-600'>
                {itemCount}
              </span>
            </Link>
            <div className='lg:hidden' onClick={toggleMenu}>
              {isOpen ? <RxCross2 size={24} /> : <FiAlignJustify size={24} />}
            </div>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className='absolute left-2 right-2 top-full z-50 mt-1 lg:hidden' id='mobile-menu'>
          <div className='space-y-1 px-2 pb-3 pt-2 bg-slate-600 mx-2 rounded-md shadow-lg'>
            {/* User icon + Cart - only on mobile < 522px */}
            <div className='flex items-center gap-4 px-3 py-2 border-b border-slate-500 min-[523px]:hidden'>
              {isAuthenticated ? (
                <div className='flex items-center gap-2'>
                  <div className='w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm'>
                    {session?.user?.name?.charAt(0).toUpperCase() || session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className='text-gray-300 text-sm truncate max-w-[120px]'>
                    {session?.user?.email}
                  </span>
                </div>
              ) : (
                <Link href='/login' onClick={toggleMenu} className='text-gray-300 hover:text-white text-sm'>Login</Link>
              )}
              <Link href='/carts' onClick={toggleMenu} className='flex items-center gap-1 text-gray-300 hover:text-white'>
                <img className='w-5 h-5' src={getImageSrc(cart)} alt="Cart" />
                <span className='text-xs bg-red-600 text-white rounded-full px-1.5'>{itemCount}</span>
              </Link>
            </div>
            <Link className={mobileLinkClass} href='/' onClick={toggleMenu}>Home</Link>
            {mobileCategoryLinks}
            {isAuthenticated ? (
              <>
                <Link className='block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 hover:text-white' href='/settings' onClick={toggleMenu}>Settings</Link>
                <Link className='block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 hover:text-white' href='/orders' onClick={toggleMenu}>My Orders</Link>
                <button onClick={() => { handleLogout(); toggleMenu(); }} className='block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 hover:text-white'>Logout</button>
              </>
            ) : (
              <Link className='hidden min-[523px]:block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-900 hover:text-white' href='/login' onClick={toggleMenu}>Login</Link>
            )}
          </div>
        </div>
      )}
      </div>
      <hr />
    </nav>
  );
}
