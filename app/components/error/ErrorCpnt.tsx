'use client';

import React from 'react'
import Link from 'next/link'

interface ErrorCpntProps {
  error?: Error | string;
}

export const ErrorCpnt: React.FC<ErrorCpntProps> = ({ error }) => {
  return (
    <div className='max-w-7xl mx-auto text-center my-5 p-5 leading-9'>
      <img className='mx-auto' src="/images/404.png" alt="" />
      <h3 className='text-9xl font-bold text-violet-800'>Oops!</h3>
      <p className='text-6xl font-semibold mt-3'>Page not found. </p>
      <p className='text-2xl mt-3'>Sorry, we couldn't find the page where you looking for. </p>
      <p className='text-2xl bg-violet-800 py-1 px-4 w-max mx-auto rounded text-white mt-3'><Link href={'/'}>Go Back</Link></p>
    </div>
  )
}

