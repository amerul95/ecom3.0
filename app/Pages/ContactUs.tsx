'use client';

import React from 'react';
import Link from 'next/link';

export const ContactUs: React.FC = () => {
  return (
    <div className='mx-auto max-w-6xl'>
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
                <Link href={`/contactus`} className="ms-1 text-sm font-medium text-gray-700">
                  Contact Us
                </Link>
              </div>
            </li>
          </ol>
        </nav>
    </div>
    <div>
    <div className='flex justify-center'>
        <div className='relative flex justify-center text-center max-w-60'>
            <h4 className='text-3xl font-bold before:content-[""] before:absolute before:-bottom-1 before:transform before:-translate-x-1/2 before:left-1/2 before:w-32 before:h-[2px] before:bg-black'>EMAIL</h4>
            </div>
            </div>
            <div className='max-w-5xl mx-auto text-center text-xl font-medium mt-10'>
                <p>Order: order@bytonbyte.com</p>
                <p>Use this contact if you are a customer who has questions about an order or about placing an order.                </p>
            </div>
            <div className='max-w-5xl mx-auto text-center text-xl font-medium mt-10'>
                <p>Customer Support: support@bytonbyte.com
                </p>
                <p>Use this contact if you a customer who has questions about other than an order.</p>
            </div>
            <div className='flex justify-center'>
        <div className='relative flex justify-center text-center max-w-60 mt-10'>
            <h4 className='text-3xl font-bold before:content-[""] before:absolute before:-bottom-1 before:transform before:-translate-x-1/2 before:left-1/2 before:w-32 before:h-[2px] before:bg-black'>ADDRESS</h4>
            </div>
            </div>
            <p className='mt-10 text-center text-xl font-medium'>C-25-1, KL Trillion, No 338, Jalan Tun Razak, 50400 Kuala Lumpur</p>
            <div className='overflow-hidden relative p-72'>
            <iframe
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d995.9346923540219!2d101.71659842133522!3d3.1633845042071798!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc37db2c157f19%3A0xac6fa4970c62d4ea!2sKL%20Trillion!5e0!3m2!1sen!2smy!4v1723695140560!5m2!1sen!2smy"
  style={{ border: 0 }}
  allowFullScreen
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade"
  title="Map showing the location of KL Trillion"
  className='absolute top-0 left-0 w-full h-full mt-10'
/>
            </div>
            <div className='my-28'>
            <div className='flex justify-center'>
        <div className='relative flex justify-center text-center max-w-60 mt-14'>
            <h4 className='text-3xl font-bold before:content-[""] before:absolute before:-bottom-1 before:transform before:-translate-x-1/2 before:left-1/2 before:w-32 before:h-[2px] before:bg-black'>SOCIAL MEDIA</h4>
            </div>
            </div>
            <div className='flex justify-center mt-10'>
            <div className='text-xl font-medium w-40'>
                <p>Facebook</p>
                <p>Instagram</p>
            </div>
            <div className='text-xl font-medium'>
                <p className='hover:underline'><a href='https://facebook.com/bbmhq1' target='_blank' rel="noopener noreferrer">: facebook.com/bbmhq1</a></p>
                <p className='hover:underline'><a href='https://instagram.com/bytonbytemanagement' target='_blank' rel="noopener noreferrer">: instagram.com/bytonbytemanagement</a></p>
            </div>
            </div>
            </div>
    </div>
    </div>
  )
}

