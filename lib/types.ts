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
  shopee_url: string;
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

