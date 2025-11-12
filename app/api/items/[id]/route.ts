import { NextRequest, NextResponse } from "next/server";

// NOTE: Item model has been replaced with Product model
// These endpoints are deprecated. Use /api/seller/products instead.

// GET /api/items/[id] - Get single item (DEPRECATED)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { 
      error: "This endpoint is deprecated. Item model has been replaced with Product model. Please use /api/seller/products instead." 
    },
    { status: 410 } // 410 Gone - resource is no longer available
  );
}

// PATCH /api/items/[id] - Update item (DEPRECATED)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { 
      error: "This endpoint is deprecated. Item model has been replaced with Product model. Please use /api/seller/products/[id] instead." 
    },
    { status: 410 } // 410 Gone - resource is no longer available
  );
}

// DELETE /api/items/[id] - Delete item (DEPRECATED)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { 
      error: "This endpoint is deprecated. Item model has been replaced with Product model. Please use /api/seller/products/[id] instead." 
    },
    { status: 410 } // 410 Gone - resource is no longer available
  );
}

