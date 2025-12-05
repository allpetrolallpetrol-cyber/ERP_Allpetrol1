
import React from 'react';
import { Undo2, CheckCircle } from 'lucide-react';
import { RFQ, OrderStatus } from '../../types';

export const ApprovalTray = ({ rfqs, onApprove, onRevert }: { rfqs: RFQ[], onApprove: (rfq: RFQ) => void, onRevert: (rfq: RFQ) => void }) => {
    return (
        <div className="space-y-4">
            {rfqs.filter(r => r.status === OrderStatus.PENDING_APPROVAL).map(rfq => {
                const winner = rfq.quotes.find(q => q.isSelected);
                return (
                    <div key={rfq.id} className="bg-white p-6 rounded-xl border-l-4 border-orange-500 shadow-sm">
                        <div className="flex justify-between mb-4">
                            <div>
                                <h4 className="font-bold text-lg">{rfq.number}</h4>
                                <p className="text-xs text-slate-500 mt-1">Items adjudicados: {rfq.items.length}</p>
                            </div>
                            <span className="text-orange-600 font-bold text-sm bg-orange-50 px-2 py-1 rounded h-fit">Pendiente Aprobación</span>
                        </div>
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-sm text-slate-500">Proveedor Adjudicado:</p>
                                <p className="font-bold text-slate-800">{winner?.supplierName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-slate-900">${winner?.price.toLocaleString()}</p>
                            </div>
                        </div>
                        
                        {/* Items Preview */}
                        <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-4 max-h-32 overflow-y-auto">
                            <ul className="list-disc pl-4 space-y-1">
                                {rfq.items.map(item => (
                                    <li key={item.materialId}>{item.description} (x{item.quantity})</li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                             <button onClick={() => onRevert(rfq)} className="text-slate-500 hover:bg-slate-100 px-3 py-2 rounded text-sm font-medium flex items-center"><Undo2 size={16} className="mr-2"/> Reversar</button>
                             <button onClick={() => onApprove(rfq)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-bold flex items-center"><CheckCircle size={16} className="mr-2"/> Aprobar y Generar OC</button>
                        </div>
                    </div>
                )
            })}
             {rfqs.filter(r => r.status === OrderStatus.PENDING_APPROVAL).length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                    No hay aprobaciones pendientes.
                </div>
             )}
        </div>
    );
};
