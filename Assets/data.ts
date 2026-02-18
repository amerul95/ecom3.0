import p1_img from './product_1.png'
import p2_img from './product_2.png'
import p3_img from './product_3.png'
import p4_img from './product_4.png'
import type { StaticImageData } from 'next/image';

export interface Product {
  id: number;
  name: string;
  image: string | StaticImageData;
  new_price: number;
  old_price: number;
  colors: string[];
  description: string;
  weight: string;
  materials: string[];
  sizes: string[];
  printing_method: string;
  printing_size: string;
}

const data_product: Product[] = [
  {
    id: 1,
    name: "Striped Flutter Sleeve Blouse - Red",
    image: p1_img,
    new_price: 50.00,
    old_price: 80.50,
    colors: ["Red", "Blue", "Green", "Black"],
    description: "A stylish striped blouse featuring flutter sleeves, an overlap collar, and a peplum hem. Perfect for both casual and formal occasions.",
    weight: "200g",
    materials: ["Cotton", "Polyester"],
    sizes: ["S", "M", "L", "XL"],
    printing_method: "Screen Printing",
    printing_size: "10x10 inches"
  },
  {
    id: 2,
    name: "Flutter Sleeve Blouse - Yellow",
    image: p2_img,
    new_price: 85.00,
    old_price: 120.50,
    colors: ["Yellow", "Pink", "White", "Gray"],
    description: "This blouse combines comfort and elegance with its flutter sleeves and peplum hem. The overlap collar adds a unique touch to your outfit.",
    weight: "210g",
    materials: ["Rayon", "Spandex"],
    sizes: ["S", "M", "L", "XL"],
    printing_method: "Digital Printing",
    printing_size: "8x8 inches"
  },
  {
    id: 3,
    name: "Overlap Collar Peplum Blouse - Purple",
    image: p3_img,
    new_price: 60.00,
    old_price: 100.50,
    colors: ["Purple", "Orange", "Teal", "Navy"],
    description: "A versatile blouse with stylish stripes, featuring flutter sleeves and a peplum hem. Ideal for enhancing your wardrobe with a chic piece.",
    weight: "190g",
    materials: ["Linen", "Cotton"],
    sizes: ["S", "M", "L", "XL"],
    printing_method: "Sublimation Printing",
    printing_size: "12x12 inches"
  },
  {
    id: 4,
    name: "Peplum Hem Blouse - Maroon",
    image: p4_img,
    new_price: 100.00,
    old_price: 150.00,
    colors: ["Maroon", "Olive", "Beige", "Aqua"],
    description: "Elevate your look with this striped blouse, designed with flutter sleeves, an overlap collar, and a peplum hem for a sophisticated appearance.",
    weight: "220g",
    materials: ["Silk", "Polyester"],
    sizes: ["S", "M", "L", "XL"],
    printing_method: "Heat Transfer Printing",
    printing_size: "9x9 inches"
  }
];

export default data_product;

