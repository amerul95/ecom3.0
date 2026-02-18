import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export function UsersTableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]"><Skeleton className="h-4 w-8" /></TableHead>
            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead><Skeleton className="h-4 w-32" /></TableHead>
            <TableHead><Skeleton className="h-4 w-40" /></TableHead>
            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead className="text-right"><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-32" /></TableHead>
            <TableHead><Skeleton className="h-4 w-32" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-6" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-20" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
