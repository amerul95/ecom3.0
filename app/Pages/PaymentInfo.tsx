'use client';

import React from 'react'
import Link from 'next/link'

export const PaymentInfo: React.FC = () => {
  return (
    <div className='max-w-6xl mx-auto p-10'>
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
                <Link href={`/paymentinfo`} className="ms-1 text-sm font-medium text-gray-700">
                  Payment
                </Link>
              </div>
            </li>
          </ol>
        </nav>
    </div>
    <div className='max-w-6xl mx-auto'>
        <div>
            <div className='flex justify-center'>
            <div className='relative flex justify-center text-center max-w-60'>
            <h4 className='text-3xl font-bold before:content-[""] before:absolute before:-bottom-1 before:transform before:-translate-x-1/2 before:left-1/2 before:w-32 before:h-[2px] before:bg-black'>PAYMENT INFO</h4>
            </div>
            </div>
            <ol className='list-decimal list-outside ml-10'>
              <li className='text-xl font-medium mt-10'>For orders valued at S$ 2,000 or below, payment in full is required before we proceed.</li>
              <li className='text-xl font-medium mt-5'>For orders exceeding S$ 2,000, a 70% deposit is required before production begins, with the remaining 30% payable before delivery.</li>
              <li className='text-xl font-medium mt-5'>A surcharge applies to urgent orders and expedited delivery.</li>
              <li className='text-xl font-medium mt-5'>Sample visuals/mockups will be delivered via WhatsApp upon confirmation of payment.</li>
              <li className='text-xl font-medium mt-5'>We accept payments via online transfer, cash deposit machines, or checks.</li>
            </ol>
        </div>
        <div className='mt-14'>
            <div className='flex justify-center'>
            <div className='relative flex justify-center text-center max-w-60'>
            <h4 className='text-3xl font-bold before:content-[""] before:absolute before:-bottom-1 before:transform before:-translate-x-1/2 before:left-1/2 before:w-32 before:h-[2px] before:bg-black '>SHIPPING INFO</h4>
            </div>
            </div>
            <ol className='list-decimal list-outside ml-10'>
              <li className='text-xl font-medium mt-10'>After sample approval, production will begin according to the schedule provided in the quotation.
              </li>
              <li className='text-xl font-medium mt-5'>Orders are shipped by courier and usually arrive within 3-5 business days.
              </li>
              <li className='text-xl font-medium mt-5'>We can facilitate same-day delivery within a 50km radius of Klang city through Lalamove.
              </li>
              <li className='text-xl font-medium mt-5'>Shipping fees are based on the delivery location, time requirements, weight, etc.
              </li>
              <li className='text-xl font-medium mt-5'>Any extra customs duties for international deliveries are the customer's responsibility, and no refunds will be issued.</li>
            </ol>
        </div>
    </div>
    </div>
  )
}

