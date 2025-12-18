
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
  isApprover?: boolean;
}

// System Configuration
export type DocumentType = 
    | 'RFQ' 
    | 'PURCHASE_ORDER' 
    | 'MAINTENANCE_ORDER' 
    | 'WORK_REQUEST' 
    | 'STOCK_MOVEMENT' 
    | 'MATERIAL' 
    | 'MATERIAL_RAW' 
    | 'MATERIAL_SUPPLY' 
    | 'MATERIAL_PRODUCT' 
    | 'MATERIAL_SERVICE' 
    | 'SUPPLIER' 
    | 'CLIENT' 
    | 'PURCHASE_REQUEST' 
    | 'CONTRACT';

export interface Numerator {
    id: string;
    name: string; 
    prefix: string; 
    currentValue: number; 
    length: number; 
    assignedType: DocumentType; 
}

export interface CompanySettings {
    name: string;
    address: string;
    phone: string;
    taxId: string; 
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
    approverId: string;
}

// --- OPEN CONTRACTS ---
export interface Contract {
    id: string;
    materialId: string;
    materialName: string;
    supplierId: string;
    supplierName: string;
    price: number;
    currency: string;
    validFrom: string;
    validTo: string;
    isActive: boolean;
}

// Commercial
export enum OrderStatus {
  DRAFT = 'Borrador',
  SENT = 'Enviado',
  QUOTED = 'Cotizado', 
  PENDING_APPROVAL = 'Pendiente Aprobación',
  APPROVED = 'Aprobado',
  REJECTED = 'Rechazado',
  CONVERTED_TO_PO = 'OC Generada', 
  CLOSED = 'Cerrada' 
}

export interface RFQItem {
  materialId?: string; 
  description: string; 
  quantity: number;
  receivedQuantity?: number; 
  targetSupplierIds?: string[]; 
  purchaseRequestId?: string; 
}

export interface QuoteItemDetail {
  materialId: string; 
  description?: string; 
  unitPrice: number;
}

export interface SupplierQuote {
  supplierId: string;
  supplierName: string;
  price: number; 
  items?: QuoteItemDetail[]; 
  quoteReference?: string; 
  deliveryDate?: string;
  isSelected: boolean; 
}

export interface RFQ {
  id: string;
  number: string;
  relatedRfqNumber?: string; 
  date: string;
  items: RFQItem[];
  selectedSuppliers: {id: string, name: string}[]; 
  quotes: SupplierQuote[]; 
  status: OrderStatus;
  winnerSupplierId?: string; 
  requiredApproverId?: string; 
  origin?: 'RFQ' | 'CONTRACT';
}

// --- PURCHASE REQUESTS (SolPed) ---
export enum RequestStatus {
    PENDING = 'Pendiente',
    PROCESSED = 'Procesada', 
    REJECTED = 'Rechazada'
}

export interface PurchaseRequest {
    id: string;
    number: string;
    date: string;
    requesterId: string; 
    requesterName: string;
    origin: 'MANUAL' | 'MAINTENANCE' | 'WAREHOUSE';
    referenceId?: string; 
    status: RequestStatus;
    items: {
        materialId?: string; 
        description: string; 
        quantity: number;
        unit?: string;
    }[];
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
  businessName: string; 
  cuit: string;
  address: string;
  region?: string; 
  conditionIVA: string; 
  emails: string[]; 
  contacts: ContactPerson[]; 
  
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

export type MaterialCategory = 'RAW_MATERIAL' | 'SUPPLY' | 'FINISHED_PRODUCT' | 'SERVICE';

export interface Asset {
  id: string;
  code: string;
  name: string;
  type: AssetType;
  subtype?: string; 
  brand: string;
  model: string;
  serialNumber: string;
  location?: string;
  plate?: string; 
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
    warehouseId: string; 
    code: string; 
    description?: string;
}

export interface Material {
  id: string;
  code: string;
  description: string; 
  extendedDescription?: string;
  technicalDescription?: string; 
  category: MaterialCategory;
  unitOfMeasure: string;
  stock: number;
  minStock: number;
  warehouse?: string; 
  location: string; 
  cost: number;
  assignedSupplierIds: string[]; 
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
    name: string; 
    description?: string; 
    frequencyDays: number; 
    discipline: 'Mecánica' | 'Eléctrica' | 'Hidráulica' | 'Neumática' | 'General';
    lastExecutionDate: string; 
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
  closedDate?: string; 
  assignedMaterials: { materialId: string; quantity: number }[];
  technician?: string;
  origin?: 'MANUAL' | 'ROUTINE'; 
  routineId?: string; 
  relatedOrderId?: string; 
}

// Checklists
export interface ChecklistItemDefinition {
    id: string;
    label: string;
    isCritical: boolean;
}

export interface ChecklistModel {
    id: string;
    name: string; 
    assetType: AssetType;
    assetSubtype?: string; 
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
  reference: string; 
  materialId: string;
  quantity: number;
  reason?: string;
}
