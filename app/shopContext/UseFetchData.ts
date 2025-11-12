'use client';

import { useState, useEffect } from 'react';

interface UseFetchDataReturn<T> {
  datas: T;
  isLoading: boolean;
  error: Error | null;
}

const useFetchData = <T = any>(url: string): UseFetchDataReturn<T> => {
  const [datas, setDatas] = useState<T>([] as T);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        setDatas(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { datas, isLoading, error };
};

export default useFetchData;

