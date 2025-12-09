
import React, { useState, useMemo, useRef } from 'react';
import { User, UserRole, SYSTEM_MODULES, ACCESS_LEVELS, AccessLevel } from '../types';
import { useMasterData } from '../contexts/MasterDataContext';
import { Save, UserPlus, Search, Edit2, Shield, Briefcase, Mail, X, CheckSquare, Lock, Image as ImageIcon, Link as LinkIcon, Upload } from 'lucide-react';

const UserModal = ({ user, onClose, onSave }: { user: Partial<User> | null, onClose: () => void, onSave: (u: User) => void }) => {
    const { areas } = useMasterData();
    const [avatarMode, setAvatarMode] = useState<'LINK' | 'UPLOAD'>('LINK');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<Partial<User>>({
        firstName: '',
        lastName: '',
        dni: '',
        email: '',
        role: UserRole.USER,
        areaId: '',
        legajo: '',
        avatarUrl: '',
        ...user,
        // Backward compatibility safety check if migrating from array to object
        permissions: Array.isArray(user?.permissions) ? {} : (user?.permissions || {})
    });

    // Auto-generate legajo when DNI changes if it's a new user
    const handleDniChange = (val: string) => {
        if (!user?.id) {
            const cleanDni = val.replace(/\D/g, ''); 
            const suffix = cleanDni.slice(-4).padEnd(4, '0'); 
            const seed = parseInt(suffix.substring(0, 4)) || 0; 
            const generatedLegajo = (10000 + seed).toString();
            setFormData(prev => ({ ...prev, dni: val, legajo: generatedLegajo }));
        } else {
            setFormData(prev => ({ ...prev, dni: val }));
        }
    };

    const handleChange = (field: keyof User, val: any) => {
        setFormData(prev => ({ ...prev, [field]: val }));
    };

    const handlePermissionChange = (moduleId: string, level: AccessLevel) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [moduleId]: level
            }
        }));
    };

    // Image Upload Handler (Convert to Base64)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check size (limit to 500KB to prevent Firestore issues)
            if (file.size > 500 * 1024) {
                alert("La imagen es demasiado grande. Máximo 500KB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName || !formData.lastName || !formData.dni || !formData.areaId) {
            alert("Complete todos los campos obligatorios.");
            return;
        }
        
        onSave({
            id: user?.id || `USR-${Date.now()}`,
            firstName: formData.firstName!,
            lastName: formData.lastName!,
            dni: formData.dni!,
            email: formData.email || '',
            role: formData.role || UserRole.USER,
            areaId: formData.areaId!,
            legajo: formData.legajo || '10000',
            profile: 'Standard',
            permissions: formData.permissions || {},
            avatarUrl: formData.avatarUrl || ''
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                    <h3 className="text-lg font-bold text-zinc-800 flex items-center">
                        {user?.id ? <Edit2 size={20} className="mr-2 text-accent"/> : <UserPlus size={20} className="mr-2 text-accent"/>}
                        {user?.id ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form - Scrollable content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Avatar Section */}
                        <div className="flex items-start gap-6 mb-6">
                            <div className="shrink-0 relative group">
                                <div className="w-24 h-24 rounded-full bg-zinc-200 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                                    {formData.avatarUrl ? (
                                        <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-zinc-400">
                                            {formData.firstName?.[0]}{formData.lastName?.[0]}
                                        </span>
                                    )}
                                </div>
                                {formData.avatarUrl && (
                                    <button 
                                        type="button"
                                        onClick={() => handleChange('avatarUrl', '')}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm"
                                        title="Eliminar foto"
                                    >
                                        <X size={12}/>
                                    </button>
                                )}
                            </div>

                            <div className="flex-1">
                                <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Imagen de Perfil</label>
                                <div className="flex gap-2 mb-3">
                                    <button 
                                        type="button"
                                        onClick={() => setAvatarMode('LINK')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center ${avatarMode === 'LINK' ? 'bg-accent text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                                    >
                                        <LinkIcon size={14} className="mr-2"/> Enlace Web
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setAvatarMode('UPLOAD')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center ${avatarMode === 'UPLOAD' ? 'bg-accent text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                                    >
                                        <Upload size={14} className="mr-2"/> Subir Foto
                                    </button>
                                </div>

                                {avatarMode === 'LINK' ? (
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none"
                                        placeholder="https://ejemplo.com/foto.jpg"
                                        value={formData.avatarUrl || ''}
                                        onChange={(e) => handleChange('avatarUrl', e.target.value)}
                                    />
                                ) : (
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full px-3 py-2 border border-dashed border-zinc-300 rounded-lg text-sm text-zinc-500 hover:bg-zinc-50 hover:border-zinc-400 transition-colors flex items-center justify-center"
                                        >
                                            <ImageIcon size={16} className="mr-2"/> Seleccionar imagen del equipo
                                        </button>
                                        <p className="text-[10px] text-zinc-400 mt-1 ml-1">Máx. 500KB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Personal Data Section */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wide border-b border-zinc-100 pb-1">Datos Personales</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">DNI *</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white font-medium text-zinc-900"
                                        value={formData.dni}
                                        onChange={(e) => handleDniChange(e.target.value)}
                                        placeholder="Sin puntos"
                                        maxLength={10}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Legajo (Auto 10000-19999)</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-zinc-100 text-zinc-700 cursor-not-allowed font-mono text-sm font-bold"
                                        value={formData.legajo}
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Nombre *</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white"
                                        value={formData.firstName}
                                        onChange={(e) => handleChange('firstName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Apellido *</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white"
                                        value={formData.lastName}
                                        onChange={(e) => handleChange('lastName', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 mb-1">Email Corporativo</label>
                                <div className="relative">
                                    <input 
                                        type="email" 
                                        className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        placeholder="nombre@empresa.com"
                                    />
                                    <Mail size={16} className="absolute left-3 top-2.5 text-zinc-400"/>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Título / Cargo (Rol Legacy)</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white appearance-none"
                                            value={formData.role}
                                            onChange={(e) => handleChange('role', e.target.value)}
                                        >
                                            <option value={UserRole.USER}>Usuario Básico</option>
                                            <option value={UserRole.ADMIN}>Administrador</option>
                                            <option value={UserRole.MAINTENANCE}>Mantenimiento</option>
                                            <option value={UserRole.WAREHOUSE}>Almacén</option>
                                        </select>
                                        <Shield size={16} className="absolute left-3 top-2.5 text-zinc-400"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 mb-1">Área / Sector *</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white appearance-none"
                                            value={formData.areaId}
                                            onChange={(e) => handleChange('areaId', e.target.value)}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {areas.map(a => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                        <Briefcase size={16} className="absolute left-3 top-2.5 text-zinc-400"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Permissions Matrix Section */}
                        <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200">
                            <h4 className="text-sm font-bold text-zinc-700 mb-1 flex items-center">
                                <Lock size={16} className="mr-2"/> Matriz de Permisos por Módulo
                            </h4>
                            <p className="text-xs text-zinc-400 mb-4">
                                Defina qué acciones puede realizar el usuario en cada módulo del sistema.
                            </p>
                            
                            <div className="space-y-3">
                                {SYSTEM_MODULES.map(module => {
                                    const currentLevel = (formData.permissions as any)?.[module.id] || 'NONE';
                                    const levelInfo = ACCESS_LEVELS.find(l => l.value === currentLevel);

                                    return (
                                        <div key={module.id} className="bg-white p-3 rounded-lg border border-zinc-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="font-bold text-zinc-800 text-sm">{module.label}</div>
                                                <div className="text-xs text-zinc-500">{module.description}</div>
                                            </div>
                                            
                                            <div className="flex-shrink-0 w-full md:w-48">
                                                <select 
                                                    className={`w-full px-3 py-1.5 rounded-lg border text-sm font-semibold outline-none focus:ring-2 focus:ring-accent cursor-pointer ${
                                                        currentLevel === 'NONE' ? 'bg-zinc-100 border-zinc-200 text-zinc-400' : 
                                                        currentLevel === 'ADMIN' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                                                        'bg-white border-zinc-300 text-zinc-700'
                                                    }`}
                                                    value={currentLevel}
                                                    onChange={(e) => handlePermissionChange(module.id, e.target.value as AccessLevel)}
                                                >
                                                    {ACCESS_LEVELS.map(lvl => (
                                                        <option key={lvl.value} value={lvl.value} className={lvl.color}>
                                                            {lvl.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-zinc-100 flex gap-3 bg-zinc-50">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 text-zinc-600 font-medium hover:bg-zinc-200 rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleSubmit} className="flex-1 py-2.5 bg-accent text-white font-bold rounded-lg hover:bg-accentHover shadow-md transition-colors flex justify-center items-center">
                        <Save size={18} className="mr-2"/> Guardar Perfil
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function UserManagement() {
    const { users, areas, addUser, updateUser } = useMasterData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleCreate = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleSaveUser = async (user: User) => {
        try {
            if (selectedUser) {
                await updateUser(user);
                alert("Usuario actualizado correctamente.");
            } else {
                await addUser(user);
                alert("Usuario creado correctamente.");
            }
            setIsModalOpen(false);
        } catch (e) {
            console.error(e);
            alert("Error al guardar usuario.");
        }
    };

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        const term = searchTerm.toLowerCase();
        return users.filter(u => 
            u.firstName.toLowerCase().includes(term) || 
            u.lastName.toLowerCase().includes(term) ||
            u.dni.includes(term) ||
            u.legajo.toLowerCase().includes(term)
        );
    }, [users, searchTerm]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-800">Administración de Usuarios</h2>
                    <p className="text-zinc-500 text-sm">Gestión de personal, roles y matriz de permisos por módulo.</p>
                </div>
                <button 
                    onClick={handleCreate}
                    className="bg-accent text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-accentHover transition-all flex items-center"
                >
                    <UserPlus size={20} className="mr-2"/> Nuevo Usuario
                </button>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                {/* Filters */}
                <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre, DNI o legajo..." 
                            className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search size={18} className="absolute left-3 top-2.5 text-zinc-400" />
                    </div>
                    <div className="text-xs text-zinc-500 font-medium">
                        Total: <span className="text-zinc-800">{filteredUsers.length}</span> usuarios
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 text-zinc-500 font-semibold border-b border-zinc-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 w-16"></th>
                                <th className="px-6 py-3 w-32">Legajo</th>
                                <th className="px-6 py-3">Nombre Completo</th>
                                <th className="px-6 py-3">Área / Sector</th>
                                <th className="px-6 py-3">Acceso a Módulos</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {filteredUsers.map(user => {
                                const areaName = areas.find(a => a.id === user.areaId)?.name || 'Sin asignar';
                                
                                // Count active modules (anything not NONE)
                                const permissions = user.permissions || {};
                                const activeModulesCount = Object.values(permissions).filter(v => v !== 'NONE').length;
                                const isAdmin = permissions['USERS'] === 'ADMIN';

                                return (
                                    <tr key={user.id} className="hover:bg-zinc-50 transition-colors group">
                                        <td className="px-6 py-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center overflow-hidden">
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover"/>
                                                ) : (
                                                    <span className="text-xs font-bold text-zinc-400">{user.firstName[0]}{user.lastName[0]}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 font-mono text-zinc-500">{user.legajo}</td>
                                        <td className="px-6 py-3">
                                            <div className="font-bold text-zinc-800">{user.lastName}, {user.firstName}</div>
                                            <div className="text-xs text-zinc-400">{user.email || 'Sin email'}</div>
                                        </td>
                                        <td className="px-6 py-3 text-zinc-600">
                                            <span className="bg-zinc-100 px-2 py-1 rounded border border-zinc-200 text-xs font-medium inline-block">
                                                {areaName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {isAdmin && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                                        ADMIN
                                                    </span>
                                                )}
                                                {!isAdmin && activeModulesCount === 0 && (
                                                    <span className="text-zinc-400 text-xs italic">Sin accesos configurados</span>
                                                )}
                                                {!isAdmin && activeModulesCount > 0 && (
                                                    <span className="text-zinc-600 text-xs">{activeModulesCount} módulos habilitados</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button 
                                                onClick={() => handleEdit(user)}
                                                className="text-zinc-400 hover:text-accent p-1.5 hover:bg-zinc-100 rounded-lg transition-all"
                                                title="Editar Usuario"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-zinc-400 italic">
                                        No se encontraron usuarios registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <UserModal 
                    user={selectedUser} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveUser} 
                />
            )}
        </div>
    );
}
