
import React, { useState } from 'react';
import { MaterialsView } from './master-data/MaterialsView';
import { AssetsView } from './master-data/AssetsView';
import { RoutinesView } from './master-data/RoutinesView';
import { ChecklistsView } from './master-data/ChecklistsView';
import { PartnersView } from './master-data/PartnersView';
import { AreasView } from './master-data/AreasView';
import { WarehousesView } from './master-data/WarehousesView';
import { DataImporter } from './master-data/DataImporter';
import { NumeratorsView } from './master-data/NumeratorsView';
import { CompanySettingsView } from './master-data/CompanySettingsView';
import { RegionsView } from './master-data/RegionsView';
import { ContractsView } from './master-data/ContractsView';

type MainTab = 'STOCK' | 'MAINTENANCE' | 'PARTNERS' | 'CONFIG';

export const MasterData = () => {
    const [mainTab, setMainTab] = useState<MainTab>('STOCK');
    const [subTab, setSubTab] = useState<string>('MATERIALS');

    const handleMainTabChange = (tab: MainTab) => {
        setMainTab(tab);
        if (tab === 'STOCK') setSubTab('MATERIALS');
        if (tab === 'MAINTENANCE') setSubTab('ASSETS');
        if (tab === 'PARTNERS') setSubTab('CLIENTS');
        if (tab === 'CONFIG') setSubTab('COMPANY');
    };

    const TabButton = ({ label, active, onClick, level = 'MAIN' }: { label: string, active: boolean, onClick: () => void, level?: 'MAIN' | 'SUB' }) => {
        const isMain = level === 'MAIN';
        const mainActive = "bg-white text-slate-900 border-slate-300 border-b-white z-20 py-4 shadow-sm";
        const mainInactive = "bg-slate-200/50 text-slate-500 border-transparent border-b-slate-300 hover:bg-slate-200 py-3";
        const subActive = "bg-slate-50 text-slate-800 border-slate-200 border-b-slate-50 z-20 py-2.5 font-bold";
        const subInactive = "bg-white text-slate-400 border-transparent border-b-slate-200 hover:bg-slate-50 py-2.5 font-medium";

        return (
            <button onClick={onClick} className={`relative transition-all duration-200 border-t border-x rounded-t-xl whitespace-nowrap ${isMain ? 'px-6 text-sm font-bold' : 'px-5 text-xs'} ${active ? (isMain ? mainActive : subActive) : (isMain ? mainInactive : subInactive)} -mb-px`}>
                {label}
                {active && <div className={`absolute bottom-[-1px] left-0 right-0 h-1 ${isMain ? 'bg-white' : 'bg-slate-50'}`}></div>}
            </button>
        );
    };

    return (
        <div className="h-full flex flex-col bg-slate-100 overflow-hidden">
            <div className="px-4 md:px-6 pt-4 flex items-end gap-1 border-b border-slate-300 bg-slate-100 shrink-0 overflow-x-auto no-scrollbar scroll-smooth">
                <TabButton label="Artículos y Stock" active={mainTab === 'STOCK'} onClick={() => handleMainTabChange('STOCK')} level="MAIN" />
                <TabButton label="Activos y Mantenimiento" active={mainTab === 'MAINTENANCE'} onClick={() => handleMainTabChange('MAINTENANCE')} level="MAIN" />
                <TabButton label="Interlocutores" active={mainTab === 'PARTNERS'} onClick={() => handleMainTabChange('PARTNERS')} level="MAIN" />
                <TabButton label="Configuración" active={mainTab === 'CONFIG'} onClick={() => handleMainTabChange('CONFIG')} level="MAIN" />
            </div>

            <div className="flex-1 flex flex-col bg-white overflow-hidden shadow-sm relative z-10">
                <div className="px-4 md:px-6 pt-3 flex items-end gap-1 border-b border-slate-200 bg-white shrink-0 overflow-x-auto no-scrollbar scroll-smooth">
                    {mainTab === 'STOCK' && (
                        <>
                            <TabButton label="Materiales" active={subTab === 'MATERIALS'} onClick={() => setSubTab('MATERIALS')} level="SUB" />
                            <TabButton label="Contratos Marco" active={subTab === 'CONTRACTS'} onClick={() => setSubTab('CONTRACTS')} level="SUB" />
                            <TabButton label="Almacenes" active={subTab === 'WAREHOUSES'} onClick={() => setSubTab('WAREHOUSES')} level="SUB" />
                            <TabButton label="Importación" active={subTab === 'IMPORT'} onClick={() => setSubTab('IMPORT')} level="SUB" />
                        </>
                    )}
                    {mainTab === 'MAINTENANCE' && (
                        <>
                            <TabButton label="Activos" active={subTab === 'ASSETS'} onClick={() => setSubTab('ASSETS')} level="SUB" />
                            <TabButton label="Preventivos" active={subTab === 'ROUTINES'} onClick={() => setSubTab('ROUTINES')} level="SUB" />
                            <TabButton label="Checklists" active={subTab === 'CHECKLISTS'} onClick={() => setSubTab('CHECKLISTS')} level="SUB" />
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
                            <TabButton label="Regiones" active={subTab === 'REGIONS'} onClick={() => setSubTab('REGIONS')} level="SUB" />
                            <TabButton label="Numeradores" active={subTab === 'NUMERATORS'} onClick={() => setSubTab('NUMERATORS')} level="SUB" />
                        </>
                    )}
                </div>

                <div className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6 custom-scrollbar">
                    <div className="h-full min-h-fit animate-in slide-in-from-bottom-2 fade-in" key={`${mainTab}-${subTab}`}>
                        {mainTab === 'STOCK' && subTab === 'MATERIALS' && <MaterialsView />}
                        {mainTab === 'STOCK' && subTab === 'CONTRACTS' && <ContractsView />}
                        {mainTab === 'STOCK' && subTab === 'WAREHOUSES' && <WarehousesView />}
                        {mainTab === 'STOCK' && subTab === 'IMPORT' && <DataImporter />}
                        {mainTab === 'MAINTENANCE' && subTab === 'ASSETS' && <AssetsView />}
                        {mainTab === 'MAINTENANCE' && subTab === 'ROUTINES' && <RoutinesView />}
                        {mainTab === 'MAINTENANCE' && subTab === 'CHECKLISTS' && <ChecklistsView />}
                        {mainTab === 'PARTNERS' && subTab === 'CLIENTS' && <PartnersView type="CLIENT" />}
                        {mainTab === 'PARTNERS' && subTab === 'SUPPLIERS' && <PartnersView type="SUPPLIER" />}
                        {mainTab === 'CONFIG' && subTab === 'COMPANY' && <CompanySettingsView />}
                        {mainTab === 'CONFIG' && subTab === 'AREAS' && <AreasView />}
                        {mainTab === 'CONFIG' && subTab === 'REGIONS' && <RegionsView />}
                        {mainTab === 'CONFIG' && subTab === 'NUMERATORS' && <NumeratorsView />}
                    </div>
                </div>
            </div>
        </div>
    );
};
