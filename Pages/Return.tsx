'use client';

import React from 'react';
import Link from 'next/link';
import dot from '../Assets/Ellipse_583.png';
import type { StaticImageData } from 'next/image';

export const Return: React.FC = () => {
  const getImageSrc = (img: string | StaticImageData): string => {
    return typeof img === 'string' ? img : img.src;
  };
  return (
    <div className='max-w-6xl mx-auto mt-10 mb-20'>
        <div className='flex justify-center py-5 '>
         <nav className="flex justify-start m-5" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
            <li className="inline-flex items-center">
              <Link href={'/'} className="inline-flex items-center text-sm font-medium text-gray-700">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 6 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 9 4-4-4-4"
                  />
                </svg>
                <Link href={`/return`} className="ms-1 text-sm font-medium text-gray-700">
                  Return & Refund
                </Link>
              </div>
            </li>
          </ol>
        </nav>
    </div>
    <div>
    <div className='flex justify-center'>
            <div className='relative flex justify-center text-center '>
            <h4 className='text-3xl font-bold before:content-[""] before:absolute before:-bottom-4 before:transform before:-translate-x-1/2 before:left-1/2 before:w-40 before:h-[2px] before:bg-black'>RETURNS & REFUND</h4>
            </div>
            </div>
    </div>
    <div className='flex mt-20 mb-14 justify-around max-w-3xl mx-auto'>
        <div className='w-36 flex flex-col justify-center items-center'>
            <img src="/images/Group-692.png" alt="" />
            <p className='text-sm font-bold mt-3'>Email Us</p>
        </div>
        <div className='flex justify-center items-center'>
            <img src="/images/angle-small-right.png" alt="" />
        </div>
        <div className='w-36 flex flex-col justify-center items-center'>
            <img src="/images/Group-691.png" alt="" />
            <p className='text-sm font-bold mt-3'>Response</p>
        </div>
        <div className='flex justify-center items-center'>
            <img src="/images/angle-small-right.png" alt="" />
        </div>
        <div className='w-36 flex flex-col justify-center items-center'>
            <img src="/images/Group-690.png" alt="" />
            <p className='text-sm font-bold mt-3'>Replacement</p>
        </div>
        <div className='flex justify-center items-center'>
            <img src="/images/angle-small-right.png" alt="" />
        </div>
        <div className='w-36 flex flex-col justify-center items-center'>
            <img src="/images/Group-689.png" alt="" />
            <p className='text-sm font-bold mt-3'>Received</p>
        </div>
    </div>
    <div className='max-w-3xl mx-auto'>
        <ul >
            <div className='inline-flex justify-center items-start'>
            <img src={getImageSrc(dot)} alt="" className='mt-2 mr-3'/>
            <li >We provide replacements and refunds for items with defects if these defects occurred during delivery.</li>
            </div>
            <div className='inline-flex justify-center items-start'>
            <img src={getImageSrc(dot)} alt="" className='mt-2 mr-3'/>
            <li>To initiate a return, simply photograph the defective item, the parcel, and the consignment note, and email the images to support@bytonbyte.com.
            </li>
            </div >
            <div className='inline-flex justify-center items-start'>
            <img src={getImageSrc(dot)} alt="" className='mt-2 mr-3'/>
            <li>We will cover the shipping costs for replacements.
            </li>
            </div>
            <div className='inline-flex justify-center items-start'>
            <img src={getImageSrc(dot)} alt=""  className='mt-2 mr-3'/>
            <li>Please note that the return policy is valid for 30 days from the date you receive the item from the shipping agent.</li>
            </div>
        </ul>
    </div>
    <div className='max-w-4xl mx-auto mt-10 text-xl font-bold'>
      <p className='mt-5'>Please email us at <a href="mailto:support@bytonbyte.com" className='underline'>support@bytonbyte.com</a> or all return and exchange assistance.</p>
      <p className='mt-5'>BBM ECOMMERCE reserved the rights to change or alter the policy for any reason at any time without notice.</p>
      <p className='mt-5'>Thank you for your patience and trusting our service!</p>
    </div>
    </div>
  )
}

