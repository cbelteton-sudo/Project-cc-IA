import { useState, useEffect } from 'react';

export interface Contractor {
  id: string;
  name: string;
  type: string;
  email?: string;
  phone?: string;
}

export function useContractors() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContractors();
  }, []);

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';

      const response = await fetch(`${API_URL}/contractors`, {
        headers: {
          // Add authorization header if needed, usually handled by interceptors in real apps
          // For now assuming we might need a token from localStorage or similar if auth is required
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contractors');
      }

      const data = await response.json();
      setContractors(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching contractors:', err);
      setError(err.message || 'Error fetching contractors');
    } finally {
      setLoading(false);
    }
  };

  return { contractors, loading, error, refresh: fetchContractors };
}
