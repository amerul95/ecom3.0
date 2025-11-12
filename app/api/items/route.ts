import { NextRequest, NextResponse } from "next/server";

// NOTE: Item model has been replaced with Product model
// These endpoints are deprecated. Use /api/seller/products instead.

// GET /api/items - List items (DEPRECATED)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: "This endpoint is deprecated. Item model has been replaced with Product model. Please use /api/seller/products instead." 
    },
    { status: 410 } // 410 Gone - resource is no longer available
  );
}

// POST /api/items - Create item (DEPRECATED)
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: "This endpoint is deprecated. Item model has been replaced with Product model. Please use /api/seller/products instead." 
    },
    { status: 410 } // 410 Gone - resource is no longer available
  );
}
