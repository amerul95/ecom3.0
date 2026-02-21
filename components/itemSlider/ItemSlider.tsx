'use client';

import React, { useState } from 'react';

interface ItemSliderProps {
  images: string[];
  category?: string;
}

const ItemSlider: React.FC<ItemSliderProps> = ({ images }) => {
  const firstImage = images.length > 0 ? images[0] : '';
  const [mainImage, setMainImage] = useState<string>(firstImage);

  return (
    <div className="flex flex-col p-5 max-w-md">
      <div className="w-full h-72 border-2 border-gray-300 mb-4">
        {mainImage && (
          <img
            src={mainImage}
            alt="Main"
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex justify-start gap-3">
        {images.length > 0 &&
          images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Thumbnail ${index + 1}`}
              onClick={() => setMainImage(image)}
              className={`h-14 w-14 object-cover border-2 border-transparent cursor-pointer transition-transform duration-300 ${
                mainImage === image ? 'transform scale-110 border-gray-300' : ''
              }`}
            />
          ))}
      </div>
    </div>
  );
};

export default ItemSlider;

