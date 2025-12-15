
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MAINTENANCE = 'MAINTENANCE',
  WAREHOUSE = 'WAREHOUSE'
}

export interface Area {
    id: string;
    name: string;
}

// --- PERMISSIONS SYSTEM ---

export type AccessLevel = 'NONE' | 'VIEW' | 'CREATE' | 'EDIT' | 'ADMIN';

export const ACCESS_LEVELS: { value: AccessLevel, label: string, color: string }[] = [
    { value: 'NONE', label: 'Sin Acceso', color: 'text-slate-400' },
    { value: 'VIEW', label: 'Solo Lectura', color: 'text-blue-600' },
    { value: 'CREATE', label: 'Operador (Crear)', color: 'text-green-600' },
    { value: 'EDIT', label: 'Gestor (Editar)', color: 'text-orange-600' },
    { value: 'ADMIN', label: 'Total (Admin)', color: 'text-purple-600 font-bold' },
];

// New Granular Structure
export const SYSTEM_MODULES = [
    // Comercial
    { id: 'COMMERCIAL_REQUESTS', category: 'Comercial', label: 'Solicitudes (SolPed)', description: 'Creación de pedidos internos de compra' },
    { id: 'COMMERCIAL_PROCUREMENT', category: 'Comercial', label: 'Gestión de Compras', description: 'RFQ, Cotizaciones y Órdenes de Compra' },
    { id: 'COMMERCIAL_SALES', category: 'Comercial', label: 'Ventas y Clientes', description: 'Pedidos de venta y facturación' },
    { id: 'COMMERCIAL_CONFIG', category: 'Comercial', label: 'Configuración y Reglas', description: 'Esquemas de liberación y parámetros' },
    
    // Datos Maestros
    { id: 'MASTER_DATA_GENERAL', category: 'Datos Maestros', label: 'ABM General', description: 'Gestión de Artículos, Activos y Tablas' },
    { id: 'MASTER_DATA_IMPORT', category: 'Datos Maestros', label: 'Importación Masiva', description: 'Carga de datos desde Excel/CSV' },
    
    // Mantenimiento
    { id: 'MAINTENANCE_DASHBOARD', category: 'Mantenimiento', label: 'Tablero de Órdenes', description: 'Ver y gestionar órdenes de trabajo (Kanban/Lista)' },
    { id: 'MAINTENANCE_PLANNER', category: 'Mantenimiento', label: 'Planificador PM', description: 'Generación masiva de preventivos' },
    { id: 'MAINTENANCE_EXECUTION', category: 'Mantenimiento', label: 'Ejecución Técnica', description: 'Carga de Avisos y Checklists (Técnicos)' },
    
    // Almacenes
    { id: 'WAREHOUSE_VIEW', category: 'Almacenes', label: 'Consulta de Stock', description: 'Visualizar inventario y ubicaciones' },
    { id: 'WAREHOUSE_OPERATIONS', category: 'Almacenes', label: 'Operaciones de Stock', description: 'Ingresos, Egresos y Ajustes' },
    
    // Admin
    { id: 'USERS_ADMIN', category: 'Administración', label: 'Usuarios y Seguridad', description: 'Gestión de perfiles y accesos' },
];

export interface User {
  id: string;
  dni: string;
  legajo: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole; 
  permissions: Record<string, AccessLevel>; 
  areaId?: string; 
  profile: string;
  avatarUrl?: string;
  isApprover?: boolean; // Nuevo campo para marcar si puede aprobar compras
}

// System Configuration
export type DocumentType = 'RFQ' | 'PURCHASE_ORDER' | 'MAINTENANCE_ORDER' | 'WORK_REQUEST' | 'STOCK_MOVEMENT' | 'MATERIAL' | 'SUPPLIER' | 'CLIENT' | 'PURCHASE_REQUEST';

export interface Numerator {
    id: string;
    name: string; // Descripción interna (ej: Numerador OTs Planta A)
    prefix: string; // Ej: "OT-24-"
    currentValue: number; // Ej: 100
    length: number; // Ej: 4 (para generar 0100)
    assignedType: DocumentType; // Vinculación funcional
}

export interface CompanySettings {
    name: string;
    address: string;
    phone: string;
    taxId: string; // CUIT / RFC
    logoUrl?: string;
    primaryColor?: string;
    email: string;
    website?: string;
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
  CONVERTED_TO_PO = 'OC Generada', // Open PO
  CLOSED = 'Cerrada' // Final state (Fully Received or Manually Closed)
}

export interface RFQItem {
  materialId?: string; // Optional: Can be non-codified
  description: string; // Copied from Material OR Free text
  quantity: number;
  receivedQuantity?: number; // New: Track partial deliveries
  targetSupplierIds?: string[]; // New: Suppliers selected specifically for this item
  purchaseRequestId?: string; // Link back to SolPed
}

export interface QuoteItemDetail {
  materialId: string; // Keep ID if codified, or description hash if not
  description?: string; // Fallback for non-codified matching
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
  relatedRfqNumber?: string; // Trazabilidad: Número original de la RFQ si esto es una OC
  date: string;
  items: RFQItem[];
  selectedSuppliers: {id: string, name: string}[]; // Suppliers invited to quote
  quotes: SupplierQuote[]; // Responses
  status: OrderStatus;
  winnerSupplierId?: string; // Who got the PO
  requiredApproverId?: string; // ID of the user who must approve this
}

// --- NEW: PURCHASE REQUESTS (SolPed) ---
export enum RequestStatus {
    PENDING = 'Pendiente',
    PROCESSED = 'Procesada', // Converted to RFQ
    REJECTED = 'Rechazada'
}

export interface PurchaseRequest {
    id: string;
    number: string;
    date: string;
    requesterId: string; // User ID
    requesterName: string;
    origin: 'MANUAL' | 'MAINTENANCE' | 'WAREHOUSE';
    referenceId?: string; // Link to OT or Warehouse Alert
    status: RequestStatus;
    items: {
        materialId?: string; // Optional
        description: string; // Mandatory
        quantity: number;
        unit?: string;
    }[];
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

export interface ContactPerson {
    name: string;
    phone: string;
    email?: string;
    role?: string;
}

// Master Data
export interface Client {
  id: string;
  businessName: string; // Razón Social
  cuit: string;
  address: string;
  conditionIVA: string; // Resp. Inscripto, Monotributo, etc.
  
  // New Enhanced Contact Info
  emails: string[]; // List of emails for notifications
  contacts: ContactPerson[]; // List of physical people
  
  // Deprecated (Keep optional for backward compat until migrated)
  contactName?: string;
  email?: string; 
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
