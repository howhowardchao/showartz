/**
 * OpenAI Assistant Function Calling 定義
 * 用於讓 Assistant 能夠查詢和推薦商品
 */

import { recommendProducts, searchProductsByTags, getAllProducts } from './db';

export const productFunctions = {
  /**
   * 根據條件推薦商品
   */
  recommend_products: {
    name: 'recommend_products',
    description: '根據用戶的需求、預算、目標等條件推薦適合的商品。當用戶需要商品推薦時使用此功能。',
    parameters: {
      type: 'object',
      properties: {
        budget: {
          type: 'number',
          description: '用戶的預算範圍（台幣），例如 1000、5000 等',
        },
        category: {
          type: 'string',
          description: '商品分類，例如：背包、零錢包、腰包、側背包、後背包、手提包等',
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: '商品標籤，例如：["貓頭鷹", "熊貓", "恐龍", "老虎", "鯊魚", "兔子", "黑色", "灰色", "迷彩", "金線", "皮草", "尼龍", "XS", "S", "M", "L", "XL"]',
        },
        goal: {
          type: 'string',
          description: '用戶想要達成的目標或改善的部分，例如：情緒穩定、專注力、行動力、人際關係、自我覺察、工作效率、生活品質等',
        },
        limit: {
          type: 'number',
          description: '最多返回的商品數量，預設為 5',
          default: 5,
        },
      },
      required: [],
    },
  },
  
  /**
   * 根據標籤搜尋商品
   */
  search_products_by_tags: {
    name: 'search_products_by_tags',
    description: '根據商品標籤搜尋商品，例如搜尋特定動物、顏色、尺寸等',
    parameters: {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: '商品標籤列表，例如：["貓頭鷹", "黑色", "M"]',
          required: true,
        },
      },
      required: ['tags'],
    },
  },
  
  /**
   * 取得所有可用商品
   */
  get_all_products: {
    name: 'get_all_products',
    description: '取得所有可用的商品列表，用於了解目前有哪些商品可以推薦',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: '最多返回的商品數量',
          default: 20,
        },
      },
      required: [],
    },
  },
};

/**
 * 執行 Function Calling
 */
export async function executeFunction(functionName: string, args: any): Promise<any> {
  try {
    switch (functionName) {
      case 'recommend_products':
        const products = await recommendProducts({
          budget: args.budget,
          category: args.category,
          tags: args.tags,
          goal: args.goal,
        });
        // 限制返回數量（確保是整數）
        const limit = Math.floor(args.limit) || 5;
        return {
          success: true,
          products: products.slice(0, limit).map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            original_price: p.original_price,
            image_url: p.image_url,
            description: p.description,
            category: p.category,
            tags: p.tags,
            url: p.pinkoi_url || p.shopee_url,
            sales_count: p.sales_count,
            rating: p.rating,
          })),
          total: products.length,
        };
        
      case 'search_products_by_tags':
        if (!args.tags || !Array.isArray(args.tags) || args.tags.length === 0) {
          return { success: false, error: 'tags parameter is required' };
        }
        const taggedProducts = await searchProductsByTags(args.tags);
        return {
          success: true,
          products: taggedProducts.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image_url: p.image_url,
            category: p.category,
            tags: p.tags,
            url: p.pinkoi_url || p.shopee_url,
          })),
          total: taggedProducts.length,
        };
        
      case 'get_all_products':
        const allProducts = await getAllProducts({ 
          isActive: true,
          limit: Math.floor(args.limit) || 20,
        });
        return {
          success: true,
          products: allProducts.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category,
            tags: p.tags,
          })),
          total: allProducts.length,
        };
        
      default:
        return { success: false, error: `Unknown function: ${functionName}` };
    }
  } catch (error: any) {
    console.error(`Error executing function ${functionName}:`, error);
    return { success: false, error: error?.message || String(error) };
  }
}

