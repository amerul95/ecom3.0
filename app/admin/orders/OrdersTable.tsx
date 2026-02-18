"use client";

import * as React from "react";
import Link from "next/link";
import axios from "axios";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Order = {
  id: string;
  status: OrderStatus;
  total: string | number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: string | number;
    product: { id: string; name: string; slug: string };
  }>;
  payment?: { id: string; status: string } | null;
  shipping?: { id: string } | null;
};

const getStatusBadgeVariant = (status: OrderStatus) => {
  switch (status) {
    case "PAID":
    case "DELIVERED":
      return "default";
    case "PROCESSING":
    case "SHIPPED":
      return "secondary";
    case "CANCELLED":
    case "REFUNDED":
      return "destructive";
    default:
      return "outline";
  }
};

export function OrdersTable({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = React.useState(initialOrders);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setError(null);
    setUpdatingId(orderId);
    try {
      const res = await axios.patch(`/api/admin/orders/${orderId}`, {
        status: newStatus,
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? res.data.order : o))
      );
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTotal = (t: string | number) => {
    const n = typeof t === "string" ? parseFloat(t) : t;
    return isNaN(n) ? String(t) : `$${n.toFixed(2)}`;
  };

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <Link
            href={`/admin/orders/${order.id}`}
            className="text-primary hover:underline font-mono text-xs"
          >
            {order.id.slice(0, 8)}…
          </Link>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        return (
          <div className="text-muted-foreground">
            {formatDate(row.getValue("createdAt"))}
          </div>
        );
      },
    },
    {
      accessorKey: "user",
      header: "Customer",
      cell: ({ row }) => {
        const user = row.original.user;
        return (
          <div>
            <div className="font-medium">{user?.name || "—"}</div>
            <div className="text-muted-foreground text-xs">{user?.email || "—"}</div>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const user = row.original.user;
        const searchValue = value.toLowerCase();
        return (
          user?.name?.toLowerCase().includes(searchValue) ||
          user?.email?.toLowerCase().includes(searchValue) ||
          false
        );
      },
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => {
        return <div className="font-medium">{formatTotal(row.getValue("total"))}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const order = row.original;
        const isUpdating = updatingId === order.id;
        return (
          <div className="flex items-center gap-2">
            <Select
              value={order.status}
              onValueChange={(value) =>
                handleStatusChange(order.id, value as OrderStatus)
              }
              disabled={isUpdating}
            >
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isUpdating && (
              <span className="text-xs text-muted-foreground">Updating…</span>
            )}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id) === value;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <Link
            href={`/admin/orders/${order.id}`}
            className="text-primary hover:underline text-sm"
          >
            View
          </Link>
        );
      },
    },
  ];

  const table = useReactTable({
    data: orders,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No orders yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search customers..."
          value={(table.getColumn("user")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("user")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Select
          value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
          onValueChange={(value) =>
            table.getColumn("status")?.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} order(s) total.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
