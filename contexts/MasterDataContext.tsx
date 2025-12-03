
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ApprovalRule, Material } from '../types';

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
  materials: Material[]; // Added Global Materials State
  users: {id: string, name: string, role: string}[]; // For Approval Flow
  approvalRules: ApprovalRule[];

  addRegion: (val: string) => void;
  addUom: (val: string) => void;
  addMachineType: (val: string) => void;
  addVehicleType: (val: string) => void;
  addWarehouse: (val: string) => void;
  addMaterial: (val: Material) => void; // Added function
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
      users,
      approvalRules,
      addRegion,
      addUom,
      addMachineType,
      addVehicleType,
      addWarehouse,
      addMaterial,
      addApprovalRule,
      deleteApprovalRule
    }}>
      {children}
    </MasterDataContext.Provider>
  );
};
