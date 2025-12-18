
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  FileText, 
  ShoppingBag, 
  Users, 
  Settings,
  Lock,
  ShoppingCart
} from 'lucide-react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { RFQ, OrderStatus, UserRole, RFQItem } from '../../types';
import { db } from '../../lib/firebase';
import { doc, setDoc, updateDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

// Sub Components
import { NewRFQForm } from './NewRFQForm';
import { RFQManagement } from './RFQManagement';
import { ApprovalTray } from './ApprovalTray';
import { PurchaseOrdersList } from './PurchaseOrdersList';
import { ApprovalSettings } from './ApprovalSettings';
import { PurchaseRequestManager } from './PurchaseRequestManager';

export const ProcurementModule = ({ initialTab }: { initialTab?: string }) => {
    const { getNextId, purchaseRequests } = useMasterData();
    const { userProfile } = useAuth();
    
    // Set active tab based on prop or default
    const [activeTab, setActiveTab] = useState<'REQUESTS' | 'MANAGE_RFQ' | 'APPROVAL' | 'PO_LIST' | 'SETTINGS'>('REQUESTS');
    
    // Calcular Permisos Granulares
    const permissions = useMemo(() => {
        if (!userProfile) return { canView: false, canCreate: false, canApprove: false, canConfig: false, canRequests: false };
        
        const isAdmin = userProfile.role === UserRole.ADMIN;
        const perms = userProfile.permissions || {};

        // Permisos específicos por funcionalidad
        const procLevel = perms['COMMERCIAL_PROCUREMENT'] || 'NONE';
        const configLevel = perms['COMMERCIAL_CONFIG'] || 'NONE';
        const requestsLevel = perms['COMMERCIAL_REQUESTS'] || 'NONE';

        return {
            canView: isAdmin || procLevel !== 'NONE', // Puede ver RFQs/OCs
            canCreate: isAdmin || ['CREATE', 'EDIT', 'ADMIN'].includes(procLevel),
            canEdit: isAdmin || ['EDIT', 'ADMIN'].includes(procLevel),
            canConfig: isAdmin || configLevel !== 'NONE',
            canRequests: isAdmin || requestsLevel !== 'NONE' // Puede ver SolPeds
        };
    }, [userProfile]);

    useEffect(() => {
        if (initialTab === 'APPROVAL') setActiveTab('APPROVAL');
        if (initialTab === 'REQUESTS') setActiveTab('REQUESTS');
        
        // If user has NO access to procurement but HAS access to Requests, force Requests tab
        if (!permissions.canView && permissions.canRequests) {
            setActiveTab('REQUESTS');
        }
    }, [initialTab, permissions]);

    const [rfqs, setRfqs] = useState<RFQ[]>([]); 
    const [showNewForm, setShowNewForm] = useState(false);
    const [draftToEdit, setDraftToEdit] = useState<RFQ | undefined>(undefined);
    // New: Handle RFQ creation from SolPeds
    const [rfqFromRequests, setRfqFromRequests] = useState<{items: RFQItem[]} | undefined>(undefined);


    // FETCH RFQs FROM DB
    useEffect(() => {
        if (!permissions.canView) return; // Don't fetch sensitive data if not allowed
        const q = query(collection(db, 'rfqs'));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({id: d.id, ...d.data()} as RFQ));
            // Sort by date desc
            setRfqs(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        });
        return () => unsub();
    }, [permissions.canView]);

    // Derived counts
    const pendingApprovals = rfqs.filter(r => r.status === OrderStatus.PENDING_APPROVAL).length;
    const pendingRequests = purchaseRequests.filter(r => r.status === 'Pendiente').length;
    
    // Filtro estricto para RFQs activas: Borrador, Enviado, Cotizado.
    const activeRfqs = rfqs.filter(r => [OrderStatus.DRAFT, OrderStatus.SENT, OrderStatus.QUOTED].includes(r.status)).length;

    const handleCreateRFQ = async (newRfq: RFQ) => {
        try {
            await setDoc(doc(db, 'rfqs', newRfq.id), newRfq);
            setShowNewForm(false);
            setDraftToEdit(undefined);
            setRfqFromRequests(undefined);
        } catch (e) {
            console.error(e);
            alert("Error al guardar RFQ");
        }
    };

    const handleEditDraft = (rfq: RFQ) => {
        setDraftToEdit(rfq);
        setShowNewForm(true);
    };

    const handleCreateFromRequests = (items: RFQItem[]) => {
        setRfqFromRequests({ items });
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
        // Can be initialized with a draft OR with items from Requests
        return <NewRFQForm initialData={draftToEdit || rfqFromRequests} onSave={handleCreateRFQ} onCancel={() => { setShowNewForm(false); setDraftToEdit(undefined); setRfqFromRequests(undefined); }} />;
    }

    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col overflow-hidden">
             <div className="flex justify-between items-center shrink-0 px-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {permissions.canView ? 'Gestión de Compras' : 'Solicitudes de Pedido'}
                    </h2>
                    <p className="text-slate-500 text-sm">Administración integral del abastecimiento.</p>
                </div>
             </div>

             {/* Dashboard Navigation Cards - Added padding to avoid sticking to sidebar */}
             <div className="px-6 grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
                 {/* REQUESTS CARD - Visible to Requestors and Buyers */}
                 {permissions.canRequests && (
                     <button onClick={() => setActiveTab('REQUESTS')} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'REQUESTS' ? 'bg-white border-orange-500 shadow-md ring-1 ring-orange-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <div className="relative">
                            <ShoppingCart size={24} className={`mb-2 ${activeTab === 'REQUESTS' ? 'text-orange-500' : 'text-slate-400'}`} />
                            {pendingRequests > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{pendingRequests}</span>}
                        </div>
                        <span className="font-semibold text-slate-700 text-sm md:text-base">Solicitudes</span>
                     </button>
                 )}

                 {/* MANAGE RFQ - Buyers Only */}
                 {permissions.canView && (
                     <button onClick={() => setActiveTab('MANAGE_RFQ')} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'MANAGE_RFQ' ? 'bg-white border-accent shadow-md ring-1 ring-accent' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <FileText size={24} className={`mb-2 ${activeTab === 'MANAGE_RFQ' ? 'text-accent' : 'text-slate-400'}`} />
                        <span className="font-semibold text-slate-700 text-sm md:text-base">Seguimiento</span>
                        <span className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{activeRfqs} activas</span>
                     </button>
                 )}
                 
                 {/* APPROVAL - Buyers Only */}
                 {permissions.canView && (
                     <button onClick={() => setActiveTab('APPROVAL')} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'APPROVAL' ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <div className="relative">
                            <Users size={24} className={`mb-2 ${activeTab === 'APPROVAL' ? 'text-blue-500' : 'text-slate-400'}`} />
                            {pendingApprovals > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{pendingApprovals}</span>}
                        </div>
                        <span className="font-semibold text-slate-700 text-sm md:text-base">Aprobaciones</span>
                     </button>
                 )}

                 {/* PO LIST - Buyers Only */}
                 {permissions.canView && (
                     <button onClick={() => setActiveTab('PO_LIST')} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'PO_LIST' ? 'bg-white border-green-500 shadow-md ring-1 ring-green-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <ShoppingBag size={24} className={`mb-2 ${activeTab === 'PO_LIST' ? 'text-green-500' : 'text-slate-400'}`} />
                        <span className="font-semibold text-slate-700 text-sm md:text-base">Ordenes de Compra</span>
                     </button>
                 )}

                 {/* SETTINGS - Config Only */}
                 {permissions.canConfig && (
                     <button onClick={() => setActiveTab('SETTINGS')} className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${activeTab === 'SETTINGS' ? 'bg-white border-slate-800 shadow-md ring-1 ring-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <Settings size={24} className={`mb-2 ${activeTab === 'SETTINGS' ? 'text-slate-800' : 'text-slate-400'}`} />
                        <span className="font-semibold text-slate-700 text-sm md:text-base">Configuración</span>
                     </button>
                 )}
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar pb-10 px-6">
                {activeTab === 'REQUESTS' && permissions.canRequests && <PurchaseRequestManager onCreateRFQ={handleCreateFromRequests} />}
                {activeTab === 'MANAGE_RFQ' && permissions.canView && <RFQManagement rfqs={rfqs} onUpdate={handleUpdateRFQ} onEditDraft={handleEditDraft} onSplitAdjudicate={handleSplitAdjudicate} />}
                {activeTab === 'APPROVAL' && permissions.canView && <ApprovalTray rfqs={rfqs} onApprove={handleApprove} onRevert={handleRevert} />}
                {activeTab === 'PO_LIST' && permissions.canView && <PurchaseOrdersList rfqs={rfqs} />}
                {activeTab === 'SETTINGS' && permissions.canConfig && <ApprovalSettings />}
             </div>
        </div>
    );
};
