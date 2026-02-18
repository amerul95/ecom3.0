'use client';

import React, { useState } from 'react'
import bbm_small from '../../Assets/BBM logo 2024 - carrd-11.png'
import './footer.css'
import Link from 'next/link';
import facebook_icon from '../../Assets/facebook-icon.png'
import instagram_icon from '../../Assets/instagram-icon.png'
import type { StaticImageData } from 'next/image';


export default function Footer() {
    const [email, setEmail] = useState<string>("")
    const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false)

    const HandleSend = () => {
        if(email){
            setIsPopupVisible(true)
        }
        setEmail("");
        setTimeout(() => {
            setIsPopupVisible(false)
        },2000)
    }

    const getImageSrc = (img: string | StaticImageData): string => {
        return typeof img === 'string' ? img : img.src;
    }

  return (
    <footer className='footer'>
        <div className='max-w-screen-2xl px-2 mx-auto sm:px-6 lg:px-8 py-5 mt-5'>
         <div className='sm:flex basis-1 justify-evenly py-5'>
         <div>
            <Link href='/'>
              <img className='w-36 sm:w-48' src={getImageSrc(bbm_small)} alt="" />
            </Link>
            <p className='px-3 text-3xl font-bold'>Customer Guarantee</p>
            <p className='px-3 text-xl my-3'>We promise 100% satisfaction.<br /> Customer happiness is our top priority</p>
            <div className="relative my-5 px-3">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400 ml-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 16"
                >
                  <path d="M10.036 8.278l9.258-7.79A1.979 1.979 0 0 0 18 0H2A1.987 1.987 0 0 0 .641.541l9.395 7.737Z" />
                  <path d="M11.241 9.817c-.36.275-.801.425-1.255.427-.428 0-.845-.138-1.187-.395L0 2.6V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2.5l-8.759 7.317Z" />
                </svg>
              </div>
              <button
                onClick={HandleSend}
                className='absolute right-8 top-0 border-l p-2 px-3 text-gray-500 hover:text-white hover:bg-purple-800 hover:rounded-r'
              >
                Send
              </button>
              <input
                type="text"
                id="email"
                value={email}
                className="outline-none max-w-xs bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-100 focus:border-blue-100 block w-full ps-10 p-2.5"
                placeholder="bbmecom@bbm.com"
                onChange={(e) => setEmail(e.target.value)}
              />
              {isPopupVisible && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white p-5 rounded shadow-lg text-center">
                    <p className="text-lg font-semibold">Email sent successfully!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
            <div className='my-3 px-8 lg:px-0'>
                <div className='text-lg font-medium lg:text-2xl'>Information</div>
                <ul className='text-gray-600'>
                    <li>
                        <Link className='text-gray-600 text-xs lg:text-xl' href={'/aboutus'}>About Us</Link>
                    </li>
                    <li>
                        <Link className='text-gray-600 text-xs lg:text-xl' href={'/paymentinfo'}>Payment & Shipping</Link>
                    </li>
                    <li>
                        <Link className='text-gray-600 text-xs lg:text-xl' href={'/return'}>Returns & refunds
                        </Link>
                    </li>
                    <li>
                        <Link className='text-gray-600 text-xs lg:text-xl' href={'/contactus'}>Contact Us</Link>
                    </li>
                    <li>
                        <Link className='text-gray-600 text-xs lg:text-xl' href={'#'}>FAQs</Link>
                    </li>
                </ul>
            </div>
            <div className='my-3 px-8 lg:px-0'>
                <div className='text-lg font-medium lg:text-2xl'>Popular Products</div>
                <ul className=' flex-wrap flex flex-col h-48 lg:h-72'>
                    <li>
                        <Link className='text-gray-600 text-xs lg:text-xl mr-2' href={'/apparel'}>T-Shirts</Link>
                    </li>
                    <li>
                        <Link className='text-gray-600 text-xs lg:text-xl mr-2' href={'/drinkware'}>Ceramic Mugs
                        </Link>
                    </li>
                    <li>
                        <Link className='text-gray-600 text-xs lg:text-xl mr-2' href={'/bag'}>Non Woven Bags</Link>
                    </li>
                    <li>
                        <Link className='text-gray-600 text-xs lg:text-xl mr-2' href={'/office/92'}>Lanyards</Link>
                    </li>
                    <li>
                        <Link className='text-gray-600 text-xs lg:text-xl mr-2' href={'/office'}>Button Badges</Link>
                    </li>
                    <li>
                        <Link className='text-gray-600 text-xs lg:text-xl mr-2' href={'/office'}>Stationaries
                        </Link>
                    </li>
                    <li>
                        <Link className='text-gray-600 text-xs lg:text-xl mr-2' href={'/technology'}>Displays
                        </Link>
                    </li>
                    <li>
                        <Link className='text-gray-600 text-xs lg:text-xl mr-2' href={'/bag'}>Papers
                        </Link>
                    </li>

                </ul>
            </div>
            <div className='px-8 lg:px-0'>
                <div className='text-lg lg:text-2xl font-medium '>Contact</div>
                <ul className='flex-col flex gap-2 mt-2'>
                    <li className='inline-flex items-center gap-4'>
                        <img src={getImageSrc(facebook_icon)} alt="" />
                        <a href='https://facebook.com/bbmhq1' className='text-gray-600' target="_blank" rel="noopener noreferrer">Facebook</a>
                    </li>
                    <li className='inline-flex items-center gap-4'>
                        <img src={getImageSrc(instagram_icon)} alt="" />
                        <a href='https://instagram.com/bytonbytemanagement' className='text-gray-600' target="_blank" rel="noopener noreferrer">Instagram</a>
                    </li>
                </ul>
            </div>
        </div>
        </div>
        <hr className='max-w-7xl mx-auto border-gray-800' />
        <div className='mx-auto text-center m-5 p-5'>
            <p className='text-2xl font-medium'>We Accept</p>
            <div className='flex justify-center items-center lg:space-x-8 my-5 flex-wrap lg:flex-nowrap'>
                <img className='mx-3 sm:mx-0' src="/images/visa-seeklogo.png" alt="" />
                <img className='mx-3 sm:mx-0' src="/images/mc_symbol.png" alt="" />
                <img className='mx-3 sm:mx-0' src="/images/logo-maybank2u-1.png" alt="" />
                {/* cimb.png is missing - uncomment when image is added */}
                {/* <img className='mx-3 sm:mx-0' src="/images/cimb.png" alt="" /> */}
                <img className='mx-3 sm:mx-0' src="/images/grab.png" alt="" />
                <img className='mx-3 sm:mx-0' src="/images/boost.png" alt="" />
                <img className='mx-3 sm:mx-0' src="/images/tng.png" alt="" />
            </div>
            <div className='text-gray-500 text-xs lg:text-sm lg:leading-7'>
            <p>Terms of Service | Privacy Policy</p>
            <p>©2024 Byton Byte Management Sdn Bhd. All Rights Reserved.
            </p>
            <p>C-25-1, KL Trillion, No 338, Jalan Tun Razak 50400 Kuala Lumpur</p>
            <p>Corporate Gifts in Malaysia</p>
            </div>
        </div>
    </footer>

  )
}

