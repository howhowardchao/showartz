export type VideoCategory = 'hot' | 'image' | 'product' | 'fun';

export interface Video {
  id: string;
  ig_url: string;
  title?: string;
  thumbnail_url?: string;
  category: VideoCategory;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Image {
  id: string;
  image_url: string;
  description?: string;
  display_order: number;
  created_at: Date;
}

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
}

export interface Product {
  id: string;
  shopee_item_id: number;
  shopee_shop_id: number;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  image_url?: string;
  image_urls?: string[];
  shopee_url?: string;
  pinkoi_url?: string;
  category?: string;
  tags?: string[];
  stock: number;
  sales_count: number;
  rating?: number;
  is_active: boolean;
  last_synced_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ProductRecommendation {
  product_id: string;
  product_name: string;
  reason: string;
  usage_suggestion?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  avatar_url?: string;
  email_verified: boolean;
  status: string;
  membership_level: string;
  total_points: number;
  total_spent: number;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: Date;
}

