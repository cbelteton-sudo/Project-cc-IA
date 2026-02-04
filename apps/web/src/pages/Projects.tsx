import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, Folder, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Types
interface Project {
    id: string;
    name: string;
    code: string;
    status: string;
    _count?: {
        budgets: number;
    };
}

export const Projects = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', code: '', currency: 'USD' });
    const [errorMsg, setErrorMsg] = useState('');

    // Fetch Projects
    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await axios.get('http://localhost:4180/projects', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token,
    });

    // Create Project Mutation
    const createMutation = useMutation({
        mutationFn: async (data: typeof newProject) => {
            return axios.post('http://localhost:4180/projects', data, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setIsModalOpen(false);
            setNewProject({ name: '', code: '', currency: 'USD' });
            setErrorMsg('');
        },
        onError: (err: any) => {
            console.error("Create failed", err);
            setErrorMsg(err.response?.data?.message || 'Failed to create project');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(newProject);
    };

    if (isLoading) return <div className="p-8">Loading projects...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    New Project
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects?.map((project: Project) => (
                    <div key={project.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <Folder size={24} />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {project.status}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-1">{project.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">Code: {project.code || 'N/A'}</p>

                        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                            <span>{project._count?.budgets || 0} Budgets</span>
                            <Link to={`/projects/${project.id}`} className="flex items-center text-blue-600 hover:underline font-medium">
                                Open <ArrowRight size={16} className="ml-1" />
                            </Link>
                        </div>
                    </div>
                ))}

                {projects?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        No projects found. Create one to get started.
                    </div>
                )}
            </div>

            {/* Simple Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Create New Project</h3>
                        {errorMsg && (
                            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-200">
                                {errorMsg}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newProject.name}
                                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Code</label>
                                <input
                                    type="text"
                                    value={newProject.code}
                                    onChange={e => setNewProject({ ...newProject, code: e.target.value })}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    {createMutation.isPending ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
