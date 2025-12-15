
import React, { useState, useEffect } from 'react';
import { Save, Building2, Globe, Mail, Phone, MapPin, CreditCard, Image } from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { useUI } from '../../contexts/UIContext';
import { CompanySettings } from '../../types';

export const CompanySettingsView = () => {
    const { companySettings, updateCompanySettings } = useMasterData();
    const { showToast } = useUI();
    
    const [form, setForm] = useState<CompanySettings>({
        name: '',
        address: '',
        phone: '',
        taxId: '',
        email: '',
        logoUrl: '',
        website: '',
        primaryColor: '#0d9488'
    });

    useEffect(() => {
        if (companySettings) {
            setForm(companySettings);
        }
    }, [companySettings]);

    const handleSave = async () => {
        try {
            await updateCompanySettings(form);
            showToast("Configuración de empresa actualizada", "success");
        } catch (e) {
            console.error(e);
            showToast("Error al guardar configuración", "error");
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <Building2 className="mr-2 text-slate-500" size={20} />
                Configuración de Empresa
            </h3>
            
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Left Column: Data Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Razón Social / Nombre</label>
                            <div className="relative">
                                <Building2 size={16} className="absolute left-3 top-3 text-slate-400"/>
                                <input 
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white text-slate-900"
                                    value={form.name}
                                    onChange={e => setForm({...form, name: e.target.value})}
                                    placeholder="Mi Empresa S.A."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Identificación Fiscal (CUIT / RFC)</label>
                            <div className="relative">
                                <CreditCard size={16} className="absolute left-3 top-3 text-slate-400"/>
                                <input 
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white text-slate-900"
                                    value={form.taxId}
                                    onChange={e => setForm({...form, taxId: e.target.value})}
                                    placeholder="30-12345678-9"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Dirección Comercial</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-3 top-3 text-slate-400"/>
                                <input 
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white text-slate-900"
                                    value={form.address}
                                    onChange={e => setForm({...form, address: e.target.value})}
                                    placeholder="Calle Falsa 123, CABA"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3 top-3 text-slate-400"/>
                                    <input 
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white text-slate-900"
                                        value={form.phone}
                                        onChange={e => setForm({...form, phone: e.target.value})}
                                        placeholder="+54 11 ..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Email General</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-3 text-slate-400"/>
                                    <input 
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white text-slate-900"
                                        value={form.email}
                                        onChange={e => setForm({...form, email: e.target.value})}
                                        placeholder="contacto@empresa.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Sitio Web</label>
                            <div className="relative">
                                <Globe size={16} className="absolute left-3 top-3 text-slate-400"/>
                                <input 
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white text-slate-900"
                                    value={form.website}
                                    onChange={e => setForm({...form, website: e.target.value})}
                                    placeholder="www.miempresa.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Visuals */}
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-700 mb-4">Identidad Visual</h4>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-slate-700 mb-1">URL del Logo (Público)</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Image size={16} className="absolute left-3 top-3 text-slate-400"/>
                                        <input 
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent outline-none text-xs bg-white text-slate-900"
                                            value={form.logoUrl}
                                            onChange={e => setForm({...form, logoUrl: e.target.value})}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Este logo se utilizará en los encabezados de los reportes PDF.</p>
                            </div>

                            <div className="border border-slate-200 bg-white rounded-lg p-4 flex flex-col items-center justify-center min-h-[150px]">
                                {form.logoUrl ? (
                                    <img src={form.logoUrl} alt="Logo Preview" className="max-h-24 object-contain" />
                                ) : (
                                    <div className="text-slate-300 flex flex-col items-center">
                                        <Image size={32} />
                                        <span className="text-xs mt-2">Previsualización de Logo</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button 
                    onClick={handleSave}
                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-slate-800 flex items-center transition-transform active:scale-95"
                >
                    <Save size={18} className="mr-2"/> Guardar Configuración
                </button>
            </div>
        </div>
    );
};
