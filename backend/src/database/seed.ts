import { ProductInput } from '../models/Product';

export const sampleProducts: ProductInput[] = [
  {
    name: 'Safety helmet',
    reference: 'SEC-001',
    description: 'Adjustable white safety helmet.',
    category: 'Safety',
    quantity: 48,
    threshold: 10,
  },
  {
    name: 'Work gloves',
    reference: 'SEC-002',
    description: 'Reinforced work gloves, size M.',
    category: 'Safety',
    quantity: 8,
    threshold: 15,
  },
  {
    name: 'Cordless drill',
    reference: 'OUT-001',
    description: '18V drill with a battery and charger.',
    category: 'Tools',
    quantity: 12,
    threshold: 5,
  },
  {
    name: 'Packing tape',
    reference: 'CON-001',
    description: '50-metre roll of packing tape.',
    category: 'Supplies',
    quantity: 0,
    threshold: 20,
  },
  {
    name: 'Shipping box',
    reference: 'EMB-001',
    description: 'Double-wall cardboard box, 40 × 30 cm.',
    category: 'Packaging',
    quantity: 124,
    threshold: 30,
  },
  {
    name: 'Adjustable wrench',
    reference: 'OUT-002',
    description: '250mm adjustable steel wrench.',
    category: 'Tools',
    quantity: 6,
    threshold: 6,
  },
];
