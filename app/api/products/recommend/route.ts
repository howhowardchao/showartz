import { NextRequest, NextResponse } from 'next/server';
import { recommendProducts } from '@/lib/db';

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// POST - Recommend products based on criteria
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { budget, category, tags, goal } = body;

    const products = await recommendProducts({
      budget,
      category,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
      goal,
    });

    return NextResponse.json(products);
  } catch (error: unknown) {
    console.error('Error recommending products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to recommend products',
        details: toErrorMessage(error)
      },
      { status: 500 }
    );
  }
}



