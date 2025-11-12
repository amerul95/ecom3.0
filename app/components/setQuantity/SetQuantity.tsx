'use client';

import React, { useState, useEffect } from 'react';

interface SetQuantityProps {
  initialQuantity: number;
  onQuantityChange?: (newQuantity: number) => void;
}

export const SetQuantity: React.FC<SetQuantityProps> = ({ initialQuantity, onQuantityChange }) => {
  const [quantity, setQuantity] = useState<number>(initialQuantity || 1);

  useEffect(() => {
    setQuantity(initialQuantity || 1);
  }, [initialQuantity]);

  const increaseQuantity = () => {
    setQuantity(prevQuantity => {
      const newQuantity = prevQuantity + 1;
      if (onQuantityChange) onQuantityChange(newQuantity);
      return newQuantity;
    });
  };

  const decreaseQuantity = () => {
    setQuantity(prevQuantity => {
      if (prevQuantity > 1) {
        const newQuantity = prevQuantity - 1;
        if (onQuantityChange) onQuantityChange(newQuantity);
        return newQuantity;
      }
      return prevQuantity;
    });
  };

  return (
    <div className="flex items-center space-x-1 gap-1 mb-5">
      <p className="w-16 h-11 border-gray-800 flex border items-center justify-center">{quantity}</p>
      <div className="space-y-3">
        <img
          src="/images/up-arrow.svg"
          className="w-3 hover:cursor-pointer"
          alt="Increase Quantity"
          onClick={increaseQuantity}
        />
        <img
          src="/images/down-arrow.svg"
          className="w-3 cursor-pointer"
          alt="Decrease Quantity"
          onClick={decreaseQuantity}
        />
      </div>
    </div>
  );
};

