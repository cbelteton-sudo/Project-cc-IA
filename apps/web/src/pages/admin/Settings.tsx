import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Building2, Save, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '../../lib/image-compression';
import { api } from '../../lib/api';

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
  });

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const { data } = await api.get('/tenants/current');
        setFormData({
          name: data.name || '',
          logoUrl: data.logoUrl || '',
        });
      } catch (error) {
        console.error('Error fetching tenant:', error);
        toast.error('Error al cargar la configuración de la organización');
      } finally {
        setLoading(false);
      }
    };
    fetchTenant();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 800, 0.8);
      // We store the base64 string directly so it can save as data URL to the DB.
      setFormData((prev) => ({ ...prev, logoUrl: compressed.base64 }));
      toast.success('Imagen lista para guardar');
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Error al procesar la imagen');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('El nombre de la organización es requerido');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/tenants/current', formData);
      toast.success('Configuración actualizada correctamente');

      // Optional: Force a window reload to update the logo in the sidebar globally
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error saving settings:', error);
      const errMsg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : String(error));
      toast.error(`Error al guardar: ${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          Configuración de la Organización
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Administra la información general de la empresa y preferencias globales.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre de la Empresa
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                  placeholder="Ej. Constructora Delta S.A."
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo Corporativo
              </label>

              <div className="mt-1 flex items-center gap-6">
                <div className="h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="cursor-pointer text-white font-medium text-sm">
                      Cambiar
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="logo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      <Upload className="w-4 h-4" />
                      Subir Imagen
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    O pega una URL directamente si la imagen ya está alojada:
                  </p>
                  <input
                    type="text"
                    name="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                    placeholder="https://ejemplo.com/logo.png"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-gray-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
