'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface SearchProps {
  category?: string;
}

export default function Search() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(() => {
        if (!searchParams) return '';
        return searchParams.get('search') || '';
    });

    // Sync state with URL when URL changes externally (e.g., browser back/forward)
    useEffect(() => {
        const urlSearch = searchParams?.get('search') || '';
        if (urlSearch !== searchTerm) {
            setSearchTerm(urlSearch);
        }
    }, [searchParams]); // Only sync when URL changes, don't update URL

    // Debounce search updates - this will trigger server-side refetch via URL params
    useEffect(() => {
        const timer = setTimeout(() => {
            // Read current search from URL at the time of update
            const currentSearch = searchParams?.get('search') || '';
            const trimmedSearch = searchTerm.trim();
            
            // Only update URL if search term actually changed
            if (currentSearch === trimmedSearch) {
                return;
            }

            const currentParams = searchParams ? searchParams.toString() : '';
            const params = new URLSearchParams(currentParams);
            
            // Remove sort param when searching (sort is client-side only)
            params.delete('sort');
            
            if (trimmedSearch) {
                params.set('search', trimmedSearch);
            } else {
                params.delete('search');
            }
            
            const paramsString = params.toString();
            const basePath = pathname || '/';
            const newUrl = paramsString ? `${basePath}?${paramsString}` : basePath;
            router.push(newUrl);
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(timer);
    }, [searchTerm, pathname, router]); // Removed searchParams to prevent infinite loop

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    }, []);
    
    return (
        <div className="w-full">
            <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50"
            />
        </div>
    )
}
