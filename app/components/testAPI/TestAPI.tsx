'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '../../shopContext/ShopContext';

export const TestAPI: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        fetch('http://localhost:3001/products')
            .then(response => response.json())
            .then(data => setProducts(data))
            .catch(error => console.error('Error fetching products:', error));
    }, []);

    return (
        <div>
            <h1>Products</h1>
            <ul>
                {products.map(product => (
                    <li className='border m-5 p-5' key={product.id}>
                        <h2>{product.name}</h2>
                        <p>Price: ${product.new_price}</p>
                        <p>Colors: {product.colors}</p>
                        <p>Materials: {product.materials}</p>
                        <p>Sizes: {product.sizes}</p>
                        <p>Description: {product.description}</p>
                        <p>Weight: {product.weight}</p>
                        <p>Printing Method: {product.printing_method}</p>
                        <p>Printing Size: {product.printing_size}</p>
                        <div>
                            {product.image_paths ? product.image_paths.split(', ').map((path, index) => (
                                <img key={index} src={`https://backend-run-79be31c2d90c.herokuapp.com/images/${product.category}/${path}`} alt={`Product ${index + product.id}`} />
                            )) : <p>No images available</p>}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

