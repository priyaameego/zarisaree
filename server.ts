import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import express, { type NextFunction, type Request, type Response } from 'express';

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';
const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'store.db');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(`zari-loom-${ROOT_DIR}`).digest('hex');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@zariandloom.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ZariAdmin!2026';

const FREE_SHIPPING_THRESHOLD = 4999;
const STANDARD_SHIPPING_FEE = 250;

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_featured INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    category_id TEXT NOT NULL,
    occasions_json TEXT NOT NULL DEFAULT '[]',
    fabric TEXT NOT NULL DEFAULT '',
    care_instructions TEXT NOT NULL DEFAULT '',
    price INTEGER NOT NULL,
    discount_percent INTEGER NOT NULL DEFAULT 0,
    sale_price INTEGER NOT NULL,
    sizes_json TEXT NOT NULL DEFAULT '[]',
    variants_json TEXT NOT NULL DEFAULT '[]',
    is_featured INTEGER NOT NULL DEFAULT 0,
    is_new_arrival INTEGER NOT NULL DEFAULT 0,
    is_best_seller INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    total_stock INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    phone TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS carts (
    owner_key TEXT PRIMARY KEY,
    items_json TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS wishlists (
    owner_key TEXT PRIMARY KEY,
    product_ids_json TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    items_json TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    discount_total INTEGER NOT NULL,
    shipping_fee INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    payment_reference TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    title TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );
`);

function hashPassword(password: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return `${actualSalt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(originalHash, 'hex'));
}

function signToken(payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken<T extends Record<string, unknown>>(token: string | undefined): T | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as T;
    if (typeof parsed.exp === 'number' && Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    result[key] = decodeURIComponent(val);
  }
  return result;
}

function ensureAdminUser() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL) as
    | { id: string }
    | undefined;
  const now = new Date().toISOString();
  if (!existing) {
    db.prepare(
      'INSERT INTO users (id, name, email, password_hash, role, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      'admin-primary',
      'Atelier Director',
      ADMIN_EMAIL,
      hashPassword(ADMIN_PASSWORD),
      'admin',
      '+91 98201 44120',
      now
    );
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function computeSalePrice(price: number, discountPercent: number): number {
  const clamped = Math.max(0, Math.min(80, Math.round(discountPercent)));
  return Math.round(price * (1 - clamped / 100));
}

function seedInitialData() {
  ensureAdminUser();

  const categoryCount = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number })
    .c;
  if (categoryCount === 0) {
    const categories = [
      {
        id: 'cat-sarees',
        name: 'Sarees',
        slug: 'sarees',
        description: 'Signature six-yard heirloom drapes woven across Varanasi, Kanchipuram, and Chanderi.',
        imageUrl: '/src/assets/images/saree_banarasi_crimson_1794850466729.jpg',
        displayOrder: 1,
        isFeatured: 1,
      },
      {
        id: 'cat-silk-sarees',
        name: 'Silk Sarees',
        slug: 'silk-sarees',
        description: 'Pure mulberry Katan and Kanjivaram silks finished with authentic zari borders.',
        imageUrl: '/src/assets/images/saree_kanjivaram_gold_1794850471469.jpg',
        displayOrder: 2,
        isFeatured: 1,
      },
      {
        id: 'cat-designer-sarees',
        name: 'Designer Sarees',
        slug: 'designer-sarees',
        description: 'Featherlight silk organza, hand-painted botanicals, and scalloped pearl finishes.',
        imageUrl: '/src/assets/images/saree_organza_blush_1794850469816.jpg',
        displayOrder: 3,
        isFeatured: 1,
      },
      {
        id: 'cat-suits',
        name: 'Suits',
        slug: 'suits',
        description: 'Tailored silk Anarkalis and tissue ensembles paired with woven Banarasi dupattas.',
        imageUrl: '/src/assets/images/cat_anarkali_suit_1794850472099.jpg',
        displayOrder: 4,
        isFeatured: 1,
      },
      {
        id: 'cat-lehengas',
        name: 'Lehengas',
        slug: 'lehengas',
        description: 'Bridal and reception lehengas hand-embroidered with zardozi and resham motifs.',
        imageUrl: '/src/assets/images/cat_bridal_lehenga_1794850471326.jpg',
        displayOrder: 5,
        isFeatured: 1,
      },
      {
        id: 'cat-kurtis',
        name: 'Kurtis',
        slug: 'kurtis',
        description: 'Refined Chanderi and cotton-silk kurti sets tailored for intimate celebrations and daily grace.',
        imageUrl: '/src/assets/images/cat_festive_kurti_1794850472253.jpg',
        displayOrder: 6,
        isFeatured: 1,
      },
    ];

    const insertCat = db.prepare(
      'INSERT INTO categories (id, name, slug, description, image_url, display_order, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const c of categories) {
      insertCat.run(c.id, c.name, c.slug, c.description, c.imageUrl, c.displayOrder, c.isFeatured);
    }
  }

  const productCount = (db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }).c;
  if (productCount === 0) {
    const now = new Date().toISOString();
    const seedProducts = [
      {
        id: 'prod-banarasi-katan',
        slug: 'banarasi-katan-floral-brocade-saree',
        name: 'Aanya Banarasi Katan Silk Saree',
        subtitle: 'Handwoven Kadwa Zari Floral Brocade',
        description:
          'Woven over 18 days on traditional pit looms in Varanasi, the Aanya Katan Silk Saree pairs luminous pure mulberry silk with antique gold kadwa zari floral jaal motifs. Finished with a rich heirloom pallu and matching unstitched blouse fabric.',
        categoryId: 'cat-silk-sarees',
        occasions: ['Wedding', 'Festive'],
        fabric: 'Katan Silk',
        careInstructions: 'Dry clean only. Store wrapped in unbleached muslin cloth away from direct sunlight.',
        price: 28500,
        discountPercent: 10,
        sizes: ['Free Size (5.5m + 0.9m Blouse)'],
        variants: [
          {
            id: 'var-banarasi-crimson',
            name: 'Royal Crimson',
            hex: '#8B1E24',
            images: [
              '/src/assets/images/saree_banarasi_crimson_1794850466729.jpg',
              '/src/assets/images/story_handloom_weaving_1794850472133.jpg',
            ],
            stock: 8,
            sku: 'ZL-BAN-CRM-01',
          },
          {
            id: 'var-banarasi-rose',
            name: 'Dusty Rose',
            hex: '#C47D88',
            images: [
              '/src/assets/images/saree_banarasi_rose_1794850467928.jpg',
              '/src/assets/images/story_handloom_weaving_1794850472133.jpg',
            ],
            stock: 6,
            sku: 'ZL-BAN-ROS-02',
          },
        ],
        isFeatured: 1,
        isNewArrival: 1,
        isBestSeller: 1,
      },
      {
        id: 'prod-kanjivaram-temple',
        slug: 'kanjivaram-pure-mulberry-temple-saree',
        name: 'Meenakshi Kanjivaram Silk Saree',
        subtitle: 'Korvai Temple Border & Pure Zari Pallu',
        description:
          'Crafted in Kanchipuram with three-ply mulberry silk yarn, the Meenakshi drape showcases a classic korvai temple border and lustrous gold-dipped zari pallu designed for muhurtham mornings and heirloom trousseaus.',
        categoryId: 'cat-sarees',
        occasions: ['Wedding', 'Festive'],
        fabric: 'Kanjivaram Pure Silk',
        careInstructions: 'Dry clean only. Refold along alternate creases every four months.',
        price: 36000,
        discountPercent: 0,
        sizes: ['Free Size (5.5m + 0.9m Blouse)'],
        variants: [
          {
            id: 'var-kanji-gold',
            name: 'Champagne Gold',
            hex: '#D4B87A',
            images: [
              '/src/assets/images/saree_kanjivaram_gold_1794850471469.jpg',
              '/src/assets/images/hero_kanjivaram_editorial_1794850468130.jpg',
            ],
            stock: 5,
            sku: 'ZL-KAN-GLD-01',
          },
          {
            id: 'var-kanji-emerald',
            name: 'Forest Emerald',
            hex: '#144D3A',
            images: [
              '/src/assets/images/saree_kanjivaram_emerald_1794850469871.jpg',
              '/src/assets/images/story_handloom_weaving_1794850472133.jpg',
            ],
            stock: 7,
            sku: 'ZL-KAN-EMR-02',
          },
        ],
        isFeatured: 1,
        isNewArrival: 0,
        isBestSeller: 1,
      },
      {
        id: 'prod-organza-botanical',
        slug: 'hand-painted-organza-scallop-saree',
        name: 'Noor Hand-Painted Organza Saree',
        subtitle: 'Artisan Botanicals & Scalloped Pearl Border',
        description:
          'Featherlight pure silk organza hand-painted by master miniature artists with soft botanical florals and bordered with delicate scalloped zari and seed-pearl edging. Ideal for daytime receptions and sunlit garden ceremonies.',
        categoryId: 'cat-designer-sarees',
        occasions: ['Party Wear', 'Festive', 'Wedding'],
        fabric: 'Silk Organza',
        careInstructions: 'Gentle dry clean only. Steam press on lowest silk setting with a pressing cloth.',
        price: 19500,
        discountPercent: 12,
        sizes: ['Free Size (5.5m + 0.9m Blouse)'],
        variants: [
          {
            id: 'var-organza-blush',
            name: 'Blush Pink',
            hex: '#E6B8BE',
            images: ['/src/assets/images/saree_organza_blush_1794850469816.jpg'],
            stock: 11,
            sku: 'ZL-ORG-BLS-01',
          },
          {
            id: 'var-organza-sage',
            name: 'Sage Ivory',
            hex: '#CBD2C5',
            images: ['/src/assets/images/saree_organza_sage_1794850470074.jpg'],
            stock: 9,
            sku: 'ZL-ORG-SAG-02',
          },
        ],
        isFeatured: 1,
        isNewArrival: 1,
        isBestSeller: 1,
      },
      {
        id: 'prod-chanderi-tissue',
        slug: 'chanderi-tissue-copper-zari-saree',
        name: 'Tara Chanderi Tissue Saree',
        subtitle: 'Luminous Sand Weave with Copper Zari',
        description:
          'Breathable handloom Chanderi tissue woven with a warm sand warp and subtle rose-copper zari weft. Effortlessly drapes from intimate daytime gatherings to evening dinners.',
        categoryId: 'cat-sarees',
        occasions: ['Everyday Wear', 'Festive', 'Party Wear'],
        fabric: 'Chanderi Tissue',
        careInstructions: 'Dry clean recommended for the first two washes; store flat.',
        price: 12800,
        discountPercent: 15,
        sizes: ['Free Size (5.5m + 0.85m Blouse)'],
        variants: [
          {
            id: 'var-chanderi-beige',
            name: 'Warm Sand',
            hex: '#CBB394',
            images: ['/src/assets/images/saree_chanderi_beige_1794850470161.jpg'],
            stock: 14,
            sku: 'ZL-CHN-SND-01',
          },
          {
            id: 'var-chanderi-ivory',
            name: 'Antique Ivory',
            hex: '#EDE5D5',
            images: ['/src/assets/images/saree_kanjivaram_gold_1794850471469.jpg'],
            stock: 10,
            sku: 'ZL-CHN-IVR-02',
          },
        ],
        isFeatured: 0,
        isNewArrival: 1,
        isBestSeller: 0,
      },
      {
        id: 'prod-bridal-lehenga',
        slug: 'gulbahar-zardozi-bridal-lehenga',
        name: 'Gulbahar Zardozi Bridal Lehenga',
        subtitle: 'Hand-Embroidered Silk Skirt, Choli & Organza Dupatta',
        description:
          'Crafted in muted rose raw silk and embroidered with antique gold dabka, resham florals, and scalloped architectural motifs. Includes a tailored blouse piece and trailing sheer organza veil dupatta.',
        categoryId: 'cat-lehengas',
        occasions: ['Wedding'],
        fabric: 'Raw Silk & Organza',
        careInstructions: 'Specialist couture dry clean only. Hang in breathable garment bag.',
        price: 68000,
        discountPercent: 8,
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        variants: [
          {
            id: 'var-lehenga-rose',
            name: 'Rosewood Pink',
            hex: '#D4A5AA',
            images: ['/src/assets/images/cat_bridal_lehenga_1794850471326.jpg'],
            stock: 4,
            sku: 'ZL-LEH-RSW-01',
          },
        ],
        isFeatured: 1,
        isNewArrival: 1,
        isBestSeller: 0,
      },
      {
        id: 'prod-ivory-anarkali',
        slug: 'zarina-silk-anarkali-suit-set',
        name: 'Zarina Ivory Silk Anarkali Set',
        subtitle: 'Floor-Length Kalidar Suit & Banarasi Dupatta',
        description:
          'A sixteen-kali ivory silk Anarkali adorned with tonal gold zari embroidery along the bodice and hem, paired with tailored silk churidar trousers and a handwoven Banarasi organza dupatta.',
        categoryId: 'cat-suits',
        occasions: ['Festive', 'Wedding', 'Party Wear'],
        fabric: 'Chanderi Silk',
        careInstructions: 'Dry clean only.',
        price: 22400,
        discountPercent: 10,
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        variants: [
          {
            id: 'var-anarkali-ivory',
            name: 'Alabaster Gold',
            hex: '#EFE9DC',
            images: ['/src/assets/images/cat_anarkali_suit_1794850472099.jpg'],
            stock: 9,
            sku: 'ZL-SUT-ALB-01',
          },
        ],
        isFeatured: 0,
        isNewArrival: 1,
        isBestSeller: 1,
      },
      {
        id: 'prod-rose-kurti-set',
        slug: 'mehr-embroidered-chanderi-kurti-set',
        name: 'Mehr Embroidered Chanderi Kurti Set',
        subtitle: '3-Piece Tailored Kurta, Palazzo & Organza Dupatta',
        description:
          'Effortless festive tailoring in rosewood Chanderi silk accented with delicate marodi and zari floral embroidery on the neckline and cuffs. Paired with wide-leg palazzo pants and a light matching dupatta.',
        categoryId: 'cat-kurtis',
        occasions: ['Everyday Wear', 'Festive', 'Party Wear'],
        fabric: 'Chanderi Silk',
        careInstructions: 'Dry clean or gentle cold hand wash inside out.',
        price: 9400,
        discountPercent: 15,
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        variants: [
          {
            id: 'var-kurti-rose',
            name: 'Muted Rose',
            hex: '#C47D88',
            images: ['/src/assets/images/cat_festive_kurti_1794850472253.jpg'],
            stock: 16,
            sku: 'ZL-KRT-ROS-01',
          },
        ],
        isFeatured: 0,
        isNewArrival: 0,
        isBestSeller: 1,
      },
      {
        id: 'prod-rose-banarasi-silk',
        slug: 'gulab-banarasi-silk-party-saree',
        name: 'Gulab Rose Banarasi Silk Saree',
        subtitle: 'Soft Mulberry Weave with Champagne Gold Border',
        description:
          'Spun in soft dusty rose mulberry silk with scattered champagne gold floral butis and an ornate geometric zari border. Lightweight enough for evening cocktail receptions yet regal for wedding festivities.',
        categoryId: 'cat-designer-sarees',
        occasions: ['Party Wear', 'Wedding', 'Festive'],
        fabric: 'Katan Silk',
        careInstructions: 'Dry clean only.',
        price: 24800,
        discountPercent: 10,
        sizes: ['Free Size (5.5m + 0.9m Blouse)'],
        variants: [
          {
            id: 'var-gulab-rose',
            name: 'Dusty Rose',
            hex: '#C47D88',
            images: ['/src/assets/images/saree_banarasi_rose_1794850467928.jpg'],
            stock: 7,
            sku: 'ZL-GUL-ROS-01',
          },
          {
            id: 'var-gulab-crimson',
            name: 'Royal Crimson',
            hex: '#8B1E24',
            images: ['/src/assets/images/saree_banarasi_crimson_1794850466729.jpg'],
            stock: 5,
            sku: 'ZL-GUL-CRM-02',
          },
        ],
        isFeatured: 1,
        isNewArrival: 0,
        isBestSeller: 1,
      },
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (
        id, slug, name, subtitle, description, category_id, occasions_json, fabric,
        care_instructions, price, discount_percent, sale_price, sizes_json, variants_json,
        is_featured, is_new_arrival, is_best_seller, is_active, total_stock, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of seedProducts) {
      const salePrice = computeSalePrice(p.price, p.discountPercent);
      const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
      insertProd.run(
        p.id,
        p.slug,
        p.name,
        p.subtitle,
        p.description,
        p.categoryId,
        JSON.stringify(p.occasions),
        p.fabric,
        p.careInstructions,
        p.price,
        p.discountPercent,
        salePrice,
        JSON.stringify(p.sizes),
        JSON.stringify(p.variants),
        p.isFeatured,
        p.isNewArrival,
        p.isBestSeller,
        1,
        totalStock,
        now,
        now
      );
    }
  }
}

seedInitialData();

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  category_id: string;
  occasions_json: string;
  fabric: string;
  care_instructions: string;
  price: number;
  discount_percent: number;
  sale_price: number;
  sizes_json: string;
  variants_json: string;
  is_featured: number;
  is_new_arrival: number;
  is_best_seller: number;
  is_active: number;
  total_stock: number;
  created_at: string;
  updated_at: string;
}

function hydrateProduct(row: ProductRow) {
  const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(row.category_id) as
    | { name: string }
    | undefined;
  const ratingRow = db
    .prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as cnt FROM reviews WHERE product_id = ?')
    .get(row.id) as { avg_rating: number | null; cnt: number };

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    categoryId: row.category_id,
    categoryName: cat?.name || 'Uncategorized',
    occasions: JSON.parse(row.occasions_json || '[]') as string[],
    fabric: row.fabric,
    careInstructions: row.care_instructions,
    price: row.price,
    discountPercent: row.discount_percent,
    salePrice: row.sale_price,
    sizes: JSON.parse(row.sizes_json || '[]') as string[],
    variants: JSON.parse(row.variants_json || '[]') as Array<{
      id: string;
      name: string;
      hex: string;
      images: string[];
      stock: number;
      sku: string;
    }>,
    isFeatured: Boolean(row.is_featured),
    isNewArrival: Boolean(row.is_new_arrival),
    isBestSeller: Boolean(row.is_best_seller),
    isActive: Boolean(row.is_active),
    totalStock: row.total_stock,
    ratingAverage: ratingRow.avg_rating ? Number(ratingRow.avg_rating.toFixed(1)) : 0,
    reviewCount: ratingRow.cnt || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface OrderRow {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: string;
  city: string;
  state: string;
  postal_code: string;
  notes: string;
  items_json: string;
  subtotal: number;
  discount_total: number;
  shipping_fee: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  payment_reference: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function hydrateOrder(row: OrderRow) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    shippingAddress: row.shipping_address,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    notes: row.notes,
    items: JSON.parse(row.items_json || '[]'),
    subtotal: row.subtotal,
    discountTotal: row.discount_total,
    shippingFee: row.shipping_fee,
    totalAmount: row.total_amount,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    paymentReference: row.payment_reference,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getSessionUser(req: Request): { id: string; name: string; email: string; role: 'customer' | 'admin' } | null {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.zl_auth;
  const parsed = verifyToken<{ id: string; name: string; email: string; role: 'customer' | 'admin'; exp: number }>(
    token
  );
  if (!parsed) return null;
  return { id: parsed.id, name: parsed.name, email: parsed.email, role: parsed.role };
}

function getOrSetVisitorKey(req: Request, res: Response): string {
  const user = getSessionUser(req);
  if (user) return `user:${user.id}`;

  const cookies = parseCookies(req.headers.cookie);
  let sid = cookies.zl_sid;
  if (!sid || !/^[a-zA-Z0-9_-]{8,64}$/.test(sid)) {
    sid = crypto.randomUUID();
    res.cookie('zl_sid', sid, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
  return `guest:${sid}`;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  next();
}

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, database: 'sqlite' });
});

// Payment config endpoint (never exposes secrets)
app.get('/api/payment-config', (_req, res) => {
  const provider = (process.env.PAYMENT_GATEWAY_PROVIDER || '').trim().toLowerCase();
  const hasKeys = Boolean(process.env.PAYMENT_GATEWAY_KEY_ID && process.env.PAYMENT_GATEWAY_KEY_SECRET);
  res.json({
    provider: provider || 'builtin',
    onlineEnabled: true,
    mode: provider && hasKeys ? 'live' : 'configurable_test',
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    standardShippingFee: STANDARD_SHIPPING_FEE,
  });
});

// Auth endpoints
app.get('/api/auth/me', (req, res) => {
  const user = getSessionUser(req);
  res.json({ user });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const requireAdminRole = Boolean(req.body?.adminOnly);

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const row = db
    .prepare('SELECT id, name, email, password_hash, role FROM users WHERE email = ?')
    .get(email) as
    | { id: string; name: string; email: string; password_hash: string; role: 'customer' | 'admin' }
    | undefined;

  if (!row || !verifyPassword(password, row.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (requireAdminRole && row.role !== 'admin') {
    res.status(403).json({ error: 'This account does not have administrator access.' });
    return;
  }

  const token = signToken({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie('zl_auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    user: { id: row.id, name: row.name, email: row.email, role: row.role },
  });
});

app.post('/api/auth/register', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const phone = String(req.body?.phone || '').trim();

  if (!name || !email || password.length < 6) {
    res.status(400).json({ error: 'Name, valid email, and password (min 6 characters) are required.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const id = `usr-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, role, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, email, hashPassword(password), 'customer', phone, now);

  const token = signToken({
    id,
    name,
    email,
    role: 'customer',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie('zl_auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({ user: { id, name, email, role: 'customer' } });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('zl_auth');
  res.json({ ok: true });
});

// Upload endpoint (admin only)
app.post('/api/upload', requireAdmin, (req, res) => {
  const dataUrl = String(req.body?.dataUrl || '');
  const filename = String(req.body?.filename || 'image.jpg');

  const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) {
    res.status(400).json({ error: 'Please upload a valid JPG, PNG, or WebP image.' });
    return;
  }

  const mime = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 5 * 1024 * 1024) {
    res.status(400).json({ error: 'Image size must be under 5MB.' });
    return;
  }

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const safeBase = slugify(path.parse(filename).name).slice(0, 32) || 'product';
  const outName = `${safeBase}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, outName), buffer);

  res.status(201).json({ url: `/uploads/${outName}` });
});

// Categories
app.get('/api/categories', (_req, res) => {
  const rows = db
    .prepare(
      'SELECT id, name, slug, description, image_url, display_order, is_featured FROM categories ORDER BY display_order ASC, name ASC'
    )
    .all() as Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    image_url: string;
    display_order: number;
    is_featured: number;
  }>;

  res.json({
    categories: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      imageUrl: r.image_url,
      displayOrder: r.display_order,
      isFeatured: Boolean(r.is_featured),
    })),
  });
});

app.post('/api/categories', requireAdmin, (req, res) => {
  const name = String(req.body?.name || '').trim();
  const description = String(req.body?.description || '').trim();
  const imageUrl = String(req.body?.imageUrl || '').trim();
  const displayOrder = Number(req.body?.displayOrder || 10);
  const isFeatured = req.body?.isFeatured !== false ? 1 : 0;

  if (!name) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }

  const id = `cat-${slugify(name)}-${crypto.randomBytes(2).toString('hex')}`;
  const slug = slugify(name);

  try {
    db.prepare(
      'INSERT INTO categories (id, name, slug, description, image_url, display_order, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, name, slug, description, imageUrl, displayOrder, isFeatured);

    res.status(201).json({
      category: {
        id,
        name,
        slug,
        description,
        imageUrl,
        displayOrder,
        isFeatured: Boolean(isFeatured),
      },
    });
  } catch {
    res.status(409).json({ error: 'A category with that name already exists.' });
  }
});

app.put('/api/categories/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  const name = String(req.body?.name || '').trim();
  const description = String(req.body?.description || '').trim();
  const imageUrl = String(req.body?.imageUrl || '').trim();
  const displayOrder = Number(req.body?.displayOrder ?? 10);
  const isFeatured = req.body?.isFeatured !== false ? 1 : 0;

  if (!name) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }

  db.prepare(
    'UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ?, display_order = ?, is_featured = ? WHERE id = ?'
  ).run(name, slugify(name), description, imageUrl, displayOrder, isFeatured, id);

  res.json({
    category: {
      id,
      name,
      slug: slugify(name),
      description,
      imageUrl,
      displayOrder,
      isFeatured: Boolean(isFeatured),
    },
  });
});

app.delete('/api/categories/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const count = (db.prepare('SELECT COUNT(*) as c FROM products WHERE category_id = ?').get(id) as { c: number }).c;
  if (count > 0) {
    res.status(400).json({ error: 'Cannot delete a category that still has products assigned.' });
    return;
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ ok: true });
});

// Products listing & filtering
app.get('/api/products', (req, res) => {
  const includeInactive = req.query.includeInactive === 'true' && getSessionUser(req)?.role === 'admin';
  const category = String(req.query.category || '').trim().toLowerCase();
  const occasion = String(req.query.occasion || '').trim().toLowerCase();
  const fabric = String(req.query.fabric || '').trim().toLowerCase();
  const color = String(req.query.color || '').trim().toLowerCase();
  const search = String(req.query.search || '').trim().toLowerCase();
  const availability = String(req.query.availability || '').trim();
  const minPrice = Number(req.query.minPrice || 0);
  const maxPrice = Number(req.query.maxPrice || 0);
  const sort = String(req.query.sort || 'latest');
  const flag = String(req.query.flag || '');

  const rows = db
    .prepare(includeInactive ? 'SELECT * FROM products' : 'SELECT * FROM products WHERE is_active = 1')
    .all() as unknown as ProductRow[];

  let items = rows.map(hydrateProduct);

  if (category && category !== 'all') {
    items = items.filter(
      (p) => p.categoryId === category || p.categoryName.toLowerCase() === category || slugify(p.categoryName) === category
    );
  }
  if (occasion && occasion !== 'all') {
    items = items.filter((p) => p.occasions.some((o) => o.toLowerCase() === occasion || slugify(o) === occasion));
  }
  if (fabric && fabric !== 'all') {
    items = items.filter((p) => p.fabric.toLowerCase().includes(fabric));
  }
  if (color && color !== 'all') {
    items = items.filter((p) => p.variants.some((v) => v.name.toLowerCase().includes(color)));
  }
  if (availability === 'in_stock') {
    items = items.filter((p) => p.totalStock > 0);
  } else if (availability === 'out_of_stock') {
    items = items.filter((p) => p.totalStock === 0);
  }
  if (minPrice > 0) {
    items = items.filter((p) => p.salePrice >= minPrice);
  }
  if (maxPrice > 0) {
    items = items.filter((p) => p.salePrice <= maxPrice);
  }
  if (flag === 'featured') items = items.filter((p) => p.isFeatured);
  if (flag === 'new') items = items.filter((p) => p.isNewArrival);
  if (flag === 'bestseller') items = items.filter((p) => p.isBestSeller);

  if (search) {
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.subtitle.toLowerCase().includes(search) ||
        p.categoryName.toLowerCase().includes(search) ||
        p.fabric.toLowerCase().includes(search) ||
        p.variants.some((v) => v.name.toLowerCase().includes(search))
    );
  }

  if (sort === 'price_asc') {
    items.sort((a, b) => a.salePrice - b.salePrice);
  } else if (sort === 'price_desc') {
    items.sort((a, b) => b.salePrice - a.salePrice);
  } else if (sort === 'popular') {
    items.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || b.reviewCount - a.reviewCount);
  } else {
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  res.json({ products: items, total: items.length });
});

app.get('/api/products/:idOrSlug', (req, res) => {
  const { idOrSlug } = req.params;
  const row = db
    .prepare('SELECT * FROM products WHERE id = ? OR slug = ?')
    .get(idOrSlug, idOrSlug) as unknown as ProductRow | undefined;

  if (!row) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const product = hydrateProduct(row);
  const relatedRows = db
    .prepare('SELECT * FROM products WHERE is_active = 1 AND id != ? LIMIT 8')
    .all(product.id) as unknown as ProductRow[];
  const related = relatedRows
    .map(hydrateProduct)
    .sort((a, b) => Number(b.categoryId === product.categoryId) - Number(a.categoryId === product.categoryId))
    .slice(0, 4);

  res.json({ product, related });
});

app.post('/api/products', requireAdmin, (req, res) => {
  const name = String(req.body?.name || '').trim();
  const subtitle = String(req.body?.subtitle || '').trim();
  const description = String(req.body?.description || '').trim();
  const categoryId = String(req.body?.categoryId || '').trim();
  const occasions = Array.isArray(req.body?.occasions) ? req.body.occasions.map(String) : [];
  const fabric = String(req.body?.fabric || '').trim();
  const careInstructions = String(req.body?.careInstructions || 'Dry clean only.').trim();
  const price = Math.max(100, Math.round(Number(req.body?.price || 0)));
  const discountPercent = Math.max(0, Math.min(80, Math.round(Number(req.body?.discountPercent || 0))));
  const sizes = Array.isArray(req.body?.sizes) && req.body.sizes.length > 0
    ? req.body.sizes.map(String)
    : ['Free Size (5.5m + 0.9m Blouse)'];
  const variants = Array.isArray(req.body?.variants) ? req.body.variants : [];
  const isFeatured = req.body?.isFeatured ? 1 : 0;
  const isNewArrival = req.body?.isNewArrival ? 1 : 0;
  const isBestSeller = req.body?.isBestSeller ? 1 : 0;
  const isActive = req.body?.isActive !== false ? 1 : 0;

  if (!name || !categoryId || !variants.length) {
    res.status(400).json({ error: 'Product name, category, and at least one color variation are required.' });
    return;
  }

  const normalizedVariants = variants.map(
    (v: { id?: string; name?: string; hex?: string; images?: string[]; stock?: number; sku?: string }, idx: number) => ({
      id: v.id || `var-${crypto.randomBytes(4).toString('hex')}`,
      name: String(v.name || `Shade ${idx + 1}`).trim(),
      hex: String(v.hex || '#9A7B4F').trim(),
      images: Array.isArray(v.images) ? v.images.filter(Boolean).map(String) : [],
      stock: Math.max(0, Math.round(Number(v.stock || 0))),
      sku: String(v.sku || `ZL-${crypto.randomBytes(3).toString('hex').toUpperCase()}`).trim(),
    })
  );

  if (normalizedVariants.some((v: { images: string[] }) => v.images.length === 0)) {
    res.status(400).json({ error: 'Each color variation must have at least one image.' });
    return;
  }

  const id = `prod-${crypto.randomBytes(5).toString('hex')}`;
  const slug = `${slugify(name)}-${crypto.randomBytes(2).toString('hex')}`;
  const salePrice = computeSalePrice(price, discountPercent);
  const totalStock = normalizedVariants.reduce((sum: number, v: { stock: number }) => sum + v.stock, 0);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO products (
      id, slug, name, subtitle, description, category_id, occasions_json, fabric,
      care_instructions, price, discount_percent, sale_price, sizes_json, variants_json,
      is_featured, is_new_arrival, is_best_seller, is_active, total_stock, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    slug,
    name,
    subtitle,
    description,
    categoryId,
    JSON.stringify(occasions),
    fabric,
    careInstructions,
    price,
    discountPercent,
    salePrice,
    JSON.stringify(sizes),
    JSON.stringify(normalizedVariants),
    isFeatured,
    isNewArrival,
    isBestSeller,
    isActive,
    totalStock,
    now,
    now
  );

  const created = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as unknown as ProductRow;
  res.status(201).json({ product: hydrateProduct(created) });
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as unknown as ProductRow | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const name = String(req.body?.name ?? existing.name).trim();
  const subtitle = String(req.body?.subtitle ?? existing.subtitle).trim();
  const description = String(req.body?.description ?? existing.description).trim();
  const categoryId = String(req.body?.categoryId ?? existing.category_id).trim();
  const occasions = Array.isArray(req.body?.occasions)
    ? req.body.occasions.map(String)
    : JSON.parse(existing.occasions_json);
  const fabric = String(req.body?.fabric ?? existing.fabric).trim();
  const careInstructions = String(req.body?.careInstructions ?? existing.care_instructions).trim();
  const price = Math.max(100, Math.round(Number(req.body?.price ?? existing.price)));
  const discountPercent = Math.max(0, Math.min(80, Math.round(Number(req.body?.discountPercent ?? existing.discount_percent))));
  const sizes = Array.isArray(req.body?.sizes) && req.body.sizes.length > 0
    ? req.body.sizes.map(String)
    : JSON.parse(existing.sizes_json);
  const rawVariants = Array.isArray(req.body?.variants)
    ? req.body.variants
    : JSON.parse(existing.variants_json);

  const normalizedVariants = rawVariants.map(
    (v: { id?: string; name?: string; hex?: string; images?: string[]; stock?: number; sku?: string }, idx: number) => ({
      id: v.id || `var-${crypto.randomBytes(4).toString('hex')}`,
      name: String(v.name || `Shade ${idx + 1}`).trim(),
      hex: String(v.hex || '#9A7B4F').trim(),
      images: Array.isArray(v.images) ? v.images.filter(Boolean).map(String) : [],
      stock: Math.max(0, Math.round(Number(v.stock || 0))),
      sku: String(v.sku || `ZL-${crypto.randomBytes(3).toString('hex').toUpperCase()}`).trim(),
    })
  );

  if (!name || !categoryId || normalizedVariants.length === 0) {
    res.status(400).json({ error: 'Product name, category, and at least one color variation are required.' });
    return;
  }
  if (normalizedVariants.some((v: { images: string[] }) => v.images.length === 0)) {
    res.status(400).json({ error: 'Each color variation must have at least one image.' });
    return;
  }

  const isFeatured = req.body?.isFeatured !== undefined ? (req.body.isFeatured ? 1 : 0) : existing.is_featured;
  const isNewArrival = req.body?.isNewArrival !== undefined ? (req.body.isNewArrival ? 1 : 0) : existing.is_new_arrival;
  const isBestSeller = req.body?.isBestSeller !== undefined ? (req.body.isBestSeller ? 1 : 0) : existing.is_best_seller;
  const isActive = req.body?.isActive !== undefined ? (req.body.isActive ? 1 : 0) : existing.is_active;

  const salePrice = computeSalePrice(price, discountPercent);
  const totalStock = normalizedVariants.reduce((sum: number, v: { stock: number }) => sum + v.stock, 0);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE products SET
      name = ?, subtitle = ?, description = ?, category_id = ?, occasions_json = ?,
      fabric = ?, care_instructions = ?, price = ?, discount_percent = ?, sale_price = ?,
      sizes_json = ?, variants_json = ?, is_featured = ?, is_new_arrival = ?,
      is_best_seller = ?, is_active = ?, total_stock = ?, updated_at = ?
    WHERE id = ?
  `).run(
    name,
    subtitle,
    description,
    categoryId,
    JSON.stringify(occasions),
    fabric,
    careInstructions,
    price,
    discountPercent,
    salePrice,
    JSON.stringify(sizes),
    JSON.stringify(normalizedVariants),
    isFeatured,
    isNewArrival,
    isBestSeller,
    isActive,
    totalStock,
    now,
    id
  );

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as unknown as ProductRow;
  res.json({ product: hydrateProduct(updated) });
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Cart persistence
app.get('/api/cart', (req, res) => {
  const ownerKey = getOrSetVisitorKey(req, res);
  const row = db.prepare('SELECT items_json FROM carts WHERE owner_key = ?').get(ownerKey) as
    | { items_json: string }
    | undefined;
  res.json({ items: row ? JSON.parse(row.items_json) : [] });
});

app.put('/api/cart', (req, res) => {
  const ownerKey = getOrSetVisitorKey(req, res);
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO carts (owner_key, items_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(owner_key) DO UPDATE SET items_json = excluded.items_json, updated_at = excluded.updated_at'
  ).run(ownerKey, JSON.stringify(items), now);
  res.json({ items });
});

// Wishlist persistence
app.get('/api/wishlist', (req, res) => {
  const ownerKey = getOrSetVisitorKey(req, res);
  const row = db.prepare('SELECT product_ids_json FROM wishlists WHERE owner_key = ?').get(ownerKey) as
    | { product_ids_json: string }
    | undefined;
  res.json({ productIds: row ? JSON.parse(row.product_ids_json) : [] });
});

app.post('/api/wishlist/toggle', (req, res) => {
  const ownerKey = getOrSetVisitorKey(req, res);
  const productId = String(req.body?.productId || '').trim();
  if (!productId) {
    res.status(400).json({ error: 'productId is required.' });
    return;
  }

  const row = db.prepare('SELECT product_ids_json FROM wishlists WHERE owner_key = ?').get(ownerKey) as
    | { product_ids_json: string }
    | undefined;
  const list: string[] = row ? JSON.parse(row.product_ids_json) : [];
  const exists = list.includes(productId);
  const next = exists ? list.filter((id) => id !== productId) : [...list, productId];
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO wishlists (owner_key, product_ids_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(owner_key) DO UPDATE SET product_ids_json = excluded.product_ids_json, updated_at = excluded.updated_at'
  ).run(ownerKey, JSON.stringify(next), now);

  res.json({ productIds: next, wishlisted: !exists });
});

// Orders & Transactional Checkout
app.post('/api/orders', (req, res) => {
  const customerName = String(req.body?.customerName || '').trim();
  const customerPhone = String(req.body?.customerPhone || '').trim();
  const customerEmail = String(req.body?.customerEmail || '').trim().toLowerCase();
  const shippingAddress = String(req.body?.shippingAddress || '').trim();
  const city = String(req.body?.city || '').trim();
  const state = String(req.body?.state || '').trim();
  const postalCode = String(req.body?.postalCode || '').trim();
  const notes = String(req.body?.notes || '').trim();
  const paymentMethod = req.body?.paymentMethod === 'online' ? 'online' : 'cod';
  const paymentReference = String(req.body?.paymentReference || '').trim();
  const requestedItems = Array.isArray(req.body?.items) ? req.body.items : [];

  if (
    !customerName ||
    customerPhone.length < 7 ||
    !customerEmail.includes('@') ||
    !shippingAddress ||
    !city ||
    !state ||
    !postalCode
  ) {
    res.status(400).json({ error: 'Please complete all required shipping and contact details.' });
    return;
  }

  if (requestedItems.length === 0) {
    res.status(400).json({ error: 'Your shopping bag is empty.' });
    return;
  }

  const user = getSessionUser(req);
  const ownerKey = getOrSetVisitorKey(req, res);

  try {
    db.exec('BEGIN IMMEDIATE;');

    let subtotal = 0;
    let discountTotal = 0;
    const verifiedItems: Array<{
      productId: string;
      productName: string;
      variantId: string;
      colorName: string;
      size: string;
      imageUrl: string;
      unitPrice: number;
      unitSalePrice: number;
      quantity: number;
      lineTotal: number;
    }> = [];

    for (const reqItem of requestedItems) {
      const productId = String(reqItem.productId || '');
      const variantId = String(reqItem.variantId || '');
      const size = String(reqItem.size || 'Free Size');
      const quantity = Math.max(1, Math.round(Number(reqItem.quantity || 1)));

      const row = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(productId) as
        | ProductRow
        | undefined;
      if (!row) {
        throw new Error('One or more items in your bag are no longer available.');
      }

      const variants = JSON.parse(row.variants_json) as Array<{
        id: string;
        name: string;
        hex: string;
        images: string[];
        stock: number;
        sku: string;
      }>;
      const variantIdx = variants.findIndex((v) => v.id === variantId);
      if (variantIdx === -1) {
        throw new Error(`Selected color variation for ${row.name} is unavailable.`);
      }

      const variant = variants[variantIdx];
      if (variant.stock < quantity) {
        throw new Error(
          variant.stock === 0
            ? `${row.name} (${variant.name}) is currently out of stock.`
            : `Only ${variant.stock} unit(s) available for ${row.name} (${variant.name}).`
        );
      }

      variant.stock -= quantity;
      variants[variantIdx] = variant;
      const newTotalStock = variants.reduce((sum, v) => sum + v.stock, 0);

      db.prepare('UPDATE products SET variants_json = ?, total_stock = ?, updated_at = ? WHERE id = ?').run(
        JSON.stringify(variants),
        newTotalStock,
        new Date().toISOString(),
        row.id
      );

      const lineMrp = row.price * quantity;
      const lineTotal = row.sale_price * quantity;
      subtotal += lineMrp;
      discountTotal += lineMrp - lineTotal;

      verifiedItems.push({
        productId: row.id,
        productName: row.name,
        variantId: variant.id,
        colorName: variant.name,
        size,
        imageUrl: variant.images[0] || '',
        unitPrice: row.price,
        unitSalePrice: row.sale_price,
        quantity,
        lineTotal,
      });
    }

    const netMerchandise = subtotal - discountTotal;
    const shippingFee = netMerchandise >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
    const totalAmount = netMerchandise + shippingFee;

    const orderCount = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }).c;
    const orderNumber = `ZL-2026-${1001 + orderCount}`;
    const orderId = `ord-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const paymentStatus = paymentMethod === 'online' ? 'Paid' : 'Pending';
    const finalPaymentRef =
      paymentMethod === 'online'
        ? paymentReference || `PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
        : 'CASH_ON_DELIVERY';

    db.prepare(`
      INSERT INTO orders (
        id, order_number, customer_id, customer_name, customer_phone, customer_email,
        shipping_address, city, state, postal_code, notes, items_json, subtotal,
        discount_total, shipping_fee, total_amount, payment_method, payment_status,
        payment_reference, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      orderNumber,
      user?.id || null,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      city,
      state,
      postalCode,
      notes,
      JSON.stringify(verifiedItems),
      subtotal,
      discountTotal,
      shippingFee,
      totalAmount,
      paymentMethod,
      paymentStatus,
      finalPaymentRef,
      'Pending',
      now,
      now
    );

    // Clear persisted cart after successful checkout
    db.prepare(
      'INSERT INTO carts (owner_key, items_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(owner_key) DO UPDATE SET items_json = excluded.items_json, updated_at = excluded.updated_at'
    ).run(ownerKey, '[]', now);

    db.exec('COMMIT;');

    const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as unknown as OrderRow;
    res.status(201).json({ order: hydrateOrder(created) });
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // ignore rollback error
    }
    const message = err instanceof Error ? err.message : 'Unable to place order.';
    res.status(400).json({ error: message });
  }
});

app.get('/api/orders/my', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  const rows = db
    .prepare('SELECT * FROM orders WHERE customer_id = ? OR customer_email = ? ORDER BY created_at DESC')
    .all(user.id, user.email) as unknown as OrderRow[];
  res.json({ orders: rows.map(hydrateOrder) });
});

app.get('/api/orders/:orderNumber', (req, res) => {
  const row = db
    .prepare('SELECT * FROM orders WHERE order_number = ? OR id = ?')
    .get(req.params.orderNumber, req.params.orderNumber) as unknown as OrderRow | undefined;

  if (!row) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }
  res.json({ order: hydrateOrder(row) });
});

// Reviews
app.get('/api/reviews', (req, res) => {
  const productId = String(req.query.productId || '').trim();
  const rows = productId
    ? (db
        .prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC')
        .all(productId) as Array<{
        id: string;
        product_id: string;
        author_name: string;
        rating: number;
        title: string;
        comment: string;
        created_at: string;
      }>)
    : (db.prepare('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 24').all() as Array<{
        id: string;
        product_id: string;
        author_name: string;
        rating: number;
        title: string;
        comment: string;
        created_at: string;
      }>);

  const reviews = rows.map((r) => {
    const prod = db.prepare('SELECT name FROM products WHERE id = ?').get(r.product_id) as
      | { name: string }
      | undefined;
    return {
      id: r.id,
      productId: r.product_id,
      productName: prod?.name || 'Atelier Piece',
      authorName: r.author_name,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      createdAt: r.created_at,
    };
  });

  res.json({ reviews });
});

app.post('/api/reviews', (req, res) => {
  const productId = String(req.body?.productId || '').trim();
  const authorName = String(req.body?.authorName || '').trim();
  const rating = Math.max(1, Math.min(5, Math.round(Number(req.body?.rating || 5))));
  const title = String(req.body?.title || '').trim();
  const comment = String(req.body?.comment || '').trim();

  if (!productId || !authorName || !title || !comment) {
    res.status(400).json({ error: 'Please complete your name, review headline, and feedback.' });
    return;
  }

  const prod = db.prepare('SELECT id, name FROM products WHERE id = ?').get(productId) as
    | { id: string; name: string }
    | undefined;
  if (!prod) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const id = `rev-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO reviews (id, product_id, author_name, rating, title, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, productId, authorName, rating, title, comment, now);

  res.status(201).json({
    review: {
      id,
      productId,
      productName: prod.name,
      authorName,
      rating,
      title,
      comment,
      createdAt: now,
    },
  });
});

// Newsletter
app.post('/api/newsletter', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  try {
    db.prepare('INSERT INTO newsletter_subscribers (id, email, created_at) VALUES (?, ?, ?)').run(
      `sub-${crypto.randomUUID()}`,
      email,
      new Date().toISOString()
    );
    res.status(201).json({ message: 'Thank you for joining the Zari & Loom private list.' });
  } catch {
    res.json({ message: 'You are already subscribed to our private releases.' });
  }
});

// Admin Endpoints
app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const orders = db.prepare('SELECT * FROM orders').all() as unknown as OrderRow[];
  const products = db.prepare('SELECT * FROM products').all() as unknown as ProductRow[];

  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total_amount, 0);
  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
  const lowStockProducts = products.filter((p) => p.total_stock <= 5).length;

  const uniqueCustomers = new Set(orders.map((o) => o.customer_email.toLowerCase()));

  res.json({
    overview: {
      totalOrders: orders.length,
      totalRevenue,
      totalProducts: products.length,
      pendingOrders,
      lowStockProducts,
      totalCustomers: uniqueCustomers.size,
    },
  });
});

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const status = String(req.query.status || '').trim();
  const search = String(req.query.search || '').trim().toLowerCase();

  let rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as unknown as OrderRow[];
  if (status && status !== 'All') {
    rows = rows.filter((r) => r.status === status);
  }
  if (search) {
    rows = rows.filter(
      (r) =>
        r.order_number.toLowerCase().includes(search) ||
        r.customer_name.toLowerCase().includes(search) ||
        r.customer_email.toLowerCase().includes(search) ||
        r.customer_phone.toLowerCase().includes(search)
    );
  }
  res.json({ orders: rows.map(hydrateOrder) });
});

app.patch('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const allowedStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const nextStatus = String(req.body?.status || '');
  if (!allowedStatuses.includes(nextStatus)) {
    res.status(400).json({ error: 'Invalid order status.' });
    return;
  }

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as
    | OrderRow
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const now = new Date().toISOString();

  try {
    db.exec('BEGIN IMMEDIATE;');

    // Restore stock if cancelling a non-cancelled order
    if (nextStatus === 'Cancelled' && existing.status !== 'Cancelled') {
      const items = JSON.parse(existing.items_json) as Array<{
        productId: string;
        variantId: string;
        quantity: number;
      }>;
      for (const item of items) {
        const prod = db.prepare('SELECT variants_json FROM products WHERE id = ?').get(item.productId) as
          | { variants_json: string }
          | undefined;
        if (!prod) continue;
        const variants = JSON.parse(prod.variants_json) as Array<{ id: string; stock: number }>;
        const idx = variants.findIndex((v) => v.id === item.variantId);
        if (idx !== -1) {
          variants[idx].stock += item.quantity;
          const totalStock = variants.reduce((s, v) => s + v.stock, 0);
          db.prepare('UPDATE products SET variants_json = ?, total_stock = ?, updated_at = ? WHERE id = ?').run(
            JSON.stringify(variants),
            totalStock,
            now,
            item.productId
          );
        }
      }
    }

    const nextPaymentStatus =
      nextStatus === 'Delivered' && existing.payment_method === 'cod'
        ? 'Paid'
        : nextStatus === 'Cancelled' && existing.payment_status === 'Paid'
          ? 'Refunded'
          : existing.payment_status;

    db.prepare('UPDATE orders SET status = ?, payment_status = ?, updated_at = ? WHERE id = ?').run(
      nextStatus,
      nextPaymentStatus,
      now,
      existing.id
    );

    db.exec('COMMIT;');
    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(existing.id) as unknown as OrderRow;
    res.json({ order: hydrateOrder(updated) });
  } catch {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // ignore
    }
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

app.get('/api/admin/customers', requireAdmin, (_req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as unknown as OrderRow[];
  const map = new Map<
    string,
    {
      email: string;
      name: string;
      phone: string;
      city: string;
      orderCount: number;
      totalSpent: number;
      lastOrderAt: string;
    }
  >();

  for (const o of orders) {
    const key = o.customer_email.toLowerCase();
    const prev = map.get(key);
    const spend = o.status === 'Cancelled' ? 0 : o.total_amount;
    if (!prev) {
      map.set(key, {
        email: o.customer_email,
        name: o.customer_name,
        phone: o.customer_phone,
        city: o.city,
        orderCount: 1,
        totalSpent: spend,
        lastOrderAt: o.created_at,
      });
    } else {
      prev.orderCount += 1;
      prev.totalSpent += spend;
    }
  }

  res.json({ customers: Array.from(map.values()) });
});

async function startServer() {
  if (IS_PROD) {
    const distDir = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zari & Loom server running at http://localhost:${PORT}`);
  });
}

startServer();
