
import React from 'react';
import { Undo2, CheckCircle, Zap, FileText } from 'lucide-react';
import { RFQ, OrderStatus } from '../../types';

export const ApprovalTray = ({ rfqs, onApprove, onRevert }: { rfqs: RFQ[], onApprove: (rfq: RFQ) => void, onRevert: (rfq: RFQ) => void }) => {
    const pendingList = rfqs.filter(r => r.status === OrderStatus.PENDING_APPROVAL);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                {pendingList.map(rfq => {
                    const winner = rfq.quotes.find(q => q.isSelected);
                    const isContract = rfq.origin === 'CONTRACT';

                    return (
                        <div key={rfq.id} className="bg-white p-6 rounded-xl border-l-4 border-orange-50 shadow-sm relative overflow-hidden group">
                            <div className={`absolute top-0 left-0 w-1 h-full ${isContract ? 'bg-amber-400' : 'bg-orange-500'}`}></div>
                            
                            <div className="flex justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-lg">{rfq.number}</h4>
                                        {isContract && (
                                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 flex items-center">
                                                <Zap size={10} className="mr-1"/> CONTRATO DIRECTO
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Solicitud de Compra • {rfq.date}</p>
                                </div>
                                <span className="text-orange-600 font-bold text-xs bg-orange-50 px-2.5 py-1 rounded-full h-fit border border-orange-100">Pendiente Aprobación</span>
                            </div>

                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Proveedor Adjudicado</p>
                                    <p className="font-bold text-slate-800 text-lg">{winner?.supplierName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-slate-900">${winner?.price.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Monto Neto</p>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-4 max-h-32 overflow-y-auto no-scrollbar border border-slate-100">
                                <ul className="space-y-1">
                                    {rfq.items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between items-center">
                                            <span className="truncate flex-1 mr-4">• {item.description}</span>
                                            <span className="font-mono text-xs font-bold text-slate-400 shrink-0">x{item.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                                <button onClick={() => onRevert(rfq)} className="text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-colors">
                                    <Undo2 size={16} className="mr-2"/> Reversar
                                </button>
                                <button onClick={() => onApprove(rfq)} className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-black text-sm font-bold flex items-center shadow-md transition-all transform active:scale-95">
                                    <CheckCircle size={16} className="mr-2"/> Aprobar y Generar OC
                                </button>
                            </div>
                        </div>
                    )
                })}
                {pendingList.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100 text-slate-400">
                        <FileText className="mx-auto mb-4 opacity-20" size={48}/>
                        <p className="font-medium italic">No hay aprobaciones pendientes en su bandeja.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
