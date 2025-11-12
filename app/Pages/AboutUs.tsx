'use client';

import React from 'react';
import Link from 'next/link';

export const AboutUs: React.FC = () => {
  return (
    <div>
      <div className='flex justify-center py-10 '>
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
                <Link href={`/aboutus`} className="ms-1 text-sm font-medium text-gray-700">
                  About Us
                </Link>
              </div>
            </li>
          </ol>
        </nav>
    </div>
    <div className='max-w-6xl mx-auto'>
        <div className='my-14'>
        <div className='relative inline-block'>
        <h4 className='text-3xl font-bold before:content-[""] before:absolute before:-bottom-1 before:left-0 before:w-full before:h-[2px] before:bg-black'>
          VISION
        </h4>
      </div>
      <p className='text-xl  font-medium mt-7'>
        Our goal is to lead as the top provider of tailored corporate gifts and merchandise, empowering businesses of every size to strengthen their brand, boost customer loyalty, and increase profitability.
      </p>
        </div>
        <div className='my-14'>
        <div className='relative inline-block'>
        <h4 className='text-3xl font-bold before:content-[""] before:absolute before:-bottom-1 before:left-0 before:w-full before:h-[2px] before:bg-black'>
          Mission
        </h4>
      </div>
      <p className='text-xl mt-7 font-medium'>
      Our mission is to collaborate with companies, startups, government agencies, educational institutions, and beyond to provide high-quality, personalized corporate gifts that enhance brand visibility, draw in new customers, and nurture lasting relationships with existing clients.
      </p>
      <p className='text-xl mt-7 font-medium'>
      We are committed to exceeding our clients' expectations by blending creativity, innovation, and outstanding customer service, ensuring their success.
      </p>
      <p className='text-xl mt-7 font-medium'>
      With our expertise in gift printing and branding, we aspire to be the preferred partner for businesses seeking effective strategies to boost profitability and achieve sustainable growth.
      </p>
        </div>
        <div className='my-14'>
        <div className='relative inline-block'>
        <h4 className='text-3xl font-bold before:content-[""] before:absolute before:-bottom-1 before:left-0 before:w-full before:h-[2px] before:bg-black'>
          VALUES
        </h4>
      </div>
      <p className='text-xl font-medium mt-10'>
      <span className='font-extrabold'>Commitment to Quality:</span> We are dedicated to producing products and services that consistently meet the most rigorous standards. Our unwavering focus on excellence is evident in every element of our business as we continually aim to surpass industry norms.
      </p>
      <p className='text-xl font-medium mt-7'>
      <span className='font-extrabold'>Customer-First Approach:</span> Our clients are the foundation of our business. We listen carefully to their needs, create personalized solutions, and prioritize their satisfaction above all else. Our primary goal is to build lasting and meaningful relationships with each of our clients
      </p>
      <p className='text-xl font-medium mt-7'>
      <span className='font-extrabold'>Innovation Through Creative: </span> Creativity and innovation are central to our achievements. We are committed to exploring new ideas, embracing the latest technologies, and applying cutting-edge methodologies to deliver solutions that set our clients' brands apart from the competition.
      </p>
      <p className='text-xl font-medium mt-7'>
      <span className='font-extrabold'>Ethical Standards and Professional Conduct</span> We operate with the highest level of integrity in all our dealings. Our steadfast commitment to honesty, transparency, and professionalism strengthens the trust and credibility we have with our clients, partners, and employees.
      </p>
      <p className='text-xl font-medium mt-7'>
      <span className='font-extrabold'>Collaborative Excellence: </span> We are strong advocates of collaboration. We foster a workplace culture that values teamwork, open communication, and mutual respect. By embracing diverse perspectives and working together, we are able to achieve outstanding results.
      </p>
        </div>
    </div>
    </div>
  )
}

