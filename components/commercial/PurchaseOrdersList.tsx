
import React, { useState, useMemo } from 'react';
import { RFQ, OrderStatus } from '../../types';
import { Eye, Printer, X, Building2, Calendar, FileText, Download, Search } from 'lucide-react';
import { jsPDF } from 'jspdf';

// --- PDF Generation Logic ---
const generatePurchaseOrderPDF = (po: RFQ, supplierName: string, total: number) => {
    const doc = new jsPDF();
    const winnerQuote = po.quotes.find(q => q.isSelected);

    // --- Header / Membrete ---
    doc.setFillColor(30, 41, 59); // Slate 900
    doc.rect(0, 0, 210, 40, 'F');
    
    // Logo / Company Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("ArgERP Industrial S.A.", 15, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Av. Corrientes 1234, CABA, Argentina", 15, 28);
    doc.text("CUIT: 30-11223344-5 | IVA Responsable Inscripto", 15, 33);

    // PO Number Box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(140, 10, 55, 20, 2, 2, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text("ORDEN DE COMPRA", 167.5, 16, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(po.number, 167.5, 24, { align: "center" });

    // --- Supplier Info ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    let y = 55;
    
    // Left side: Supplier
    doc.setFont("helvetica", "bold");
    doc.text("PROVEEDOR:", 15, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.setFontSize(12);
    doc.text(supplierName, 15, y);
    y += 6;
    doc.setFontSize(10);
    // Placeholder info if not in object
    doc.text(`Ref. Cotización: ${winnerQuote?.quoteReference || 'S/N'}`, 15, y); 

    // Right side: Dates & Conditions (Fixed Layout with spacing)
    y = 55;
    
    // Line 1: Date
    doc.setFont("helvetica", "bold");
    doc.text("FECHA EMISIÓN:", 135, y);
    doc.setFont("helvetica", "normal");
    doc.text(po.date, 195, y, { align: "right" });
    
    y += 8; 
    
    // Line 2: Payment Terms
    doc.setFont("helvetica", "bold");
    doc.text("CONDICIÓN PAGO:", 135, y);
    doc.setFont("helvetica", "normal");
    doc.text("30 Días FF", 195, y, { align: "right" }); 

    y += 8;

    // Line 3: Origin Reference (THE REQUESTED FIELD)
    doc.setFont("helvetica", "bold");
    doc.text("REF. PETICIÓN:", 135, y);
    doc.setFont("helvetica", "normal");
    const refText = po.relatedRfqNumber || 'N/A';
    doc.text(refText, 195, y, { align: "right" });

    // --- Items Table ---
    y = 90; // Start table lower to clear header info
    
    // Table Header
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(15, y, 180, 10, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPCIÓN", 20, y + 7);
    doc.text("CANT.", 130, y + 7, { align: "center" });
    doc.text("P. UNIT", 155, y + 7, { align: "right" });
    doc.text("TOTAL", 190, y + 7, { align: "right" });

    y += 18;
    doc.setFont("helvetica", "normal");

    po.items.forEach((item) => {
        // Find price in winner quote
        const quoteItem = winnerQuote?.items?.find(qi => qi.materialId === item.materialId);
        const unitPrice = quoteItem ? quoteItem.unitPrice : 0;
        const lineTotal = unitPrice * item.quantity;

        // Draw Row
        doc.text(item.description, 20, y);
        doc.text(item.quantity.toString(), 130, y, { align: "center" });
        doc.text(`$${unitPrice.toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 155, y, { align: "right" });
        doc.text(`$${lineTotal.toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 190, y, { align: "right" });
        
        y += 8;
        
        // Page break check (simple)
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });

    // --- Totals ---
    y += 10;
    doc.line(130, y, 195, y);
    y += 8;
    
    doc.setFont("helvetica", "bold");
    doc.text("SUBTOTAL:", 155, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`$${total.toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 190, y, { align: "right" });
    
    y += 6;
    const tax = total * 0.21; // Example 21% IVA
    doc.setFont("helvetica", "bold");
    doc.text("IVA (21%):", 155, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`$${tax.toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 190, y, { align: "right" });

    y += 8;
    doc.setFillColor(30, 41, 59);
    doc.rect(130, y - 5, 65, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL:", 155, y + 2, { align: "right" });
    doc.text(`$${(total + tax).toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 190, y + 2, { align: "right" });

    // --- Footer / Signatures ---
    doc.setTextColor(0, 0, 0);
    y = 250;
    doc.setLineWidth(0.5);
    doc.line(20, y, 80, y);
    doc.line(130, y, 190, y);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Autorizado Por", 50, y + 5, { align: "center" });
    doc.text("Recibí Conforme (Proveedor)", 160, y + 5, { align: "center" });

    doc.save(`OC-${po.number}.pdf`);
};

const PurchaseOrderDetailModal = ({ po, onClose }: { po: RFQ, onClose: () => void }) => {
    const winner = po.quotes.find(q => q.isSelected);
    const supplierName = winner?.supplierName || 'Proveedor Desconocido';
    const totalAmount = winner?.price || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                {/* Header Modal */}
                <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-start">
                    <div className="flex items-start gap-4">
                        <div className="bg-green-100 p-3 rounded-xl border border-green-200">
                            <FileText size={32} className="text-green-700" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800">{po.number}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase">Emitida</span>
                                <span className="text-slate-500 text-sm flex items-center">
                                    <Calendar size={14} className="mr-1"/> {po.date}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    {/* Supplier Info Block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="border border-slate-200 rounded-xl p-5 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center"><Building2 size={14} className="mr-1"/> Datos del Proveedor</h4>
                            <p className="text-lg font-bold text-slate-800 mb-1">{supplierName}</p>
                            <p className="text-sm text-slate-500">Referencia Cotización: <span className="font-mono bg-slate-100 px-1 rounded">{winner?.quoteReference || '-'}</span></p>
                        </div>
                        <div className="border border-slate-200 rounded-xl p-5 shadow-sm bg-slate-50/50 flex flex-col justify-center items-end text-right">
                             <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Monto Total Orden</h4>
                             <p className="text-3xl font-bold text-slate-900">${totalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2})}</p>
                             <p className="text-xs text-slate-500">+ IVA (Estimado)</p>
                        </div>
                    </div>

                    {/* Reference Info */}
                    <div className="mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center">
                        <p className="text-sm text-blue-800">
                            <span className="font-bold mr-2">Referencia de Origen (Petición):</span> 
                            {po.relatedRfqNumber ? po.relatedRfqNumber : <span className="italic opacity-70">No especificada</span>}
                        </p>
                    </div>

                    {/* Items Table */}
                    <h4 className="text-sm font-bold text-slate-700 mb-4">Detalle de Ítems</h4>
                    <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Descripción</th>
                                    <th className="px-4 py-3 text-center">Cantidad</th>
                                    <th className="px-4 py-3 text-right">Precio Unit.</th>
                                    <th className="px-4 py-3 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {po.items.map((item, idx) => {
                                    const quoteItem = winner?.items?.find(qi => qi.materialId === item.materialId);
                                    const unitPrice = quoteItem ? quoteItem.unitPrice : 0;
                                    const subtotal = unitPrice * item.quantity;
                                    
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-700">{item.description}</td>
                                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-600">${unitPrice.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-800">${subtotal.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-200">
                                <tr>
                                    <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-600">Total Neto:</td>
                                    <td className="px-4 py-3 text-right font-bold text-slate-900">${totalAmount.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">
                        Cerrar
                    </button>
                    <button 
                        onClick={() => generatePurchaseOrderPDF(po, supplierName, totalAmount)}
                        className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-lg shadow-md hover:bg-slate-800 flex items-center transition-transform active:scale-95"
                    >
                        <Download size={18} className="mr-2"/> Descargar PDF Orden de Compra
                    </button>
                </div>
            </div>
        </div>
    );
};

export const PurchaseOrdersList = ({ rfqs }: { rfqs: RFQ[] }) => {
    const [selectedPO, setSelectedPO] = useState<RFQ | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPOs = useMemo(() => {
        return rfqs.filter(r => {
            if (r.status !== OrderStatus.CONVERTED_TO_PO) return false;
            
            const term = searchTerm.toLowerCase();
            const winner = r.quotes.find(q => q.isSelected);
            const supplierName = winner?.supplierName?.toLowerCase() || '';
            const poNumber = r.number?.toLowerCase() || '';

            return poNumber.includes(term) || supplierName.includes(term);
        });
    }, [rfqs, searchTerm]);

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Buscar por Número de Orden o Proveedor..." 
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-accent bg-white shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={20} className="absolute left-3 top-3.5 text-slate-400" />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                            <th className="p-4">Nro OC</th>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Proveedor</th>
                            <th className="p-4 text-right">Total</th>
                            <th className="p-4 text-center">Estado</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredPOs.map(po => {
                            const winner = po.quotes.find(q => q.isSelected);
                            return (
                                <tr key={po.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedPO(po)}>
                                    <td className="p-4 font-bold text-slate-800">{po.number}</td>
                                    <td className="p-4 text-slate-500">{po.date}</td>
                                    <td className="p-4 font-medium text-slate-700">{winner?.supplierName}</td>
                                    <td className="p-4 text-right font-bold text-slate-900">${winner?.price.toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        <span className="bg-green-100 text-green-700 border border-green-200 text-xs px-2 py-0.5 rounded-full font-bold">Emitida</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedPO(po); }}
                                            className="text-slate-400 hover:text-accent p-1 transition-colors"
                                            title="Ver Detalle"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredPOs.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">No se encontraron órdenes de compra.</td></tr>
                        )}
                    </tbody>
                 </table>
            </div>

            {selectedPO && (
                <PurchaseOrderDetailModal po={selectedPO} onClose={() => setSelectedPO(null)} />
            )}
        </div>
    );
};
