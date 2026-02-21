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
        <div className='max-w-screen-2xl px-2 mx-auto sm:px-4 lg:px-6 py-3 mt-3'>
         <div className='sm:flex basis-1 justify-evenly py-3'>
         <div>
            <Link href='/'>
              <img className='w-20 sm:w-28' src={getImageSrc(bbm_small)} alt="" />
            </Link>
            <p className='px-2 text-lg font-bold'>Customer Guarantee</p>
            <p className='px-2 text-sm my-2'>We promise 100% satisfaction.<br /> Customer happiness is our top priority</p>
            <div className="flex my-3 px-2 max-w-[14rem] border border-gray-300 rounded overflow-hidden bg-gray-50 focus-within:ring-1 focus-within:ring-blue-100 focus-within:border-blue-100">
              <div className="flex items-center justify-center ps-2 flex-shrink-0">
                <svg
                  className="w-3 h-3 text-gray-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 16"
                >
                  <path d="M10.036 8.278l9.258-7.79A1.979 1.979 0 0 0 18 0H2A1.987 1.987 0 0 0 .641.541l9.395 7.737Z" />
                  <path d="M11.241 9.817c-.36.275-.801.425-1.255.427-.428 0-.845-.138-1.187-.395L0 2.6V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2.5l-8.759 7.317Z" />
                </svg>
              </div>
              <input
                type="text"
                id="email"
                value={email}
                className="flex-1 min-w-0 outline-none bg-transparent text-gray-700 text-xs p-1.5"
                placeholder="bbmecom@bbm.com"
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                onClick={HandleSend}
                type="button"
                className="flex-shrink-0 self-stretch flex items-center justify-center border-l border-gray-300 px-3 text-xs text-gray-500 hover:text-white hover:bg-purple-800 transition-colors"
              >
                Send
              </button>
            </div>
              {isPopupVisible && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white p-3 rounded shadow-lg text-center">
                    <p className="text-sm font-semibold">Email sent successfully!</p>
                  </div>
                </div>
              )}
            </div>
            <div className='my-2 px-4 lg:px-0'>
                <div className='text-sm font-medium lg:text-base'>Information</div>
                <ul className='text-gray-600 text-xs lg:text-sm mt-1'>
                    <li><Link className='text-gray-600 hover:underline' href={'/aboutus'}>About Us</Link></li>
                    <li><Link className='text-gray-600 hover:underline' href={'/paymentinfo'}>Payment & Shipping</Link></li>
                    <li><Link className='text-gray-600 hover:underline' href={'/return'}>Returns & refunds</Link></li>
                    <li><Link className='text-gray-600 hover:underline' href={'/contactus'}>Contact Us</Link></li>
                    <li><Link className='text-gray-600 hover:underline' href={'#'}>FAQs</Link></li>
                </ul>
            </div>
            <div className='my-2 px-4 lg:px-0'>
                <div className='text-sm font-medium lg:text-base'>Popular Products</div>
                <ul className='flex-wrap flex flex-col h-28 lg:h-40 text-xs lg:text-sm mt-1'>
                    <li><Link className='text-gray-600 hover:underline mr-1' href={'/apparel'}>T-Shirts</Link></li>
                    <li><Link className='text-gray-600 hover:underline mr-1' href={'/drinkware'}>Ceramic Mugs</Link></li>
                    <li><Link className='text-gray-600 hover:underline mr-1' href={'/bag'}>Non Woven Bags</Link></li>
                    <li><Link className='text-gray-600 hover:underline mr-1' href={'/office/92'}>Lanyards</Link></li>
                    <li><Link className='text-gray-600 hover:underline mr-1' href={'/office'}>Button Badges</Link></li>
                    <li><Link className='text-gray-600 hover:underline mr-1' href={'/office'}>Stationaries</Link></li>
                    <li><Link className='text-gray-600 hover:underline mr-1' href={'/technology'}>Displays</Link></li>
                    <li><Link className='text-gray-600 hover:underline mr-1' href={'/bag'}>Papers</Link></li>
                </ul>
            </div>
            <div className='px-4 lg:px-0'>
                <div className='text-sm lg:text-base font-medium'>Contact</div>
                <ul className='flex-col flex gap-1 mt-1'>
                    <li className='inline-flex items-center gap-2'>
                        <img src={getImageSrc(facebook_icon)} alt="" className='w-4 h-4' />
                        <a href='https://facebook.com/bbmhq1' className='text-gray-600 text-xs lg:text-sm' target="_blank" rel="noopener noreferrer">Facebook</a>
                    </li>
                    <li className='inline-flex items-center gap-2'>
                        <img src={getImageSrc(instagram_icon)} alt="" className='w-4 h-4' />
                        <a href='https://instagram.com/bytonbytemanagement' className='text-gray-600 text-xs lg:text-sm' target="_blank" rel="noopener noreferrer">Instagram</a>
                    </li>
                </ul>
            </div>
        </div>
        </div>
        <hr className='max-w-7xl mx-auto border-gray-800' />
        <div className='mx-auto text-center m-3 p-3'>
            <p className='text-sm font-medium'>We Accept</p>
            <div className='flex justify-center items-center lg:space-x-4 my-3 flex-wrap lg:flex-nowrap gap-1'>
                <img className='w-8 h-6 object-contain mx-1' src="/images/visa-seeklogo.png" alt="" />
                <img className='w-8 h-6 object-contain mx-1' src="/images/mc_symbol.png" alt="" />
                <img className='w-8 h-6 object-contain mx-1' src="/images/logo-maybank2u-1.png" alt="" />
                {/* <img className='w-8 h-6 object-contain mx-1' src="/images/cimb.png" alt="" /> */}
                <img className='w-8 h-6 object-contain mx-1' src="/images/grab.png" alt="" />
                <img className='w-8 h-6 object-contain mx-1' src="/images/boost.png" alt="" />
                <img className='w-8 h-6 object-contain mx-1' src="/images/tng.png" alt="" />
            </div>
            <div className='text-gray-500 text-[10px] lg:text-xs lg:leading-5 mt-2'>
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

