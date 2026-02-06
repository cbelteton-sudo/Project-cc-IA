import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

type Country = 'GT' | 'SV';
type Currency = 'GTQ' | 'USD';

interface RegionContextType {
    country: Country;
    currency: Currency;
    setCountry: (country: Country) => void;
    formatCurrency: (amount: number) => string;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export const RegionProvider = ({ children }: { children: ReactNode }) => {
    const [country, setCountry] = useState<Country>('GT');
    const [currency, setCurrency] = useState<Currency>('GTQ');

    useEffect(() => {
        // Update currency when country changes
        if (country === 'GT') {
            setCurrency('GTQ');
        } else if (country === 'SV') {
            setCurrency('USD');
        }
    }, [country]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(country === 'GT' ? 'es-GT' : 'en-SV', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <RegionContext.Provider value={{ country, currency, setCountry, formatCurrency }}>
            {children}
        </RegionContext.Provider>
    );
};

export const useRegion = () => {
    const context = useContext(RegionContext);
    if (!context) {
        throw new Error('useRegion must be used within a RegionProvider');
    }
    return context;
};
