import React from 'react';
import { useParams } from 'react-router-dom';

export const ProjectSettings = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Configuración del Proyecto</h1>
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500">Ajustes específicos para el proyecto {id}</p>
      </div>
    </div>
  );
};

export default ProjectSettings;
