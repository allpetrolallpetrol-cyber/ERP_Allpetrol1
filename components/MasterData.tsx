
import React, { useState } from 'react';
import { 
    MaterialsView
} from './master-data/MaterialsView';
import { AssetsView } from './master-data/AssetsView';
import { RoutinesView } from './master-data/RoutinesView';
import { ChecklistsView } from './master-data/ChecklistsView';
import { PartnersView } from './master-data/PartnersView';
import { AreasView } from './master-data/AreasView';
import { WarehousesView } from './master-data/WarehousesView';
import { DataImporter } from './master-data/DataImporter';
import { NumeratorsView } from './master-data/NumeratorsView';
import { CompanySettingsView } from './master-data/CompanySettingsView';

type MainTab = 'STOCK' | 'MAINTENANCE' | 'PARTNERS' | 'CONFIG';

export const MasterData = () => {
    // Mother Tab State
    const [mainTab, setMainTab] = useState<MainTab>('STOCK');
    // Daughter Tab State (Generic, depends on main tab)
    const [subTab, setSubTab] = useState<string>('MATERIALS');

    // Reset subtab when main tab changes
    const handleMainTabChange = (tab: MainTab) => {
        setMainTab(tab);
        if (tab === 'STOCK') setSubTab('MATERIALS');
        if (tab === 'MAINTENANCE') setSubTab('ASSETS');
        if (tab === 'PARTNERS') setSubTab('CLIENTS');
        if (tab === 'CONFIG') setSubTab('COMPANY');
    };

    const TabButton = ({ label, active, onClick, level = 'MAIN' }: { label: string, active: boolean, onClick: () => void, level?: 'MAIN' | 'SUB' }) => {
        const isMain = level === 'MAIN';
        
        // --- STYLES CONFIGURATION ---
        
        // LEVEL 1 (MAIN)
        const mainActive = `
            bg-white text-slate-900 
            border-slate-300 border-b-white 
            z-20 py-4 -translate-y-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]
        `;
        const mainInactive = `
            bg-slate-200 text-slate-500 
            border-transparent border-b-slate-300
            hover:bg-slate-200/80 hover:text-slate-700 py-3
        `;
        
        // LEVEL 2 (SUB)
        const subActive = `
            bg-slate-50 text-slate-800 
            border-slate-200 border-b-slate-50 
            z-20 py-3 -translate-y-0.5 shadow-sm font-bold
        `;
        const subInactive = `
            bg-white text-slate-400 
            border-transparent border-b-slate-200
            hover:bg-slate-50 hover:text-slate-600 py-2.5 font-medium
        `;

        return (
            <button 
                onClick={onClick} 
                className={`
                    relative transition-all duration-200 ease-out border-t border-x rounded-t-xl whitespace-nowrap
                    ${isMain ? 'px-6 text-sm font-bold' : 'px-5 text-xs'}
                    ${active 
                        ? (isMain ? mainActive : subActive) 
                        : (isMain ? mainInactive : subInactive)
                    }
                    -mb-px /* Pulls the button down to cover the container border */
                `}
            >
                {label}
                {/* Visual patch to hide bottom border when active */}
                {active && (
                    <div className={`absolute bottom-[-1px] left-0 right-0 h-1 ${isMain ? 'bg-white' : 'bg-slate-50'}`}></div>
                )}
            </button>
        );
    };

    return (
        <div className="h-full flex flex-col bg-slate-100 animate-in fade-in">
            {/* LEVEL 1: MAIN TABS (The Folder Tops) */}
            <div className="px-6 pt-6 flex items-end gap-1 border-b border-slate-300 bg-slate-100 shrink-0 overflow-x-auto custom-scrollbar">
                <TabButton label="Artículos y Stock" active={mainTab === 'STOCK'} onClick={() => handleMainTabChange('STOCK')} level="MAIN" />
                <TabButton label="Activos y Mantenimiento" active={mainTab === 'MAINTENANCE'} onClick={() => handleMainTabChange('MAINTENANCE')} level="MAIN" />
                <TabButton label="Interlocutores" active={mainTab === 'PARTNERS'} onClick={() => handleMainTabChange('PARTNERS')} level="MAIN" />
                <TabButton label="Configuración" active={mainTab === 'CONFIG'} onClick={() => handleMainTabChange('CONFIG')} level="MAIN" />
            </div>

            {/* LEVEL 1 CONTAINER (White Background) */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden shadow-sm relative z-10">
                
                {/* LEVEL 2: SUB TABS (Inner Folder Tops) */}
                <div className="px-6 pt-4 flex items-end gap-1 border-b border-slate-200 bg-white shrink-0 overflow-x-auto custom-scrollbar">
                    {mainTab === 'STOCK' && (
                        <>
                            <TabButton label="Materiales" active={subTab === 'MATERIALS'} onClick={() => setSubTab('MATERIALS')} level="SUB" />
                            <TabButton label="Almacenes y Ubicaciones" active={subTab === 'WAREHOUSES'} onClick={() => setSubTab('WAREHOUSES')} level="SUB" />
                            <TabButton label="Importación Masiva" active={subTab === 'IMPORT'} onClick={() => setSubTab('IMPORT')} level="SUB" />
                        </>
                    )}
                    {mainTab === 'MAINTENANCE' && (
                        <>
                            <TabButton label="Activos (Equipos)" active={subTab === 'ASSETS'} onClick={() => setSubTab('ASSETS')} level="SUB" />
                            <TabButton label="Planes Preventivos" active={subTab === 'ROUTINES'} onClick={() => setSubTab('ROUTINES')} level="SUB" />
                            <TabButton label="Modelos Checklist" active={subTab === 'CHECKLISTS'} onClick={() => setSubTab('CHECKLISTS')} level="SUB" />
                        </>
                    )}
                    {mainTab === 'PARTNERS' && (
                        <>
                            <TabButton label="Clientes" active={subTab === 'CLIENTS'} onClick={() => setSubTab('CLIENTS')} level="SUB" />
                            <TabButton label="Proveedores" active={subTab === 'SUPPLIERS'} onClick={() => setSubTab('SUPPLIERS')} level="SUB" />
                        </>
                    )}
                    {mainTab === 'CONFIG' && (
                        <>
                            <TabButton label="Empresa" active={subTab === 'COMPANY'} onClick={() => setSubTab('COMPANY')} level="SUB" />
                            <TabButton label="Áreas" active={subTab === 'AREAS'} onClick={() => setSubTab('AREAS')} level="SUB" />
                            <TabButton label="Numeradores Documentos" active={subTab === 'NUMERATORS'} onClick={() => setSubTab('NUMERATORS')} level="SUB" />
                        </>
                    )}
                </div>

                {/* LEVEL 2 CONTAINER / CONTENT AREA (Light Gray Background to hold the Cards) */}
                <div className="flex-1 overflow-hidden bg-slate-50 p-6">
                    {/* KEY PROP FORCES ANIMATION ON CHANGE */}
                    <div className="h-full animate-in slide-in-from-bottom-4 fade-in duration-500" key={`${mainTab}-${subTab}`}>
                        {mainTab === 'STOCK' && subTab === 'MATERIALS' && <MaterialsView />}
                        {mainTab === 'STOCK' && subTab === 'WAREHOUSES' && <WarehousesView />}
                        {mainTab === 'STOCK' && subTab === 'IMPORT' && <DataImporter />}

                        {mainTab === 'MAINTENANCE' && subTab === 'ASSETS' && <AssetsView />}
                        {mainTab === 'MAINTENANCE' && subTab === 'ROUTINES' && <RoutinesView />}
                        {mainTab === 'MAINTENANCE' && subTab === 'CHECKLISTS' && <ChecklistsView />}

                        {mainTab === 'PARTNERS' && subTab === 'CLIENTS' && <PartnersView type="CLIENT" />}
                        {mainTab === 'PARTNERS' && subTab === 'SUPPLIERS' && <PartnersView type="SUPPLIER" />}

                        {mainTab === 'CONFIG' && subTab === 'COMPANY' && <CompanySettingsView />}
                        {mainTab === 'CONFIG' && subTab === 'AREAS' && <AreasView />}
                        {mainTab === 'CONFIG' && subTab === 'NUMERATORS' && <NumeratorsView />}
                    </div>
                </div>
            </div>
        </div>
    );
};
