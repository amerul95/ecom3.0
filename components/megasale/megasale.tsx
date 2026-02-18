'use client';

import React from 'react';
import man_adult from '../../Assets/man-adult.png'
import './megasale.css'
import Link from 'next/link';
import type { StaticImageData } from 'next/image';

export const Megasale: React.FC = () => {
  const getImageSrc = (img: string | StaticImageData): string => {
    return typeof img === 'string' ? img : img.src;
  };

  return (
    <div className='bg-container max-w-7xl px-2 mx-auto  sm:px-6 lg:px-8 m-2 flex my-4 md:my-8 justify-center'>
        <div>
            <img className='hidden sm:block w-52 md:w-full' src={getImageSrc(man_adult)} alt="" />
        </div>
        <div className='flex flex-col justify-center m-8 lg:m-0 md:gap-8 ml-10 '>
            <h2 className='h2-ms text-3xl md:text-6xl font-bold '>MEGA SALE - 30%</h2>
            <p className='p-ms text-lg md:text-2xl leading-5 lg:leading-none my-2 lg:my-0'>Casual collection for men's <br /> We all have choices for you.Check it out</p>
            <Link href={'/apparel'} className="bg-color text-white font-bold py-2 px-8 rounded max-w-64 mt-2 hover:border text-center lg:mx-0">
             SHOW MORE
            </Link>
        </div>
    </div>
  );
};

