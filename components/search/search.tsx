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

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event?.currentTarget)
        const inputSearchValue = formData.get('search') as string;
        const params = new URLSearchParams();
        if(inputSearchValue){
            params.set('search', inputSearchValue);
        } else {
            params.delete('search');
        }
        router.replace(`${pathname}?${params.toString()}`);
    }

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

    // const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    //     setSearchTerm(event.target.value);
    // }, []);
    
    return (
        <div className="w-full">
            <form onSubmit={handleSearch}>
            <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50"
            />
            </form>
        </div>
    )
}
