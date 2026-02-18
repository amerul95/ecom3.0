import { headers } from 'next/headers';
import { Suspense } from 'react';
import { DataTableUser, type UserItem } from '@/components/users/data-table-user';
import { UsersTableSkeleton } from '@/components/skeleton';

async function getUsers(): Promise<UserItem[]> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/admin/users`, {
    cache: 'no-store',
    headers: { cookie: headersList.get('cookie') ?? '' },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch users');
  }

  const data = await res.json();
  return data.users;
}

async function UsersTable() {
  const users = await getUsers();

  return <DataTableUser users={users} />;
}

export default function UsersPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">View all registered users.</p>
        </div>

        <Suspense fallback={<UsersTableSkeleton />}>
          <UsersTable />
        </Suspense>
      </div>
    </div>
  );
}
