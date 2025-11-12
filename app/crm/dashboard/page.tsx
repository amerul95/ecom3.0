'use client';

/**
 * CRM Dashboard Page
 * This is a placeholder - frontend implementation is out of scope
 * The API endpoints are ready at:
 * - GET/POST /api/items
 * - GET/PATCH/DELETE /api/items/[id]
 * - POST /api/upload/presign
 */

export default function CRMDashboard() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">CRM Dashboard</h1>
      <p className="text-gray-600 mb-4">
        Backend API is ready. Connect your frontend to:
      </p>
      <ul className="list-disc list-inside space-y-2 text-gray-700">
        <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/items</code> - List items</li>
        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/items</code> - Create item</li>
        <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/items/[id]</code> - Get item</li>
        <li><code className="bg-gray-100 px-2 py-1 rounded">PATCH /api/items/[id]</code> - Update item</li>
        <li><code className="bg-gray-100 px-2 py-1 rounded">DELETE /api/items/[id]</code> - Delete item</li>
        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/upload/presign</code> - Get S3 upload URL</li>
      </ul>
      <p className="mt-6 text-sm text-gray-500">
        See README_BACKEND.md for API documentation and examples.
      </p>
    </div>
  );
}










