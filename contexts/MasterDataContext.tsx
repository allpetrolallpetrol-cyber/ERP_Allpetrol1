
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ApprovalRule, Material, Asset, AssetType, MaintenanceRoutine } from '../types';

// Define types for our lists
interface Supplier {
    id: string;
    name: string;
    email: string;
    cuit: string;
    categories: string[]; // For material matching logic
}

interface MasterDataContextType {
  regions: string[];
  uoms: string[]; 
  machineTypes: string[];
  vehicleTypes: string[];
  warehouses: string[]; 
  suppliers: Supplier[];
  materials: Material[]; 
  assets: Asset[]; 
  routines: MaintenanceRoutine[]; // Added PM Routines
  users: {id: string, name: string, role: string}[]; 
  approvalRules: ApprovalRule[];

  addRegion: (val: string) => void;
  addUom: (val: string) => void;
  addMachineType: (val: string) => void;
  addVehicleType: (val: string) => void;
  addWarehouse: (val: string) => void;
  addMaterial: (val: Material) => void; 
  addAsset: (val: Asset) => void; 
  addRoutine: (val: MaintenanceRoutine) => void; // Added function
  addApprovalRule: (rule: ApprovalRule) => void;
  deleteApprovalRule: (id: string) => void;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export const useMasterData = () => {
  const context = useContext(MasterDataContext);
  if (!context) {
    throw new Error('useMasterData must be used within a MasterDataProvider');
  }
  return context;
};

export const MasterDataProvider = ({ children }: { children?: ReactNode }) => {
  // Initial Mock Data 
  const [regions, setRegions] = useState<string[]>([
    'Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe', 'Mendoza', 
    'Tucumán', 'Entre Ríos'
  ]);

  const [uoms, setUoms] = useState<string[]>([
    'Unidad (UN)', 'Litro (LT)', 'Metro (MT)', 'Kilo (KG)', 'Metro Cuadrado (M2)', 'Metro Cúbico (M3)'
  ]);

  const [machineTypes, setMachineTypes] = useState<string[]>([
    'Pesada', 'Liviana', 'Herramienta de Mano', 'CNC'
  ]);

  const [vehicleTypes, setVehicleTypes] = useState<string[]>([
    'Utilitario', 'Camión', 'Automóvil', 'Autoelevador'
  ]);

  const [warehouses, setWarehouses] = useState<string[]>([
    'Depósito Central', 'Nave Industrial A', 'Pañol Herramientas'
  ]);

  // Mock Suppliers for Commercial Module with CUIT and Tags
  const [suppliers] = useState<Supplier[]>([
    { id: 'SUP-001', name: 'Ferretería Industrial S.A.', email: 'ventas@ferreteria.com', cuit: '30-11111111-1', categories: ['Herramientas', 'General', 'Tornillos'] },
    { id: 'SUP-002', name: 'Rodamientos del Norte', email: 'contacto@rodamientos.com', cuit: '30-22222222-2', categories: ['Rodamientos', 'Transmisión'] },
    { id: 'SUP-003', name: 'Lubricantes y Fluidos SRL', email: 'pedidos@lubricantes.com', cuit: '33-33333333-3', categories: ['Aceites', 'Filtros', 'Fluidos'] },
    { id: 'SUP-004', name: 'Materiales El Constructor', email: 'info@constructor.com', cuit: '30-44444444-4', categories: ['Construcción', 'Hierro'] },
    { id: 'SUP-005', name: 'Electro Global S.A.', email: 'ventas@electroglobal.com.ar', cuit: '30-55555555-5', categories: ['Electricidad', 'Motores', 'Sensores'] },
    { id: 'SUP-006', name: 'Bulonera Atlas', email: 'pedidos@atlas.com', cuit: '30-66666666-6', categories: ['Tornillos', 'Fijaciones'] }
  ]);

  // Mock Materials with Relationships
  const [materials, setMaterials] = useState<Material[]>([
    { 
        id: 'MAT-001', 
        code: 'RUL-6204', 
        description: 'Rulemán SKF 6204 2RS', 
        unitOfMeasure: 'Unidad (UN)', 
        stock: 50, 
        minStock: 10, 
        location: 'Depósito Central', 
        cost: 4500, 
        assignedSupplierIds: ['SUP-002', 'SUP-005'] // Sold by Rodamientos & Electro
    },
    { 
        id: 'MAT-002', 
        code: 'ACE-15W40', 
        description: 'Aceite Motor 15W40 Tambor 200L', 
        unitOfMeasure: 'Litro (LT)', 
        stock: 4, 
        minStock: 2, 
        location: 'Nave Industrial A', 
        cost: 250000, 
        assignedSupplierIds: ['SUP-003'] // Sold by Lubricantes
    },
    { 
        id: 'MAT-003', 
        code: 'TOR-HEX-M8', 
        description: 'Tornillo Hexagonal M8 x 50mm', 
        unitOfMeasure: 'Unidad (UN)', 
        stock: 1000, 
        minStock: 200, 
        location: 'Pañol Herramientas', 
        cost: 50, 
        assignedSupplierIds: ['SUP-001', 'SUP-006'] // Sold by Ferreteria & Bulonera
    }
  ]);

  // Mock Assets
  const [assets, setAssets] = useState<Asset[]>([
      { id: 'MAQ-001', code: 'TR-01', name: 'Torno CNC Haas', type: AssetType.MACHINE, brand: 'Haas', model: 'ST-20', serialNumber: '123456', location: 'Nave Industrial A' },
      { id: 'MAQ-002', code: 'PRE-05', name: 'Prensa Hidráulica 50T', type: AssetType.MACHINE, brand: 'Metalurg', model: 'PH-50', serialNumber: '987654', location: 'Nave Industrial A' },
      { id: 'VEH-001', code: 'MOV-01', name: 'Autoelevador Toyota', type: AssetType.VEHICLE, brand: 'Toyota', model: '8FD', serialNumber: 'V-111', plate: 'AA123BB', mileage: 15000 },
      { id: 'VEH-002', code: 'CAM-02', name: 'Camioneta Hilux', type: AssetType.VEHICLE, brand: 'Toyota', model: 'Hilux', serialNumber: 'V-222', plate: 'AD456CC', mileage: 45000 }
  ]);

  // Mock Routines
  const [routines, setRoutines] = useState<MaintenanceRoutine[]>([
      { id: 'RT-001', assetId: 'MAQ-001', name: 'Lubricación General y Limpieza', frequencyDays: 30, discipline: 'Mecánica', lastExecutionDate: '2023-09-15', estimatedHours: 2 },
      { id: 'RT-002', assetId: 'MAQ-001', name: 'Revisión Armario Eléctrico', frequencyDays: 90, discipline: 'Eléctrica', lastExecutionDate: '2023-08-01', estimatedHours: 4 },
      { id: 'RT-003', assetId: 'VEH-001', name: 'Service 500hs (Aceite y Filtros)', frequencyDays: 120, discipline: 'Mecánica', lastExecutionDate: '2023-06-20', estimatedHours: 6 },
      { id: 'RT-004', assetId: 'MAQ-002', name: 'Verificación Sellos Hidráulicos', frequencyDays: 60, discipline: 'Hidráulica', lastExecutionDate: '2023-09-01', estimatedHours: 3 },
  ]);

  // Mock Users for Approval Logic
  const [users] = useState([
    { id: 'USR-001', name: 'Juan Perez (Comprador)', role: 'USER' },
    { id: 'USR-002', name: 'Maria Gonzalez (Gerente)', role: 'ADMIN' },
    { id: 'USR-003', name: 'Carlos Lopez (Jefe Planta)', role: 'MAINTENANCE' }
  ]);

  // Approval Rules State
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([
    { id: 'RULE-1', minAmount: 0, maxAmount: 100000, approverId: 'USR-003' }, // Jefe Planta approves small
    { id: 'RULE-2', minAmount: 100001, maxAmount: 999999999, approverId: 'USR-002' } // Gerente approves big
  ]);

  const addRegion = (val: string) => setRegions(prev => [...prev, val]);
  const addUom = (val: string) => setUoms(prev => [...prev, val]);
  const addMachineType = (val: string) => setMachineTypes(prev => [...prev, val]);
  const addVehicleType = (val: string) => setVehicleTypes(prev => [...prev, val]);
  const addWarehouse = (val: string) => setWarehouses(prev => [...prev, val]);
  
  const addMaterial = (val: Material) => setMaterials(prev => [...prev, val]);
  const addAsset = (val: Asset) => setAssets(prev => [...prev, val]);
  const addRoutine = (val: MaintenanceRoutine) => setRoutines(prev => [...prev, val]);

  const addApprovalRule = (rule: ApprovalRule) => setApprovalRules(prev => [...prev, rule]);
  const deleteApprovalRule = (id: string) => setApprovalRules(prev => prev.filter(r => r.id !== id));

  return (
    <MasterDataContext.Provider value={{
      regions,
      uoms,
      machineTypes,
      vehicleTypes,
      warehouses,
      suppliers,
      materials,
      assets,
      routines,
      users,
      approvalRules,
      addRegion,
      addUom,
      addMachineType,
      addVehicleType,
      addWarehouse,
      addMaterial,
      addAsset,
      addRoutine,
      addApprovalRule,
      deleteApprovalRule
    }}>
      {children}
    </MasterDataContext.Provider>
  );
};
