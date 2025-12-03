
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
  brand: string;
  model: string;
  serialNumber: string;
  // Machine specific
  location?: string;
  // Vehicle specific
  plate?: string; // Patente
  mileage?: number;
}

export interface Material {
  id: string;
  code: string;
  description: string;
  unitOfMeasure: string;
  stock: number;
  minStock: number;
  location: string; // Almacen/Rack
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
  assignedMaterials: { materialId: string; quantity: number }[];
  technician?: string;
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
