import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Save, UserPlus } from 'lucide-react';

export default function UserManagement() {
    const [dni, setDni] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.USER);

    // Auto-generate legajo based on DNI + Random or Year
    const generatedLegajo = dni ? `L-${new Date().getFullYear()}-${dni.slice(-3)}` : 'Pendiente...';

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Usuario creado:\nNombre: ${firstName} ${lastName}\nDNI: ${dni}\nLegajo: ${generatedLegajo}`);
        // Reset form
        setDni('');
        setFirstName('');
        setLastName('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
                    <div className="flex items-center space-x-3 mb-6 border-b pb-4">
                        <div className="bg-accent p-2 rounded-lg text-white">
                            <UserPlus size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Alta de Usuario</h3>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">DNI (Identificador)</label>
                            <input 
                                type="text" 
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white" 
                                placeholder="Ingrese DNI sin puntos"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Legajo (Automático)</label>
                            <input 
                                type="text" 
                                value={generatedLegajo} 
                                disabled 
                                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-lg" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                            <input 
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)} 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white" 
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
                            <input 
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)} 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white" 
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input type="email" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                            <select 
                                value={role} 
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                            >
                                <option value={UserRole.USER}>Usuario Básico</option>
                                <option value={UserRole.ADMIN}>Administrador</option>
                                <option value={UserRole.MAINTENANCE}>Mantenimiento</option>
                                <option value={UserRole.WAREHOUSE}>Almacén</option>
                            </select>
                        </div>

                        <button type="submit" className="w-full flex items-center justify-center space-x-2 bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 transition-colors mt-4">
                            <Save size={18} />
                            <span>Crear Usuario</span>
                        </button>
                    </form>
                </div>
            </div>

            {/* List Section */}
            <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Usuarios Registrados</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                                    <th className="py-3 px-2">Legajo</th>
                                    <th className="py-3 px-2">Nombre Completo</th>
                                    <th className="py-3 px-2">DNI</th>
                                    <th className="py-3 px-2">Rol</th>
                                    <th className="py-3 px-2">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                <tr className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="py-3 px-2 font-mono text-slate-600">L-2023-123</td>
                                    <td className="py-3 px-2 font-medium">Juan Perez</td>
                                    <td className="py-3 px-2">30123456</td>
                                    <td className="py-3 px-2"><span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">ADMIN</span></td>
                                    <td className="py-3 px-2 text-green-600">Activo</td>
                                </tr>
                                <tr className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="py-3 px-2 font-mono text-slate-600">L-2023-456</td>
                                    <td className="py-3 px-2 font-medium">Maria Gonzalez</td>
                                    <td className="py-3 px-2">28987654</td>
                                    <td className="py-3 px-2"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">MAINTENANCE</span></td>
                                    <td className="py-3 px-2 text-green-600">Activo</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}