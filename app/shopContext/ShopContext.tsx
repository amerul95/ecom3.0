'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import useFetchData from './UseFetchData';

export interface CartItem {
  id: number;
  quantity: number;
  color: string;
  size: string;
}

export interface Product {
  id: number;
  name: string;
  new_price: number;
  old_price?: number;
  image_paths?: string;
  colors?: string;
  sizes?: string;
  materials?: string;
  description?: string;
  weight?: string;
  printing_method?: string;
  printing_size?: string;
  category?: string;
  [key: string]: any;
}

interface ShopContextType {
  allProducts: Product[];
  cartItems: CartItem[];
  addToCart: (itemId: number, quantity?: number, color?: string, size?: string) => void;
  removeFromCart: (itemId: number) => void;
  updateCartItemQuantity: (itemId: number, newQuantity: number) => void;
  getTotalCartAmount: () => number;
  getTotalCartItems: () => number;
  fullDelete: (itemId: number, color: string, size: string) => void;
  loading: boolean;
  error: Error | null;
  getDefaultCart: (products: Product[]) => CartItem[];
  saveCartToLocalStorage: (cart: CartItem[]) => void;
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export const ShopContext = createContext<ShopContextType | undefined>(undefined);

interface ShopContextProviderProps {
  children: ReactNode;
}

const ShopContextProvider: React.FC<ShopContextProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const { datas: products, isLoading, error: fetchError } = useFetchData<Product[]>('https://backend-run-79be31c2d90c.herokuapp.com/products');

  useEffect(() => {
    if (!isLoading && !fetchError) {
      setAllProducts(products || []);

      const savedCart = localStorage.getItem('cartItems');
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (err) {
          console.error('Error parsing cart from localStorage:', err);
          setCartItems(getDefaultCart(products || []));
        }
      } else {
        setCartItems(getDefaultCart(products || []));
      }
      
      setLoading(false);
    } else if (fetchError) {
      setError(fetchError);
      setLoading(false);
    }
  }, [products, isLoading, fetchError]);

  const getDefaultCart = (products: Product[]): CartItem[] => {
    return products.map(product => ({
      id: product.id,
      quantity: 0,
      color: '',
      size: ''
    }));
  };

  const addToCart = (itemId: number, quantity: number = 1, color: string = '', size: string = '') => {
    setCartItems((prev) => {
      const existingItemIndex = prev.findIndex(item => item.id === itemId && item.color === color && item.size === size);
      let updatedItems: CartItem[];
      if (existingItemIndex > -1) {
        updatedItems = [...prev];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        };
      } else {
        updatedItems = [...prev, { id: itemId, quantity, color, size }];
      }
      saveCartToLocalStorage(updatedItems);
      return updatedItems;
    });
  };

  const removeFromCart = (itemId: number) => {
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

  const fullDelete = (itemId: number, color: string, size: string) => {
    setCartItems((prev) => {
      const filteredItems = prev.filter(item => {
        const itemColor = item.color || 'No color selected';
        const itemSize = item.size || 'No size selected';
        return !(item.id === itemId && itemColor === color && itemSize === size);
      });
      console.log('Updated cart items:', filteredItems);
      saveCartToLocalStorage(filteredItems);
      return filteredItems;
    });
  };

  const updateCartItemQuantity = (itemId: number, newQuantity: number) => {
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
      if (item.quantity > 0) {
        const itemInfo = allProducts.find(product => product.id === item.id);
        if (itemInfo) {
          return totalAmount + itemInfo.new_price * item.quantity;
        }
      }
      return totalAmount;
    }, 0);
  };

  const saveCartToLocalStorage = (cart: CartItem[]) => {
    console.log('Saving cart to local storage:', cart);
    localStorage.setItem('cartItems', JSON.stringify(cart));
  };

  const getTotalCartItems = (): number => {
    return cartItems.reduce((totalItems, item) => totalItems + item.quantity, 0);
  };

  const contextValue: ShopContextType = {
    allProducts,
    cartItems,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    getTotalCartAmount,
    getTotalCartItems,
    fullDelete,
    loading,
    error,
    getDefaultCart,
    saveCartToLocalStorage,
    setCartItems
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;

