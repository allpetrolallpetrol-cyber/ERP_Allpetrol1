
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  FileText, 
  ShoppingBag, 
  Users, 
  Settings,
  Lock
} from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { RFQ, OrderStatus, UserRole } from '../../types';
import { db } from '../../lib/firebase';
import { doc, setDoc, updateDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

// Sub Components
import { NewRFQForm } from './NewRFQForm';
import { RFQManagement } from './RFQManagement';
import { ApprovalTray } from './ApprovalTray';
import { PurchaseOrdersList } from './PurchaseOrdersList';
import { ApprovalSettings } from './ApprovalSettings';

export const ProcurementModule = ({ initialTab }: { initialTab?: string }) => {
    const { getNextId } = useMasterData();
    const { userProfile } = useAuth();
    
    // Set active tab based on prop or default
    const [activeTab, setActiveTab] = useState<'MANAGE_RFQ' | 'APPROVAL' | 'PO_LIST' | 'SETTINGS'>('MANAGE_RFQ');
    
    useEffect(() => {
        if (initialTab === 'APPROVAL') setActiveTab('APPROVAL');
    }, [initialTab]);

    const [rfqs, setRfqs] = useState<RFQ[]>([]); 
    const [showNewForm, setShowNewForm] = useState(false);
    const [draftToEdit, setDraftToEdit] = useState<RFQ | undefined>(undefined);

    // Calcular Permisos Granulares
    const permissions = useMemo(() => {
        if (!userProfile) return { canView: false, canCreate: false, canApprove: false, canConfig: false };
        
        const isAdmin = userProfile.role === UserRole.ADMIN;
        const perms = userProfile.permissions || {};

        // Permisos específicos por funcionalidad
        const procLevel = perms['COMMERCIAL_PROCUREMENT'] || 'NONE';
        const configLevel = perms['COMMERCIAL_CONFIG'] || 'NONE';

        return {
            canView: isAdmin || procLevel !== 'NONE',
            canCreate: isAdmin || ['CREATE', 'EDIT', 'ADMIN'].includes(procLevel),
            canEdit: isAdmin || ['EDIT', 'ADMIN'].includes(procLevel),
            // Configuración habilitada si tiene cualquier permiso > NONE en COMMERCIAL_CONFIG
            canConfig: isAdmin || configLevel !== 'NONE'
        };
    }, [userProfile]);


    // FETCH RFQs FROM DB
    useEffect(() => {
        const q = query(collection(db, 'rfqs'));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()} as RFQ));
            // Sort by date desc
            setRfqs(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        });
        return () => unsub();
    }, []);

    // Derived counts
    const pendingApprovals = rfqs.filter(r => r.status === OrderStatus.PENDING_APPROVAL).length;
    
    // Filtro estricto para RFQs activas: Borrador, Enviado, Cotizado.
    const activeRfqs = rfqs.filter(r => [OrderStatus.DRAFT, OrderStatus.SENT, OrderStatus.QUOTED].includes(r.status)).length;

    const handleCreateRFQ = async (newRfq: RFQ) => {
        try {
            await setDoc(doc(db, 'rfqs', newRfq.id), newRfq);
            setShowNewForm(false);
            setDraftToEdit(undefined);
        } catch (e) {
            console.error(e);
            alert("Error al guardar RFQ");
        }
    };

    const handleEditDraft = (rfq: RFQ) => {
        setDraftToEdit(rfq);
        setShowNewForm(true);
    };

    const handleUpdateRFQ = async (updatedRfq: RFQ) => {
        await updateDoc(doc(db, 'rfqs', updatedRfq.id), { ...updatedRfq });
    };

    const handleSplitAdjudicate = async (originalRfq: RFQ, supplierId: string, itemIds: string[], amount: number) => {
        const adjudicatedItems = originalRfq.items.filter(i => itemIds.includes(i.materialId));
        
        // Generate new ID for the Purchase Order from context
        const poNumber = await getNextId('PURCHASE_ORDER');

        const newOrder: RFQ = {
            ...originalRfq,
            id: `PO-REQ-${Date.now()}`, 
            number: poNumber, // Assign official PO number here
            relatedRfqNumber: originalRfq.number, // GUARDAR REFERENCIA ORIGINAL
            items: adjudicatedItems,
            quotes: originalRfq.quotes.map(q => {
                 if(q.supplierId === supplierId) {
                     return { ...q, isSelected: true, price: amount }; 
                 }
                 return { ...q, isSelected: false };
            }),
            winnerSupplierId: supplierId,
            status: OrderStatus.PENDING_APPROVAL,
            selectedSuppliers: originalRfq.selectedSuppliers.filter(s => s.id === supplierId) 
        };

        // 2. Update the Original RFQ (Remove adjudicated items)
        const remainingItems = originalRfq.items.filter(i => !itemIds.includes(i.materialId));
        
        // Save New Order (The PO to be approved)
        await setDoc(doc(db, 'rfqs', newOrder.id), newOrder);

        if (remainingItems.length > 0) {
            // Still has items, just update content
            await updateDoc(doc(db, 'rfqs', originalRfq.id), { items: remainingItems });
        } else {
            // Fully consumed -> Change status to CLOSED so it leaves the tracking list
            await updateDoc(doc(db, 'rfqs', originalRfq.id), { items: [], status: OrderStatus.CLOSED });
        }

        alert(`Items adjudicados correctamente. Se generó la orden ${poNumber} pendiente de aprobación. La RFQ original ha sido actualizada.`);
    };
    
    // Approval Handlers
    const handleApprove = async (rfq: RFQ) => {
        // Al aprobar, generamos un número de OC oficial (si no tuviera) y guardamos la referencia
        const newPoNumber = rfq.number || await getNextId('PURCHASE_ORDER');

        const approved = { 
            ...rfq, 
            number: newPoNumber, 
            status: OrderStatus.CONVERTED_TO_PO 
        };

        await updateDoc(doc(db, 'rfqs', rfq.id), approved);
        alert(`Orden de Compra ${newPoNumber} generada y aprobada correctamente.`);
    };

    const handleRevert = async (rfq: RFQ) => {
         const reverted = { 
             ...rfq, 
             status: OrderStatus.QUOTED, 
             winnerSupplierId: undefined, 
             quotes: rfq.quotes.map(q => ({...q, isSelected: false})) 
         };
         await updateDoc(doc(db, 'rfqs', rfq.id), reverted);
    };

    if(showNewForm) {
        return <NewRFQForm initialData={draftToEdit} onSave={handleCreateRFQ} onCancel={() => { setShowNewForm(false); setDraftToEdit(undefined); }} />;
    }

    return (
        <div className="space-y-6 animate-in fade-in">
             <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gestión de Compras</h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Permisos: 
                        <span className={`ml-1 font-bold uppercase ${permissions.canCreate ? 'text-green-600' : 'text-slate-400'}`}>
                            {permissions.canCreate ? 'Operador' : 'Lectura'}
                        </span>
                        {permissions.canConfig && <span className="ml-2 text-slate-300">|</span>}
                        {permissions.canConfig && <span className="ml-2 font-bold uppercase text-purple-600">Configuración</span>}
                    </p>
                </div>
                
                {/* BUTTON PROTECTED: Only visible if CREATE, EDIT or ADMIN */}
                {permissions.canCreate && (
                    <button 
                        onClick={() => setShowNewForm(true)} 
                        className="bg-accent text-white px-4 py-2 rounded-lg font-medium shadow-md hover:bg-blue-600 flex items-center"
                    >
                        <Plus size={18} className="mr-2"/> Crear Petición (RFQ)
                    </button>
                )}
             </div>

             {/* Dashboard Navigation Cards */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <button onClick={() => setActiveTab('MANAGE_RFQ')} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'MANAGE_RFQ' ? 'bg-white border-accent shadow-md ring-1 ring-accent' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <FileText size={24} className={`mb-2 ${activeTab === 'MANAGE_RFQ' ? 'text-accent' : 'text-slate-400'}`} />
                    <span className="font-semibold text-slate-700">Seguimiento</span>
                    <span className="text-xs text-slate-500 mt-1">{activeRfqs} activas</span>
                 </button>
                 
                 <button onClick={() => setActiveTab('APPROVAL')} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'APPROVAL' ? 'bg-white border-orange-500 shadow-md ring-1 ring-orange-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <div className="relative">
                        <Users size={24} className={`mb-2 ${activeTab === 'APPROVAL' ? 'text-orange-500' : 'text-slate-400'}`} />
                        {pendingApprovals > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{pendingApprovals}</span>}
                    </div>
                    <span className="font-semibold text-slate-700">Aprobaciones</span>
                 </button>

                 <button onClick={() => setActiveTab('PO_LIST')} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'PO_LIST' ? 'bg-white border-green-500 shadow-md ring-1 ring-green-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <ShoppingBag size={24} className={`mb-2 ${activeTab === 'PO_LIST' ? 'text-green-500' : 'text-slate-400'}`} />
                    <span className="font-semibold text-slate-700">Órdenes de Compra</span>
                 </button>

                 {/* TAB PROTECTED: Visible if COMMERCIAL_CONFIG != NONE */}
                 {permissions.canConfig ? (
                     <button onClick={() => setActiveTab('SETTINGS')} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'SETTINGS' ? 'bg-white border-slate-800 shadow-md ring-1 ring-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <Settings size={24} className={`mb-2 ${activeTab === 'SETTINGS' ? 'text-slate-800' : 'text-slate-400'}`} />
                        <span className="font-semibold text-slate-700">Configuración</span>
                     </button>
                 ) : (
                     <div className="p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center bg-slate-50 opacity-60 cursor-not-allowed grayscale" title="Requiere permisos de Configuración Comercial">
                        <Lock size={24} className="mb-2 text-slate-300" />
                        <span className="font-semibold text-slate-400">Configuración</span>
                     </div>
                 )}
             </div>

             <div className="min-h-[400px]">
                {activeTab === 'MANAGE_RFQ' && <RFQManagement rfqs={rfqs} onUpdate={handleUpdateRFQ} onEditDraft={handleEditDraft} onSplitAdjudicate={handleSplitAdjudicate} />}
                {activeTab === 'APPROVAL' && <ApprovalTray rfqs={rfqs} onApprove={handleApprove} onRevert={handleRevert} />}
                {activeTab === 'PO_LIST' && <PurchaseOrdersList rfqs={rfqs} />}
                {activeTab === 'SETTINGS' && permissions.canConfig && <ApprovalSettings />}
             </div>
        </div>
    );
};
