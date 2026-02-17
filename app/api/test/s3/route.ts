import { NextRequest, NextResponse } from "next/server";
import { testStorageConnection } from "@/lib/storage";

// GET /api/test/s3 - Test Supabase Storage connection (for diagnostics)
// Note: Route name kept as /s3 for backward compatibility
export async function GET(request: NextRequest) {
  try {
    const result = await testStorageConnection();
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected error testing storage connection",
        error: error.message,
      },
      { status: 500 }
    );
  }
}








