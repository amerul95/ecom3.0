'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export interface UserItem {
  no: number;
  userId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'BUYER'; // Primary role for backward compatibility
  roles: ('ADMIN' | 'BUYER')[]; // All roles (can have multiple)
  ordersCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DataTableUserProps {
  users: UserItem[];
}

export function DataTableUser({ users }: DataTableUserProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">No</TableHead>
            <TableHead>User ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Updated At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const createdDate = formatDate(user.createdAt);
              const updatedDate = formatDate(user.updatedAt);
              return (
                <TableRow key={user.userId}>
                  <TableCell className="font-medium">{user.no}</TableCell>
                  <TableCell className="font-mono text-xs">{user.userId.slice(0, 8)}...</TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role, idx) => (
                        <Badge
                          key={idx}
                          variant={role === 'ADMIN' ? 'default' : 'secondary'}
                          className={
                            role === 'ADMIN'
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                              : 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
                          }
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{user.ordersCount}</TableCell>
                  <TableCell>
                    <div>
                      <div>{createdDate.date}</div>
                      <div className="text-xs text-muted-foreground">{createdDate.time}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{updatedDate.date}</div>
                      <div className="text-xs text-muted-foreground">{updatedDate.time}</div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
