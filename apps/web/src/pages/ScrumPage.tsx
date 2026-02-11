import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ScrumDashboard } from '../components/scrum/ScrumDashboard';
import { ChevronLeft } from 'lucide-react';

export const ScrumPage = () => {
    const { projectId } = useParams();

    if (!projectId) return <div>Project ID missing</div>;

    return (
        <div className="space-y-4">
            <Link to="/scrum" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2">
                <ChevronLeft size={16} />
                Volver a Proyectos
            </Link>
            <ScrumDashboard projectId={projectId} />
        </div>
    );
};
