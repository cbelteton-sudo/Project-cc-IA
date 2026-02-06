import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Search, Loader2, Package } from 'lucide-react';

interface Material {
    id: string;
    name: string;
    unit: string;
    costParam: number;
}

interface MaterialSelectorProps {
    onSelect: (material: Material) => void;
}

export const MaterialSelector = ({ onSelect }: MaterialSelectorProps) => {
    const { token } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Material[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const search = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                // In a real scenario, we'd have a search endpoint. 
                // For now, fetching all and filtering client-side or using the Basic CRUD list 
                // assuming the backend returns all materials for the tenant.
                // Optimally: GET /materials?search={query}
                const res = await axios.get('http://localhost:4180/materials', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const allMaterials = res.data;
                console.log('API Params:', query);
                console.log('API Response:', allMaterials);
                
                const filtered = allMaterials.filter((m: Material) => 
                    m.name.toLowerCase().includes(query.toLowerCase())
                );
                
                setResults(filtered.slice(0, 5)); // Limit to 5 results
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [query, token]);

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Buscar material (ej. Cemento, Varilla)..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={16} />
                )}
            </div>

            {isOpen && (results.length > 0 || query.length >= 2) && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {results.length > 0 ? (
                        results.map(material => (
                            <button
                                key={material.id}
                                onClick={() => {
                                    onSelect(material);
                                    setQuery('');
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                            >
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                                    <Package size={16} />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-800 text-sm">{material.name}</div>
                                    <div className="text-xs text-gray-500">Unidad: {material.unit}</div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            {isLoading ? 'Buscando...' : 'No se encontraron materiales.'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
