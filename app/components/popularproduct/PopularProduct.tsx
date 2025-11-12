'use client';

import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './popular.css';
import Link from 'next/link';
import useFetchData from '../../shopContext/UseFetchData';
import { ErrorCpnt } from '../error/ErrorCpnt';
import { Loading } from '../loader/Loading';
import { Product } from '../../shopContext/ShopContext';

interface SimpleSliderProps {
  products: Product[];
}

function SimpleSlider({ products }: SimpleSliderProps) {
  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          initialSlide: 2
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  return (
    <div className="mx-auto text-center my-8">
      <Slider {...settings}>
        {products.map((product) => {
          const firstImagePath = product.image_paths ? product.image_paths.split(',')[0].trim() : '';
          return (
            <div key={product.id}>
            <Link href={`/drinkware/${product.id}`}>
              <img src={`https://backend-run-79be31c2d90c.herokuapp.com/images/drinkware/${firstImagePath}`} alt={`Popular Product ${product.id}`} className="mx-auto max-w-56" />
            </Link>
          </div>
          )
        })}
      </Slider>
      <div className="container mx-auto mt-10 flex lg:flex-row flex-col gap-4 justify-center">
        <div className="lg:grid lg:grid-rows-2 lg:grid-flow-row lg:gap-4 lg:w-1/2 flex flex-col">
          <div className="row-span-1 col-span-2 shadow-lg rounded flex">
            <img src="/images/Mask Group 6.png" alt="" />
            <div className='flex items-center mr-3'>
              <div className='p-5 justify-between flex flex-col bg-slate-900 h-64'>
                <p className='text-white text-sm text-left'>GREAT COLLECTION</p>
                <div>
                  <h4 className='text-white text-2xl text-left'>TECHNOLOGY COLLECTION</h4>
                  <p className='text-left'><Link href={'/technology'} className='text-white text-xs'>VIEW MORE &gt;</Link></p>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:row-span-1 lg:col-span-1 shadow-lg rounded hidden lg:block">
            <img className='h-full' src="/images/tshirt.png" alt="" />
          </div>
          <div className="row-span-1 col-span-1 shadow-lg rounded flex flex-col justify-evenly py-5">
            <p className='text-2xl font-bold'>BAG COLLECTIONS</p>
            <img className='p-5 lg:p-0' src="/images/Image 30.png" alt="" />
            <p className='text-base bg-violet-800 w-40 mx-auto text-white p-1 rounded'>
              <Link href={'/bag'}>GO TO CATALOG</Link>
            </p>
          </div>
        </div>
        <div className="lg:grid lg:grid-rows-2 lg:grid-flow-row lg:gap-4 lg:w-1/2 flex flex-col">
          <div className="row-span-1 col-span-1 shadow-lg rounded lg:h-auto relative w-full flex flex-col justify-between pt-5">

            <div className='z-10'>
              <p className='text-sm font-thin text-violet-600'>ON DEMAND</p>
              <h4 className='text-2xl font-bold text-violet-600'>CLOTHING <br /> COLLECTION</h4>
            </div>
            <div className=" bottom-0 flex justify-center">
              <img className='' src="/images/Mask Group 5.png" alt="" />
            </div>
            <p className='text-base text-white bg-violet-900 w-36 text-center mx-auto absolute bottom-0 left-1/2 transform -translate-x-1/2 z-20 py-1 px-5 rounded mb-7'>
              <Link href={'/apparel'}>SHOW MORE</Link>
            </p>
          </div>
          <div className="row-span-1 col-span-1 shadow-lg rounded p-5 flex flex-col justify-evenly">
            <img src="/images/Image 29.png" alt="" />
            <div className='gap-3 flex flex-col mt-5'>
              <p className='text-2xl font-bold'>DRINKWARE</p>
              <p className='bg-violet-800 text-white text-base w-40 mx-auto py-1 rounded'>
                <Link href={'/drinkware'}>GO TO CATALOG</Link>
              </p>
            </div>
          </div>
          <div className="row-span-1 col-span-2 shadow-lg rounded p-5 relative ">
            <img className='z-0 h-full' src="/images/Group 658.png" alt="" />
            <div className='lg:absolute right-16 bottom-10 space-y-3 z-10'>
              <p className='text-2xl font-bold'>CORPORATE</p>
              <p className='text-base bg-violet-800 text-white py-1 mx-auto rounded w-40 lg:w-auto'>
                <Link href={'/office'}>VIEW MORE</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const PopularProduct: React.FC = () => {
  const { datas, isLoading, error } = useFetchData<Product[]>('https://backend-run-79be31c2d90c.herokuapp.com/products/drinkware');
  
  if (isLoading) return <Loading/>;
  if (error) return <ErrorCpnt/>;
  

  return (
    <div className='max-w-7xl px-2 mx-auto sm:px-6 lg:px-8 m-2 flex my-4 md:my-8 flex-col'>
      <div>
        <h2 className='text-3xl font-semibold'>
          POPULAR PRODUCTS 
          <hr className='custom-hr' />
        </h2>
      </div>
      <div>
        <SimpleSlider products={datas || []} />
      </div>
    </div>
  );
};

