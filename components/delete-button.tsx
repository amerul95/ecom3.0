'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type DeleteButtonProps = {
  productId: string;
  productName: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
};

export function DeleteButton({ productId, productName, onSuccess, onError }: DeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await axios.delete(`/api/admin/products/${productId}`);
      setOpen(false);
      onSuccess?.(`"${productName}" has been deleted.`);
      router.refresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      onError?.(err.response?.data?.error || 'Failed to delete product. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="flex-1"
        onClick={() => setOpen(true)}
        disabled={deleting}
      >
        {deleting ? 'Deleting...' : 'Delete'}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{productName}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>No</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Yes'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
