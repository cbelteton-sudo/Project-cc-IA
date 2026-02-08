
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Clock, XCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RiskCardProps {
    title: string;
    count: number;
    type: 'stalled' | 'blocked' | 'overdue';
    items: any[];
    onItemClick: (item: any) => void;
}

export const RiskCard: React.FC<RiskCardProps> = ({ title, count, type, items, onItemClick }) => {
    const getIcon = () => {
        switch (type) {
            case 'stalled': return <Clock className="w-5 h-5 text-orange-500" />;
            case 'blocked': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'overdue': return <AlertCircle className="w-5 h-5 text-red-600" />;
        }
    };

    const getColor = () => {
        switch (type) {
            case 'stalled': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'blocked': return 'bg-red-50 text-red-700 border-red-200';
            case 'overdue': return 'bg-red-50 text-red-800 border-red-300';
        }
    };

    return (
        <Card className="h-full">
            <CardContent className="p-0">
                <div className={`p-4 border-b flex justify-between items-center ${getColor()}`}>
                    <div className="flex items-center gap-2 font-semibold">
                        {getIcon()}
                        {title}
                    </div>
                    <span className="text-2xl font-bold">{count}</span>
                </div>
                <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                    {items.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Todo en orden</p>}
                    {items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onItemClick(item)}
                            className="flex justify-between items-center p-2 hover:bg-slate-50 rounded cursor-pointer group text-sm"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-gray-800">{item.name}</p>
                                <p className="text-xs text-gray-500 truncate">{item.code || 'Sin código'}</p>
                            </div>
                            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 h-6 w-6">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
