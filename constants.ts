import { Product, Category, Transaction } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Pastel de Carne',
    price: 8.00,
    category: Category.FOOD,
    stock: 50,
    imageUrl: 'https://picsum.photos/200/200?random=1'
  },
  {
    id: '2',
    name: 'Pastel de Queijo',
    price: 8.00,
    category: Category.FOOD,
    stock: 45,
    imageUrl: 'https://picsum.photos/200/200?random=2'
  },
  {
    id: '3',
    name: 'Refrigerante Lata',
    price: 5.00,
    category: Category.DRINK,
    stock: 100,
    imageUrl: 'https://picsum.photos/200/200?random=3'
  },
  {
    id: '4',
    name: 'Água Mineral',
    price: 3.00,
    category: Category.DRINK,
    stock: 120,
    imageUrl: 'https://picsum.photos/200/200?random=4'
  },
  {
    id: '5',
    name: 'Camiseta do Acampamento',
    price: 35.00,
    category: Category.CLOTHING,
    stock: 20,
    imageUrl: 'https://picsum.photos/200/200?random=5'
  },
  {
    id: '6',
    name: 'Bíblia de Estudo',
    price: 85.00,
    category: Category.BOOKSTORE,
    stock: 5,
    imageUrl: 'https://picsum.photos/200/200?random=6'
  },
  {
    id: '7',
    name: 'Bolo de Pote',
    price: 10.00,
    category: Category.FOOD,
    stock: 30,
    imageUrl: 'https://picsum.photos/200/200?random=7'
  },
  {
    id: '8',
    name: 'Café Expresso',
    price: 4.00,
    category: Category.DRINK,
    stock: 200,
    imageUrl: 'https://picsum.photos/200/200?random=8'
  },
];

// Generate some past transactions for the dashboard
export const MOCK_TRANSACTIONS: Transaction[] = Array.from({ length: 15 }).map((_, i) => ({
  id: `tx-${i}`,
  date: new Date(Date.now() - i * 86400000 * 0.5).toISOString(), // Spread over last week
  items: [
    { ...MOCK_PRODUCTS[0], quantity: Math.floor(Math.random() * 3) + 1 },
    { ...MOCK_PRODUCTS[2], quantity: Math.floor(Math.random() * 2) + 1 },
  ],
  total: 0, // Calculated dynamically usually, but simplified here
  paymentMethod: (Math.random() > 0.5 ? 'Pix' : 'Dinheiro') as 'Pix' | 'Dinheiro',
})).map(t => ({
  ...t,
  total: t.items.reduce((acc, item) => acc + item.price * item.quantity, 0)
}));