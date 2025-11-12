import { NextRequest, NextResponse } from "next/server";
import { testS3Connection } from "@/lib/s3";

// GET /api/test/s3 - Test S3 connection (for diagnostics)
export async function GET(request: NextRequest) {
  try {
    const result = await testS3Connection();
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected error testing S3 connection",
        error: error.message,
      },
      { status: 500 }
    );
  }
}








