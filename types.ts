
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MAINTENANCE = 'MAINTENANCE',
  WAREHOUSE = 'WAREHOUSE'
}

export interface User {
  id: string;
  dni: string;
  legajo: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  profile: string;
}

// System Configuration
export type DocumentType = 'RFQ' | 'PURCHASE_ORDER' | 'MAINTENANCE_ORDER' | 'WORK_REQUEST' | 'STOCK_MOVEMENT' | 'MATERIAL' | 'SUPPLIER' | 'CLIENT';

export interface Numerator {
    id: string;
    name: string; // Descripción interna (ej: Numerador OTs Planta A)
    prefix: string; // Ej: "OT-24-"
    currentValue: number; // Ej: 100
    length: number; // Ej: 4 (para generar 0100)
    assignedType: DocumentType; // Vinculación funcional
}

// Commercial Configuration
export interface ApprovalRule {
    id: string;
    minAmount: number;
    maxAmount: number;
    approverId: string; // Link to User
}

// Commercial
export enum OrderStatus {
  DRAFT = 'Borrador',
  SENT = 'Enviado',
  QUOTED = 'Cotizado', // Suppliers responded
  PENDING_APPROVAL = 'Pendiente Aprobación',
  APPROVED = 'Aprobado',
  REJECTED = 'Rechazado',
  CONVERTED_TO_PO = 'OC Generada'
}

export interface RFQItem {
  materialId: string;
  description: string; // Copied from Material for display/snapshot
  quantity: number;
  targetSupplierIds?: string[]; // New: Suppliers selected specifically for this item
}

export interface QuoteItemDetail {
  materialId: string;
  unitPrice: number;
}

export interface SupplierQuote {
  supplierId: string;
  supplierName: string;
  price: number; // Total sum
  items?: QuoteItemDetail[]; // New field for detailed unit prices
  quoteReference?: string; // New: Supplier's budget/quote number
  deliveryDate?: string;
  isSelected: boolean; // Is this the winning quote?
}

export interface RFQ {
  id: string;
  number: string;
  date: string;
  items: RFQItem[];
  selectedSuppliers: {id: string, name: string}[]; // Suppliers invited to quote
  quotes: SupplierQuote[]; // Responses
  status: OrderStatus;
  winnerSupplierId?: string; // Who got the PO
  requiredApproverId?: string; // ID of the user who must approve this
}

export interface CommercialDocument {
  id: string;
  type: 'RFQ' | 'PURCHASE_ORDER' | 'SALES_ORDER';
  number: string;
  date: string;
  entityName: string; // Client or Supplier Name
  total: number;
  status: OrderStatus;
  items: any[];
}

// Master Data
export interface Client {
  id: string;
  businessName: string; // Razón Social
  cuit: string;
  address: string;
  contactName: string;
  email?: string; // Supports multiple emails separated by comma
  conditionIVA: string; // Resp. Inscripto, Monotributo, etc.
}

export interface Supplier extends Client {
  paymentTerms: string;
}

export enum AssetType {
  MACHINE = 'MACHINE',
  VEHICLE = 'VEHICLE'
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  type: AssetType;
  subtype?: string; // New: To specify "Forklift", "Truck", "CNC", etc.
  brand: string;
  model: string;
  serialNumber: string;
  // Machine specific
  location?: string;
  // Vehicle specific
  plate?: string; // Patente
  mileage?: number;
}

// Warehouse Interfaces
export interface Warehouse {
    id: string;
    name: string;
    responsible?: string;
}

export interface WarehouseLocation {
    id: string;
    warehouseId: string; // Parent Warehouse ID
    code: string; // e.g. RACK-A-01
    description?: string;
}

export interface Material {
  id: string;
  code: string;
  description: string; // Nombre Corto / Título
  technicalDescription?: string; // Nueva: Descripción técnica detallada
  unitOfMeasure: string;
  stock: number;
  minStock: number;
  warehouse?: string; // Almacén principal
  location: string; // Ubicación específica (Rack/Estante)
  cost: number;
  assignedSupplierIds: string[]; // List of IDs of suppliers who sell this material
}

// Maintenance
export enum MaintenanceStatus {
  PENDING = 'Pendiente',
  PLANNED = 'Planificado',
  IN_PROGRESS = 'En Curso',
  CLOSED = 'Cerrado'
}

export enum MaintenanceType {
  CORRECTIVE = 'Correctivo',
  PREVENTIVE = 'Preventivo'
}

export interface MaintenanceRoutine {
    id: string;
    assetId: string;
    name: string; // e.g. "Cambio de Filtros 500h"
    description?: string; // Detailed description of tasks
    frequencyDays: number; // e.g. 90 days
    discipline: 'Mecánica' | 'Eléctrica' | 'Hidráulica' | 'Neumática' | 'General';
    lastExecutionDate: string; // ISO Date
    estimatedHours: number;
}

export interface MaintenanceOrder {
  id: string;
  number: string;
  assetId: string;
  description: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  priority: 'High' | 'Medium' | 'Low';
  reportedDate: string;
  plannedDate?: string;
  closedDate?: string; // New field to track when it was closed
  assignedMaterials: { materialId: string; quantity: number }[];
  technician?: string;
  origin?: 'MANUAL' | 'ROUTINE'; // To distinguish manual requests from PM planner
  routineId?: string; // Link back to the PM Routine if applicable
  relatedOrderId?: string; // New: Link to a parent order (e.g., a PM that generated this Corrective)
}

// Checklists
export interface ChecklistItemDefinition {
    id: string;
    label: string;
    isCritical: boolean;
}

export interface ChecklistModel {
    id: string;
    name: string; // e.g. "Inspección Diaria Autoelevador"
    assetType: AssetType;
    assetSubtype?: string; // e.g. "Autoelevador" (optional, for specific filtering)
    items: ChecklistItemDefinition[];
}

export interface ChecklistExecution {
    id: string;
    date: string;
    timestamp: number;
    modelId: string;
    modelName: string;
    assetId: string;
    assetName: string;
    globalStatus: 'PASS' | 'FAIL';
    items: {
        label: string;
        status: 'OK' | 'FAIL' | 'PENDING';
        comment?: string;
        isCritical: boolean;
    }[];
}

// Warehouse
export interface StockMovement {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  date: string;
  reference: string; // PO number, Work Order, Remito
  materialId: string;
  quantity: number;
  reason?: string;
}
