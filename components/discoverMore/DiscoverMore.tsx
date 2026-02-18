'use client';

import React from 'react';
import Link from 'next/link';

export const DiscoverMore: React.FC = () => {
  return (
    <div className='my-5 py-5'>
      <h3 className='text-5xl font-bold m-5 text-center'>Discover More</h3>
      <div className='flex gap-8 justify-center relative flex-wrap'>
        <div className="text-3xl relative w-max">
          <Link className=' hover:bg-gray-500 hover:text-white py-1 px-3 rounded block text-center before:content-[""] before:bg-gradient-to-r from-violet-500 to-fuchsia-500 before:h-1 before:w-0 before:absolute
          before:bottom-0 before:left-0 before:rounded-full ease-out duration-300 before:hover:w-full mb-3' href="/">Home</Link>
        </div>
        <div className="text-3xl relative w-max">
          <Link className='hover:bg-gray-500 hover:text-white py-1 px-3 rounded block text-center before:content-[""] before:bg-gradient-to-r from-violet-500 to-fuchsia-500 before:h-1 before:w-0 before:absolute
          before:bottom-0 before:left-0 before:rounded-full ease-out duration-300 before:hover:w-full mb-3' href="/apparel">Apparel</Link>
        </div>
        <div className="text-3xl relative w-max ">
          <Link className='hover:bg-gray-500 hover:text-white py-1 px-3 rounded block text-center before:content-[""] before:bg-gradient-to-r from-violet-500 to-fuchsia-500 before:h-1 before:w-0 before:absolute
          before:bottom-0 before:left-0 before:rounded-full ease-out duration-300 before:hover:w-full mb-3' href="/technology">Electronic</Link>
        </div>
        <div className="text-3xl relative w-max">
          <Link className='hover:bg-gray-500 hover:text-white py-1 px-3 rounded block text-center before:content-[""] before:bg-gradient-to-r from-violet-500 to-fuchsia-500 before:h-1 before:w-0 before:absolute
          before:bottom-0 before:left-0 before:rounded-full ease-out duration-300 before:hover:w-full mb-3' href="/drinkware">Drinkware</Link>
        </div>
        <div className="text-3xl relative w-max">
          <Link className='hover:bg-gray-500 hover:text-white py-1 px-3 rounded block text-center before:content-[""] before:bg-gradient-to-r from-violet-500 to-fuchsia-500 before:h-1 before:w-0 before:absolute
          before:bottom-0 before:left-0 before:rounded-full ease-out duration-300 before:hover:w-full mb-3' href="/bag">Bags</Link>
        </div>
        <div className="text-3xl relative w-max">
          <Link className='hover:bg-gray-500 hover:text-white py-1 px-3 rounded block text-center before:content-[""] before:bg-gradient-to-r from-violet-500 to-fuchsia-500 before:h-1 before:w-0 before:absolute
          before:bottom-0 before:left-0 before:rounded-full ease-out duration-300 before:hover:w-full mb-3' href="/office">Office</Link>
        </div>
      </div>
    </div>
  );
};
