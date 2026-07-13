import type { Product, OrderSummary, CartItemWithProduct } from './types';

export const DEMO_CATEGORIES = [
  { id: 'cat1', name: 'Kurtas' },
  { id: 'cat2', name: 'Sneakers' },
  { id: 'cat3', name: 'Sarees' },
  { id: 'cat4', name: 'Accessories' },
  { id: 'cat5', name: 'Jeans' },
  { id: 'cat6', name: 'Dresses' },
  { id: 'cat7', name: 'Trousers' },
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'p1', name: 'Floral Anarkali Kurta', price: 899, category_id: 'cat1', seller_id: 's1',
    description: 'A beautiful floral Anarkali kurta crafted from soft cotton fabric. Perfect for festive occasions and casual outings. Features intricate embroidery on the neckline and sleeves.',
    status: 'active', commission_rate: 10,
    reviews_aggregate: { avg: 4.5, count: 128 },
    product_variants: [
      { id: 'v1a', size: 'S', stock: 10, color: null, price_override: null },
      { id: 'v1b', size: 'M', stock: 8, color: null, price_override: null },
      { id: 'v1c', size: 'L', stock: 5, color: null, price_override: null },
      { id: 'v1d', size: 'XL', stock: 3, color: null, price_override: null },
    ],
  },
  {
    id: 'p2', name: 'White Canvas Sneakers', price: 1299, category_id: 'cat2', seller_id: 's1',
    description: 'Classic white canvas sneakers with a rubber sole and cushioned insole. Lightweight and breathable, ideal for daily wear or casual outings.',
    status: 'active', commission_rate: 10,
    reviews_aggregate: { avg: 4.2, count: 85 },
    product_variants: [
      { id: 'v2a', size: '6', stock: 4, color: null, price_override: null },
      { id: 'v2b', size: '7', stock: 6, color: null, price_override: null },
      { id: 'v2c', size: '8', stock: 9, color: null, price_override: null },
      { id: 'v2d', size: '9', stock: 7, color: null, price_override: null },
      { id: 'v2e', size: '10', stock: 2, color: null, price_override: null },
    ],
  },
  {
    id: 'p3', name: 'Banarasi Silk Saree', price: 3499, category_id: 'cat3', seller_id: 's1',
    description: 'Authentic Banarasi silk saree with traditional zari weaving. A timeless piece for weddings, pujas, and special occasions. Comes with a matching blouse piece.',
    status: 'active', commission_rate: 10,
    reviews_aggregate: { avg: 4.8, count: 210 },
    product_variants: [
      { id: 'v3a', size: 'Free Size', stock: 5, color: 'Red', price_override: null },
      { id: 'v3b', size: 'Free Size', stock: 4, color: 'Blue', price_override: null },
      { id: 'v3c', size: 'Free Size', stock: 3, color: 'Green', price_override: null },
    ],
  },
  {
    id: 'p4', name: 'Gold Hoop Earrings', price: 499, category_id: 'cat4', seller_id: 's1',
    description: 'Elegant gold-tone hoop earrings with a lightweight design. Hypoallergenic material, suitable for sensitive ears. Available in two sizes.',
    status: 'active', commission_rate: 10,
    reviews_aggregate: { avg: 4.3, count: 67 },
    product_variants: [
      { id: 'v4a', size: 'Small', stock: 15, color: 'Gold', price_override: null },
      { id: 'v4b', size: 'Large', stock: 10, color: 'Gold', price_override: null },
    ],
  },
  {
    id: 'p5', name: 'High-Rise Slim Jeans', price: 1599, category_id: 'cat5', seller_id: 's1',
    description: 'Premium denim high-rise slim fit jeans. Stretch fabric for all-day comfort. Five-pocket design with a classic button-fly. Machine washable.',
    status: 'active', commission_rate: 10,
    reviews_aggregate: { avg: 4.1, count: 95 },
    product_variants: [
      { id: 'v5a', size: '28', stock: 8, color: 'Blue', price_override: null },
      { id: 'v5b', size: '30', stock: 10, color: 'Blue', price_override: null },
      { id: 'v5c', size: '32', stock: 7, color: 'Blue', price_override: null },
      { id: 'v5d', size: '34', stock: 4, color: 'Blue', price_override: null },
    ],
  },
  {
    id: 'p6', name: 'Flowy Midi Dress', price: 1199, category_id: 'cat6', seller_id: 's1',
    description: 'A light and flowy midi dress perfect for summer. Made from 100% rayon fabric that keeps you cool. Features a tie-waist belt and floral print.',
    status: 'active', commission_rate: 10,
    reviews_aggregate: { avg: 4.6, count: 143 },
    product_variants: [
      { id: 'v6a', size: 'XS', stock: 5, color: 'Pink', price_override: null },
      { id: 'v6b', size: 'S', stock: 8, color: 'Pink', price_override: null },
      { id: 'v6c', size: 'M', stock: 6, color: 'Pink', price_override: null },
      { id: 'v6d', size: 'L', stock: 3, color: 'Pink', price_override: null },
    ],
  },
  {
    id: 'p7', name: 'Embroidered Kurti', price: 749, category_id: 'cat1', seller_id: 's1',
    description: 'Hand-embroidered casual kurti in soft rayon. Features mirror work and thread embroidery on yoke. Pairs well with leggings or palazzos.',
    status: 'active', commission_rate: 10,
    reviews_aggregate: { avg: 4.4, count: 78 },
    product_variants: [
      { id: 'v7a', size: 'S', stock: 12, color: null, price_override: null },
      { id: 'v7b', size: 'M', stock: 10, color: null, price_override: null },
      { id: 'v7c', size: 'L', stock: 8, color: null, price_override: null },
    ],
  },
  {
    id: 'p8', name: 'Sports Running Shoes', price: 2199, category_id: 'cat2', seller_id: 's1',
    description: 'Lightweight and breathable running shoes with advanced cushioning technology. Anti-slip rubber sole for better grip. Reflective accents for night visibility.',
    status: 'active', commission_rate: 10,
    reviews_aggregate: { avg: 4.5, count: 189 },
    product_variants: [
      { id: 'v8a', size: '7', stock: 6, color: 'Black', price_override: null },
      { id: 'v8b', size: '8', stock: 9, color: 'Black', price_override: null },
      { id: 'v8c', size: '9', stock: 7, color: 'Black', price_override: null },
      { id: 'v8d', size: '10', stock: 4, color: 'Black', price_override: null },
    ],
  },
  {
    id: 'p9', name: 'Formal Slim Trousers', price: 1099, category_id: 'cat7', seller_id: 's1',
    description: 'Tailored slim-fit formal trousers in premium polyester blend. Flat front, side pockets, and a classic hook-bar closure. Ideal for office and formal events.',
    status: 'active', commission_rate: 10,
    reviews_aggregate: { avg: 4.2, count: 54 },
    product_variants: [
      { id: 'v9a', size: '28', stock: 6, color: 'Black', price_override: null },
      { id: 'v9b', size: '30', stock: 8, color: 'Black', price_override: null },
      { id: 'v9c', size: '32', stock: 5, color: 'Navy', price_override: null },
      { id: 'v9d', size: '34', stock: 4, color: 'Navy', price_override: null },
    ],
  },
  {
    id: 'p10', name: 'Casual Chino Trousers', price: 899, category_id: 'cat7', seller_id: 's1',
    description: 'Comfortable casual chino trousers made from stretch cotton twill. Elastic waistband with drawstring. Great for everyday casual looks.',
    status: 'active', commission_rate: 10,
    reviews_aggregate: { avg: 4.0, count: 42 },
    product_variants: [
      { id: 'v10a', size: 'S', stock: 7, color: 'Beige', price_override: null },
      { id: 'v10b', size: 'M', stock: 9, color: 'Beige', price_override: null },
      { id: 'v10c', size: 'L', stock: 6, color: 'Olive', price_override: null },
      { id: 'v10d', size: 'XL', stock: 3, color: 'Olive', price_override: null },
    ],
  },
  {
    id: 'p11', name: 'Pleated Wide-Leg Trousers', price: 1349, category_id: 'cat7', seller_id: 's1',
    description: 'Trendy wide-leg pleated trousers in lightweight crepe fabric. High-waisted cut with a flattering silhouette. Perfect for a chic, fashion-forward look.',
    status: 'active', commission_rate: 10,
    reviews_aggregate: { avg: 4.7, count: 61 },
    product_variants: [
      { id: 'v11a', size: 'XS', stock: 4, color: 'White', price_override: null },
      { id: 'v11b', size: 'S', stock: 6, color: 'White', price_override: null },
      { id: 'v11c', size: 'M', stock: 5, color: 'Black', price_override: null },
    ],
  },
];

export const DEMO_ORDERS: OrderSummary[] = [
  {
    id: 'ord001-demo',
    placed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    total_amount: 2198,
    order_status: 'delivered',
  },
  {
    id: 'ord002-demo',
    placed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    total_amount: 3499,
    order_status: 'shipped',
  },
  {
    id: 'ord003-demo',
    placed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    total_amount: 1848,
    order_status: 'paid',
  },
];

export const DEMO_ORDER_ITEMS: Record<string, { productName: string; variantLabel: string; qty: number; price: number }[]> = {
  'ord001-demo': [
    { productName: 'Floral Anarkali Kurta', variantLabel: 'Size M', qty: 1, price: 899 },
    { productName: 'White Canvas Sneakers', variantLabel: 'Size 8', qty: 1, price: 1299 },
  ],
  'ord002-demo': [
    { productName: 'Banarasi Silk Saree', variantLabel: 'Free Size • Red', qty: 1, price: 3499 },
  ],
  'ord003-demo': [
    { productName: 'Formal Slim Trousers', variantLabel: 'Size 30 • Black', qty: 1, price: 1099 },
    { productName: 'Gold Hoop Earrings', variantLabel: 'Small • Gold', qty: 1, price: 499 },
    { productName: 'Embroidered Kurti', variantLabel: 'Size S', qty: 1, price: 749 },
  ],
};

export const DEMO_CART_ITEMS: CartItemWithProduct[] = [
  {
    id: 'ci1',
    quantity: 1,
    variant_id: 'v6b',
    product_variant: {
      id: 'v6b', size: 'S', stock: 8, color: 'Pink', price_override: null,
      product: DEMO_PRODUCTS[5],
    },
  },
  {
    id: 'ci2',
    quantity: 2,
    variant_id: 'v9b',
    product_variant: {
      id: 'v9b', size: '30', stock: 8, color: 'Black', price_override: null,
      product: DEMO_PRODUCTS[8],
    },
  },
];
