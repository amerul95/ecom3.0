'use client';

import React, { useContext } from 'react';
import Link from 'next/link';
import { ShopContext } from '@/shopContext/ShopContext';
import { CartQuantity } from '@/components/cartquantity/CartQuantity';
import { Loading } from '@/components/loader/Loading';

interface CartItemWithDetails {
  id: number;
  quantity: number;
  color: string;
  size: string;
  name: string;
  price: number;
  image_path: string;
  category: string;
}

export const Cart: React.FC = () => {
  const shopContext = useContext(ShopContext);
  if (!shopContext) {
    throw new Error('Cart must be used within ShopContextProvider');
  }
  const { cartItems, fullDelete, updateCartItemQuantity, getTotalCartAmount, saveCartToLocalStorage, setCartItems } = shopContext;

  const getCartItems = (): CartItemWithDetails[] => {
    return cartItems
      .filter(item => item.quantity > 0)
      .map(item => ({
        id: typeof item.id === 'number' ? item.id : parseInt(item.id.toString()) || 0,
        quantity: item.quantity,
        color: item.color || 'No color selected',
        size: item.size || 'No size selected',
        name: item.name || 'Unknown Product',
        price: item.price || 0,
        image_path: item.image || '',
        category: item.category || 'default'
      }));
  };

  const cartItemsWithDetails = getCartItems();

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    updateCartItemQuantity(itemId, newQuantity);
  };

  const handleClearCart = () => {
    setCartItems([]);
    saveCartToLocalStorage([]);
  };

  return (
    <div className='max-w-7xl px-2 mx-auto sm:px-6 lg:px-10 m-2'>
      <div className='lg:grid grid-cols-[0.5fr,2fr,1fr,1fr,1fr,0.5fr] items-center gap-[75px] pt-5 pb-1 text-[#454545] text-lg font-semibold border-b ml-4 hidden'>
        <p className='ml-3'>ITEMS</p>
        <p className='ml-3'>PRODUCT</p>
        <p className='ml-3'>PRICE</p>
        <p className='ml-3'>QUANTITY</p>
        <p className='ml-3'>SUM</p>
      </div>
      {cartItemsWithDetails.length > 0 ? (
        cartItemsWithDetails.map((item, index) => (
          <div key={index} className='grid lg:grid-cols-[0.5fr,2fr,1fr,1fr,1fr,0.5fr] lg:items-center lg:gap-[75px] lg:pt-5 lg:pb-1 text-[#454545] text-lg font-semibold border-b lg:ml-5 flex-wrap justify-evenly grid-cols-[1fr,2fr,1fr,1fr] '>
            <img
              className="w-auto p-2 object-cover"
              src={item.image_path?.startsWith('http') ? item.image_path : '/images/placeholder.png'}
              alt={item.name}
            />
            <div className='ml-3 lg:ml-0'>
              <p className='text-base lg:text-xl'>{item.name}</p>
              <p className='text-sm lg:text-base text-slate-500 font-normal'>{item.color}</p>
              <p className='text-sm lg:text-base text-slate-500 font-normal'>{item.size}</p>
            </div>
            <p className='hidden lg:block'>RM {item.price}</p>
            <CartQuantity
              itemId={item.id}
              initialQuantity={item.quantity}
              onQuantityChange={(newQuantity) => handleQuantityChange(item.id, newQuantity)}
            />
            <p className='flex justify-center items-center' >RM {item.quantity * item.price}</p>
            <button className='hidden lg:block' onClick={() => fullDelete(item.id, item.color, item.size)}>
              <img src="/images/cross.svg" alt="Delete" className='w-3 h-3' />
            </button>
          </div>
        ))
      ) : (
        <p className='text-center my-5 py-5 font-bold text-xl'>No items in cart</p>
      )}
      <div>
      <hr className='ml-5 my-5'/>
      <div className='flex flex-col'>
        <p className='text-end text-xl font-medium'>TOTAL: <span className='font-bold text-2xl ml-5 '>RM {getTotalCartAmount()}</span></p>
        <hr className='ml-5 my-5'/>
        <div className='text-end space-x-4 flex justify-end gap-3'>
          <button className='text-lg lg:text-xl font-medium text-indigo-500' onClick={handleClearCart}>Clear Cart</button>
          <p className='lg:text-base text-sm bg-violet-500 text-white py-1 px-5 rounded'><Link href="/checkout">Checkout</Link></p>
        </div>
      </div>
      </div>
    </div>
  );
};

