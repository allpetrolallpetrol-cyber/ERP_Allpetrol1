
import React, { useState, useMemo } from 'react';
import { RFQ, OrderStatus, CompanySettings } from '../../types';
// Add ShoppingBag to the imported lucide-react icons
import { Eye, Printer, X, Building2, Calendar, FileText, Download, Search, Package, ShoppingBag } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useMasterData } from '../../contexts/MasterDataContext';

// --- Helper to load image for PDF ---
const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
    });
};

// --- PDF Generation Logic ---
const generatePurchaseOrderPDF = async (po: RFQ, supplierName: string, total: number, companySettings: CompanySettings | null) => {
    const doc = new jsPDF();
    const winnerQuote = po.quotes.find(q => q.isSelected);

    // --- Header / Membrete ---
    doc.setFillColor(30, 41, 59); // Slate 900
    doc.rect(0, 0, 210, 40, 'F');
    
    // Dynamic Company Data
    const companyName = companySettings?.name || "Empresa No Configurada";
    const companyAddress = companySettings?.address || "Dirección no especificada";
    const companyTax = `CUIT: ${companySettings?.taxId || '-'} | IVA Responsable Inscripto`;
    const contactInfo = `${companySettings?.email || ''} ${companySettings?.phone ? ' | ' + companySettings.phone : ''}`;

    // Logo Logic
    let logoAdded = false;
    if (companySettings?.logoUrl) {
        try {
            // Try to load logo. Note: CORS might block this if the server doesn't allow it.
            // In a real prod env, a proxy or base64 string is safer.
            const img = await loadImage(companySettings.logoUrl);
            // Calculate aspect ratio to fit in a box of 30x30 max
            const ratio = img.width / img.height;
            let w = 25;
            let h = 25 / ratio;
            if (h > 25) { h = 25; w = 25 * ratio; }
            
            doc.addImage(img, 'PNG', 15, 7.5, w, h);
            logoAdded = true;
        } catch (e) {
            console.warn("No se pudo cargar el logo para el PDF", e);
        }
    }

    // Text Positioning (Adjust based on logo presence)
    const textX = logoAdded ? 45 : 15;

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(logoAdded ? 18 : 22);
    doc.setFont("helvetica", "bold");
    doc.text(companyName, textX, 18);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(companyAddress, textX, 26);
    doc.text(companyTax, textX, 31);
    doc.text(contactInfo, textX, 36);

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
    doc.text(`Ref. Cotización: ${winnerQuote?.quoteReference || 'S/N'}`, 15, y); 

    // Right side: Dates & Conditions
    y = 55;
    
    // Line 1: Date
    doc.setFont("helvetica", "bold");
    doc.text("FECHA EMISIÓN:", 135, y);
    doc.setFont("helvetica", "normal");
    doc.text(po.date, 195, y, { align: "right" });
    
    y += 10;
    
    // Line 2: Payment Terms
    doc.setFont("helvetica", "bold");
    doc.text("CONDICIÓN PAGO:", 135, y);
    doc.setFont("helvetica", "normal");
    // Ideally this comes from Supplier Master Data, simplified here
    doc.text("Según Acuerdo Comercial", 195, y, { align: "right" }); 

    y += 10;

    // Line 3: Origin Reference
    doc.setFont("helvetica", "bold");
    doc.text("REF. RFQ / PETICIÓN:", 135, y);
    doc.setFont("helvetica", "normal");
    const refText = po.relatedRfqNumber || 'N/A';
    doc.text(refText, 195, y, { align: "right" });

    // --- Items Table ---
    y = 95;
    
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
        const quoteItem = winnerQuote?.items?.find(qi => qi.materialId === item.materialId);
        const unitPrice = quoteItem ? quoteItem.unitPrice : 0;
        const lineTotal = unitPrice * item.quantity;

        // Auto split text if description is too long
        const splitDesc = doc.splitTextToSize(item.description, 100);
        doc.text(splitDesc, 20, y);
        
        doc.text(item.quantity.toString(), 130, y, { align: "center" });
        doc.text(`$${unitPrice.toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 155, y, { align: "right" });
        doc.text(`$${lineTotal.toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 190, y, { align: "right" });
        
        // Adjust Y based on lines
        y += (splitDesc.length * 5) + 3;
        
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });

    // --- Totals ---
    y += 5;
    doc.line(130, y, 195, y);
    y += 8;
    
    doc.setFont("helvetica", "bold");
    doc.text("SUBTOTAL:", 155, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`$${total.toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 190, y, { align: "right" });
    
    y += 6;
    const tax = total * 0.21;
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

    // --- Footer ---
    doc.setTextColor(0, 0, 0);
    y = 250;
    doc.setLineWidth(0.5);
    doc.line(20, y, 80, y);
    doc.line(130, y, 190, y);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Autorizado Por", 50, y + 5, { align: "center" });
    doc.text("Recibí Conforme (Proveedor)", 160, y + 5, { align: "center" });

    // Footer Branding
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`${companyName} - Generado por PyME ERP`, 105, 290, { align: "center" });

    doc.save(`OC-${po.number}.pdf`);
};

const PurchaseOrderDetailModal = ({ po, onClose }: { po: RFQ, onClose: () => void }) => {
    const { companySettings } = useMasterData();
    const winner = po.quotes.find(q => q.isSelected);
    const supplierName = winner?.supplierName || 'Proveedor Desconocido';
    const totalAmount = winner?.price || 0;
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const handleDownloadPdf = async () => {
        setGeneratingPdf(true);
        try {
            await generatePurchaseOrderPDF(po, supplierName, totalAmount, companySettings);
        } catch (e) {
            console.error(e);
            alert("Error al generar PDF");
        } finally {
            setGeneratingPdf(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
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
                        onClick={handleDownloadPdf}
                        disabled={generatingPdf}
                        className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-lg shadow-md hover:bg-slate-800 flex items-center transition-transform active:scale-95 disabled:opacity-70"
                    >
                        {generatingPdf ? 'Generando...' : <><Download size={18} className="mr-2"/> Descargar PDF Orden de Compra</>}
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
        <div className="space-y-4 h-full flex flex-col overflow-hidden">
            {/* Search Bar */}
            <div className="relative shrink-0">
                <input 
                    type="text" 
                    placeholder="Buscar por Número de Orden o Proveedor..." 
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-accent bg-white shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={20} className="absolute left-3 top-3.5 text-slate-400" />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col flex-1">
                 <div className="overflow-y-auto no-scrollbar flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold sticky top-0 z-10">
                            <tr>
                                <th className="p-4">Nro OC</th>
                                <th className="p-4">Proveedor / Fecha</th>
                                <th className="p-4">Ítems Incluidos</th>
                                <th className="p-4 text-right">Monto Total</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPOs.map(po => {
                                const winner = po.quotes.find(q => q.isSelected);
                                const itemsSummary = po.items.map(i => i.description).join(', ');

                                return (
                                    <tr key={po.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedPO(po)}>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{po.number}</div>
                                            <div className="text-[10px] text-slate-400 font-mono uppercase">REF RFQ: {po.relatedRfqNumber || '-'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-700">{winner?.supplierName}</div>
                                            <div className="text-xs text-slate-500">{po.date}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-xs text-slate-500 max-w-xs">
                                                <Package size={12} className="shrink-0 text-slate-400" />
                                                <span className="truncate" title={itemsSummary}>{itemsSummary}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="font-bold text-slate-900">${winner?.price.toLocaleString()}</div>
                                            <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Emitida</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setSelectedPO(po); }}
                                                className="text-slate-400 hover:text-accent p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Ver Detalle"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {filteredPOs.length === 0 && (
                        <div className="p-20 text-center text-slate-400 italic">
                            <ShoppingBag size={48} className="mx-auto mb-4 opacity-10" />
                            No se encontraron órdenes de compra emitidas.
                        </div>
                    )}
                 </div>
            </div>

            {selectedPO && (
                <PurchaseOrderDetailModal po={selectedPO} onClose={() => setSelectedPO(null)} />
            )}
        </div>
    );
};
