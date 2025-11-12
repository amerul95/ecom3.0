'use client';

import React, { useContext, useState } from 'react';
import { SetQuantity } from '../setQuantity/SetQuantity';
import { ShopContext } from '../../shopContext/ShopContext';
import { Product } from '../../shopContext/ShopContext';

interface DetailsProps {
  item: Product;
}

export const Details: React.FC<DetailsProps> = ({ item }) => {
  const shopContext = useContext(ShopContext);
  if (!shopContext) {
    throw new Error('Details must be used within ShopContextProvider');
  }
  const { addToCart } = shopContext;
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');

  if (!item) {
    return <div>No item details available</div>;
  }

  const itemColors = item.colors ? item.colors.split(',').map(color => color.trim()) : [];
  const itemSizes = item.sizes ? item.sizes.split(',').map(size => size.trim()) : [];
  const itemMaterials = item.materials ? item.materials.split(',').map(material => material.trim()) : [];

  const handleAddToCart = () => {
    addToCart(item.id, quantity, selectedColor, selectedSize);
  };

  return (
    <div className="max-w-lg p-5">
      <div className="mb-5">
        <h5 className="text-xl font-semibold">Description</h5>
        <p className="text-base font-normal text-gray-500">
          {item.description}
        </p>
      </div>
      <div className="mb-5">
        <h5 className="text-xl font-semibold mb-2">Color</h5>
        <div className="flex space-x-2">
          {itemColors.length > 0 ? (
            itemColors.map((color, index) => (
              <div
                key={index}
                style={{ backgroundColor: color }}
                className={`w-8 h-8 rounded-full cursor-pointer ${selectedColor === color ? 'border-2 border-black' : 'border-2 border-transparent'}`}
                onClick={() => setSelectedColor(color)}
              ></div>
            ))
          ) : (
            <p>No Color Available</p>
          ) }
        </div>
      </div>
      <div className="mb-5">
        <p className="text-xl font-semibold mb-2">Size</p>
        <form className="max-w-sm">
          { itemSizes.length > 0 && (
            <select
              id="size"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded p-2 w-20"
              defaultValue=""
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              <option value="" disabled>
                Select size
              </option>
              {itemSizes.map((size, index) => (
                <option key={index} value={size}>
                  {size}
                </option>
              ))}
            </select>
          )}
        </form>
      </div>
      <div className="flex gap-5">
        <SetQuantity
          initialQuantity={quantity}
          onQuantityChange={setQuantity}
        />
        <button className="mb-5" onClick={handleAddToCart}>
          <h5 className="text-2xl bg-pink-900 text-white rounded-lg py-1 px-5">
            Add to cart
          </h5>
        </button>
      </div>
      <div className="mb-5">
        <p className="text-base font-normal text-slate-600">Price</p>
        <p className="text-xl font-semibold">S${item.new_price}</p>
      </div>
      <div className="text-base">
        {itemMaterials.length > 0 && (
          <p className="text-base font-semibold tracking-wide text-pink-800 leading-tight">
            Material:{" "}
            <span className="text-gray-500 text-sm font-normal tracking-widest ml-2">
              {itemMaterials.join(", ")}
            </span>
          </p>
        )}
        {itemSizes.length > 0 && (
          <p className="leading-tight text-base font-semibold tracking-wide text-pink-800">
            Sizes:{" "}
            <span className="text-gray-500 text-sm font-normal tracking-widest ml-2">
              {itemSizes.join(", ")}
            </span>
          </p>
        )}
        {itemColors.length > 0 && (
          <p className="leading-tight text-base font-semibold tracking-wide text-pink-800">
            Colors:{" "}
            <span className="text-gray-500 text-sm font-normal tracking-widest ml-2">
              {itemColors.join(", ")}
            </span>
          </p>
        )}
        {item.weight && (
          <p className="leading-tight text-base font-semibold tracking-wide text-pink-800">
            Weight:{" "}
            <span className="text-gray-500 text-sm font-normal tracking-widest ml-2">
              {item.weight}
            </span>
          </p>
        )}
        {item.printing_method ? (
          <p className="leading-tight text-base font-semibold tracking-wide text-pink-800">
            Printing Method:{" "}
            <span className="text-sm font-normal tracking-widest ml-2 text-gray-500">
              {item.printing_method}
            </span>
          </p>
        ) : (
          <p className="leading-tight text-base font-semibold tracking-wide text-pink-800">
            Printing Method:{" "}
            <span className="text-sm font-normal tracking-widest ml-2 text-gray-500">
              No printing method
            </span>
          </p>
        )}
        {item.printing_size && (
          <p className="leading-tight text-base font-semibold tracking-wide text-pink-800">
            Printing Size:{" "}
            <span className="text-sm font-normal tracking-widest ml-2 text-gray-500">
              {item.printing_size}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

