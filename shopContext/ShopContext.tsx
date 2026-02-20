'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface Product {
  id: number | string;
  name?: string;
  description?: string;
  colors?: string;
  sizes?: string;
  materials?: string;
  new_price?: number | string;
  price?: number | string;
  weight?: string;
  printing_method?: string;
  printing_size?: string;
  image?: string;
  images?: string[];
  image_paths?: string;
  category?: string;
}

export interface CartItem {
  id: number | string;
  quantity: number;
  color: string;
  size: string;
  // Store product info in cart item to avoid fetching all products
  name?: string;
  price?: number;
  image?: string;
  category?: string;
}

interface ShopContextType {
  cartItems: CartItem[];
  addToCart: (itemId: number | string, quantity?: number, color?: string, size?: string, productInfo?: { name?: string; price?: number; image?: string; category?: string }) => void;
  removeFromCart: (itemId: number | string) => void;
  updateCartItemQuantity: (itemId: number | string, newQuantity: number) => void;
  getTotalCartAmount: () => number;
  getTotalCartItems: () => number;
  fullDelete: (itemId: number | string, color: string, size: string) => void;
  saveCartToLocalStorage: (cart: CartItem[]) => void;
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export const ShopContext = createContext<ShopContextType | undefined>(undefined);

interface ShopContextProviderProps {
  children: ReactNode;
}

const ShopContextProvider: React.FC<ShopContextProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (err) {
        console.error('Error parsing cart from localStorage:', err);
        setCartItems([]);
      }
    }
  }, []);

  const addToCart = (
    itemId: number | string,
    quantity: number = 1,
    color: string = '',
    size: string = '',
    productInfo?: { name?: string; price?: number; image?: string; category?: string }
  ) => {
    setCartItems((prev) => {
      const existingItemIndex = prev.findIndex(
        item => item.id === itemId && item.color === color && item.size === size
      );
      let updatedItems: CartItem[];
      
      if (existingItemIndex > -1) {
        updatedItems = [...prev];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        };
      } else {
        updatedItems = [
          ...prev,
          {
            id: itemId,
            quantity,
            color,
            size,
            name: productInfo?.name,
            price: productInfo?.price,
            image: productInfo?.image,
            category: productInfo?.category,
          },
        ];
      }
      saveCartToLocalStorage(updatedItems);
      return updatedItems;
    });
  };

  const removeFromCart = (itemId: number | string) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        if (item.id === itemId) {
          if (item.quantity === 1) {
            return null;
          }
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      }).filter((item): item is CartItem => item !== null);
      saveCartToLocalStorage(updatedItems);
      return updatedItems;
    });
  };

  const fullDelete = (itemId: number | string, color: string, size: string) => {
    setCartItems((prev) => {
      const filteredItems = prev.filter(item => {
        const itemColor = item.color || 'No color selected';
        const itemSize = item.size || 'No size selected';
        return !(item.id === itemId && itemColor === color && itemSize === size);
      });
      saveCartToLocalStorage(filteredItems);
      return filteredItems;
    });
  };

  const updateCartItemQuantity = (itemId: number | string, newQuantity: number) => {
    setCartItems(prev => {
      const updatedItems = prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      saveCartToLocalStorage(updatedItems);
      return updatedItems;
    });
  };

  const getTotalCartAmount = (): number => {
    return cartItems.reduce((totalAmount, item) => {
      if (item.quantity > 0 && item.price) {
        return totalAmount + item.price * item.quantity;
      }
      return totalAmount;
    }, 0);
  };

  const saveCartToLocalStorage = (cart: CartItem[]) => {
    localStorage.setItem('cartItems', JSON.stringify(cart));
  };

  const getTotalCartItems = (): number => {
    return cartItems.reduce((totalItems, item) => totalItems + item.quantity, 0);
  };

  const contextValue: ShopContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    getTotalCartAmount,
    getTotalCartItems,
    fullDelete,
    saveCartToLocalStorage,
    setCartItems,
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
