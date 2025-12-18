
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc, 
  deleteDoc,
  query,
  orderBy,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Contract, ApprovalRule, Material, Asset, MaintenanceRoutine, MaintenanceOrder, MaintenanceStatus, ChecklistModel, ChecklistExecution, Numerator, DocumentType, Warehouse, WarehouseLocation, Client, Supplier, User, Area, SYSTEM_MODULES, AccessLevel, RFQ, PurchaseRequest, RequestStatus, CompanySettings } from '../types';

interface MasterDataContextType {
  regions: string[];
  uoms: string[]; 
  machineTypes: string[];
  vehicleTypes: string[];
  contracts: Contract[];
  warehouses: Warehouse[]; 
  warehouseLocations: WarehouseLocation[]; 
  suppliers: Supplier[];
  clients: Client[]; 
  materials: Material[]; 
  assets: Asset[]; 
  routines: MaintenanceRoutine[]; 
  maintenanceOrders: MaintenanceOrder[]; 
  checklistModels: ChecklistModel[]; 
  checklistExecutions: ChecklistExecution[]; 
  rfqs: RFQ[]; 
  purchaseRequests: PurchaseRequest[]; 
  
  users: User[]; 
  areas: Area[];
  addUser: (u: User) => Promise<void>;
  updateUser: (u: User) => Promise<void>;
  addArea: (a: Area) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;

  approvalRules: ApprovalRule[];
  numerators: Numerator[]; 
  companySettings: CompanySettings | null;
  updateCompanySettings: (settings: CompanySettings) => Promise<void>;

  addRegion: (val: string) => Promise<void>;
  deleteRegion: (val: string) => Promise<void>;
  addUom: (val: string) => void;
  addMachineType: (val: string) => void;
  addVehicleType: (val: string) => void;
  
  addWarehouse: (val: Warehouse) => void;
  updateWarehouse: (val: Warehouse) => void;
  addWarehouseLocation: (val: WarehouseLocation) => void;
  updateWarehouseLocation: (val: WarehouseLocation) => void;

  addMaterial: (val: Material) => void; 
  updateMaterial: (val: Material) => Promise<void>;
  addAsset: (val: Asset) => void; 
  addRoutine: (val: MaintenanceRoutine) => void; 
  updateRoutine: (val: MaintenanceRoutine) => void; 
  deleteRoutine: (id: string) => Promise<void>;
  addChecklistModel: (val: ChecklistModel) => void; 
  updateChecklistModel: (val: ChecklistModel) => void; 
  addChecklistExecution: (val: ChecklistExecution) => void; 
  addApprovalRule: (rule: ApprovalRule) => void;
  deleteApprovalRule: (id: string) => void;
  
  addContract: (c: Contract) => Promise<void>;
  updateContract: (c: Contract) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  getContractForMaterial: (materialId: string) => Contract | undefined;

  addNumerator: (num: Numerator) => void;
  updateNumerator: (num: Numerator) => void;
  getNextId: (type: DocumentType) => Promise<string>; 
  
  addClient: (val: any) => Promise<void>;
  addSupplier: (val: any) => Promise<void>;
  
  updateRFQ: (rfq: RFQ) => Promise<void>; 
  addRFQ: (rfq: RFQ) => Promise<void>;
  
  addPurchaseRequest: (pr: PurchaseRequest) => Promise<void>;
  updatePurchaseRequest: (pr: PurchaseRequest) => Promise<void>;
  
  checkAutomaticReplenishment: (materialIds: string[]) => Promise<string[]>; 
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export const useMasterData = () => {
  const context = useContext(MasterDataContext);
  if (!context) {
    throw new Error('useMasterData must be used within a MasterDataProvider');
  }
  return context;
};

export const MasterDataProvider = ({ children }: { children?: React.ReactNode }) => {
  const [regions, setRegions] = useState<string[]>([]);
  const [uoms, setUoms] = useState<string[]>([]);
  const [machineTypes, setMachineTypes] = useState<string[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseLocations, setWarehouseLocations] = useState<WarehouseLocation[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clients, setClients] = useState<Client[]>([]); 
  const [materials, setMaterials] = useState<Material[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [routines, setRoutines] = useState<MaintenanceRoutine[]>([]);
  const [maintenanceOrders, setMaintenanceOrders] = useState<MaintenanceOrder[]>([]);
  const [checklistModels, setChecklistModels] = useState<ChecklistModel[]>([]);
  const [checklistExecutions, setChecklistExecutions] = useState<ChecklistExecution[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([]);
  const [numerators, setNumerators] = useState<Numerator[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  // --- SUBSCRIPTIONS ---
  useEffect(() => {
    setUoms(['Unidad (UN)', 'Litro (LT)', 'Metro (MT)', 'Kilo (KG)', 'Metro Cuadrado (M2)', 'Metro Cúbico (M3)']);
    setMachineTypes(['Pesada', 'Liviana', 'Herramienta de Mano', 'CNC']);
    setVehicleTypes(['Utilitario', 'Camión', 'Automóvil', 'Autoelevador']);
  }, []);

  useEffect(() => {
      const unsub = onSnapshot(collection(db, 'contracts'), (snap) => {
          setContracts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Contract)));
      });
      return () => unsub();
  }, []);

  useEffect(() => {
      const unsub = onSnapshot(query(collection(db, 'regions'), orderBy('name')), (snap) => {
          if (snap.empty) {
              const defaultProvinces = [
                  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 
                  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 
                  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 
                  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
              ];
              defaultProvinces.forEach(name => {
                  setDoc(doc(db, 'regions', name.toLowerCase().replace(/\s+/g, '-')), { name });
              });
          }
          setRegions(snap.docs.map(d => d.data().name as string));
      });
      return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
        if(snap.empty) {
            const adminPermissions = SYSTEM_MODULES.reduce((acc, m) => {
                acc[m.id] = 'ADMIN';
                return acc;
            }, {} as Record<string, AccessLevel>);

            const admin: User = { 
                id: 'USR-ADMIN', 
                dni: '00000000', 
                firstName: 'Admin', 
                lastName: 'System', 
                email: 'admin@system.com', 
                legajo: 'ADM-001', 
                role: 'ADMIN' as any, 
                permissions: adminPermissions, 
                profile: 'Admin',
                areaId: 'AREA-ADM'
            };
            setDoc(doc(db, 'users', admin.id), admin);
        }
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'areas'), (snap) => {
        if (snap.empty) {
            const defaults = [
                { id: 'AREA-ADM', name: 'Administración' },
                { id: 'AREA-COM', name: 'Comercial / Ventas' },
                { id: 'AREA-PROD', name: 'Producción' },
                { id: 'AREA-MANT', name: 'Mantenimiento' },
                { id: 'AREA-LOG', name: 'Logística / Almacén' },
                { id: 'AREA-IT', name: 'Tecnología (IT)' },
            ];
            defaults.forEach(a => setDoc(doc(db, 'areas', a.id), a));
        }
        setAreas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Area)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
      const unsub = onSnapshot(doc(db, 'settings', 'company'), (docSnap) => {
          if (docSnap.exists()) {
              setCompanySettings(docSnap.data() as CompanySettings);
          } else {
              setCompanySettings({ name: '', address: '', phone: '', taxId: '', email: '', logoUrl: '', website: '' });
          }
      });
      return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'warehouses'), (snap) => {
        setWarehouses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Warehouse)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'warehouse_locations'), (snap) => {
        setWarehouseLocations(snap.docs.map(d => ({ id: d.id, ...d.data() } as WarehouseLocation)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'suppliers'), (snap) => {
        setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'clients'), (snap) => {
        setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'materials'), (snap) => {
        setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() } as Material)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'assets'), (snap) => {
        setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'routines'), (snap) => {
        setRoutines(snap.docs.map(d => ({ id: d.id, ...d.data() } as MaintenanceRoutine)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'maintenance_orders'), (snap) => {
        setMaintenanceOrders(snap.docs.map(d => ({id: d.id, ...d.data()} as MaintenanceOrder)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'rfqs'), (snap) => {
        setRfqs(snap.docs.map(d => ({ id: d.id, ...d.data() } as RFQ)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'purchase_requests'), (snap) => {
        setPurchaseRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as PurchaseRequest)));
    });
    return () => unsub();
  }, []);

  // --- ROBUST NUMERATOR INITIALIZATION ---
  useEffect(() => {
    const requiredNumerators: Numerator[] = [
        { id: 'NUM-001', name: 'Orden de Compra General', prefix: '', currentValue: 4899999999, length: 10, assignedType: 'PURCHASE_ORDER' },
        { id: 'NUM-002', name: 'Petición de Oferta (RFQ)', prefix: '', currentValue: 9999999, length: 8, assignedType: 'RFQ' },
        { id: 'NUM-003', name: 'Orden Mantenimiento', prefix: 'OT-', currentValue: 1000, length: 6, assignedType: 'MAINTENANCE_ORDER' },
        { id: 'NUM-004', name: 'Aviso de Avería', prefix: 'AVISO-', currentValue: 500, length: 4, assignedType: 'WORK_REQUEST' },
        { id: 'NUM-MAT-RAW', name: 'Materia Prima', prefix: '', currentValue: 2000000, length: 7, assignedType: 'MATERIAL_RAW' },
        { id: 'NUM-MAT-SUPPLY', name: 'Insumos y Repuestos', prefix: '', currentValue: 3000000, length: 7, assignedType: 'MATERIAL_SUPPLY' },
        { id: 'NUM-MAT-PROD', name: 'Producto Terminado', prefix: '', currentValue: 100000000, length: 9, assignedType: 'MATERIAL_PRODUCT' },
        { id: 'NUM-MAT-SERV', name: 'Servicios Externos', prefix: '', currentValue: 5000000, length: 7, assignedType: 'MATERIAL_SERVICE' },
        { id: 'NUM-SUP', name: 'Maestro de Proveedores', prefix: '', currentValue: 1399999, length: 7, assignedType: 'SUPPLIER' },
        { id: 'NUM-CLI', name: 'Maestro de Clientes', prefix: '', currentValue: 1099999, length: 7, assignedType: 'CLIENT' },
        { id: 'NUM-SOLPED', name: 'Solicitud de Pedido', prefix: 'SP-', currentValue: 10000, length: 6, assignedType: 'PURCHASE_REQUEST' },
        { id: 'NUM-CONTRACT', name: 'Contratos Marco', prefix: 'CM-', currentValue: 100, length: 4, assignedType: 'CONTRACT' },
    ];

    const unsub = onSnapshot(collection(db, 'numerators'), async (snap) => {
        const existingNums = snap.docs.map(d => ({ id: d.id, ...d.data() } as Numerator));
        setNumerators(existingNums);

        // Individual check for each required type if they don't exist yet
        for (const req of requiredNumerators) {
            const alreadyExists = existingNums.some(en => en.assignedType === req.assignedType);
            if (!alreadyExists) {
                console.log(`Initializing missing numerator: ${req.assignedType}`);
                await setDoc(doc(db, 'numerators', req.id), req);
            }
        }
    });
    return () => unsub();
  }, []);

  // --- ACTIONS ---

  const addContract = async (c: Contract) => { await setDoc(doc(db, 'contracts', c.id), c); };
  const updateContract = async (c: Contract) => { await updateDoc(doc(db, 'contracts', c.id), { ...c }); };
  const deleteContract = async (id: string) => { await deleteDoc(doc(db, 'contracts', id)); };
  
  const getContractForMaterial = (materialId: string) => {
      const today = new Date().toISOString().split('T')[0];
      return contracts.find(c => 
          c.materialId === materialId && 
          c.isActive && 
          c.validFrom <= today && 
          c.validTo >= today
      );
  };

  const addMaterial = async (val: Material) => { await setDoc(doc(db, 'materials', val.id), val); };
  const updateMaterial = async (val: Material) => { await updateDoc(doc(db, 'materials', val.id), { ...val }); };
  const addRFQ = async (val: RFQ) => { await setDoc(doc(db, 'rfqs', val.id), val); };
  const updateRFQ = async (val: RFQ) => { await updateDoc(doc(db, 'rfqs', val.id), { ...val }); };

  const getNextId = async (type: DocumentType): Promise<string> => {
      const num = numerators.find(n => n.assignedType === type);
      if (!num) return `${type}-${Date.now().toString().slice(-6)}`;
      const nextVal = num.currentValue + 1;
      const formattedId = `${num.prefix}${String(nextVal).padStart(num.length, '0')}`;
      try {
          await updateDoc(doc(db, 'numerators', num.id), { currentValue: nextVal });
          return formattedId;
      } catch (e) {
          console.error("Error updating numerator", e);
          return `${type}-ERR-${Date.now()}`;
      }
  };

  const addPurchaseRequest = async (pr: PurchaseRequest) => { await setDoc(doc(db, 'purchase_requests', pr.id), pr); };
  const updatePurchaseRequest = async (pr: PurchaseRequest) => { await updateDoc(doc(db, 'purchase_requests', pr.id), { ...pr }); };
  
  const addUser = async (u: User) => { await setDoc(doc(db, 'users', u.id), u); };
  const updateUser = async (u: User) => { await updateDoc(doc(db, 'users', u.id), { ...u }); };
  const addArea = async (a: Area) => { await setDoc(doc(db, 'areas', a.id), a); };
  const deleteArea = async (id: string) => { await deleteDoc(doc(db, 'areas', id)); };
  const addRegion = async (n: string) => { await setDoc(doc(db, 'regions', n.toLowerCase().replace(/\s+/g, '-')), { name: n }); };
  const deleteRegion = async (n: string) => { await deleteDoc(doc(db, 'regions', n.toLowerCase().replace(/\s+/g, '-'))); };
  const addUom = (v: string) => setUoms(p => [...p, v]);
  const addMachineType = (v: string) => setMachineTypes(p => [...p, v]);
  const addVehicleType = (v: string) => setVehicleTypes(p => [...p, v]);
  const addWarehouse = async (v: Warehouse) => { await setDoc(doc(db, 'warehouses', v.id), v); };
  const updateWarehouse = async (v: Warehouse) => { await updateDoc(doc(db, 'warehouses', v.id), { ...v }); };
  const addWarehouseLocation = async (v: WarehouseLocation) => { await setDoc(doc(db, 'warehouse_locations', v.id), v); };
  const updateWarehouseLocation = async (v: WarehouseLocation) => { await updateDoc(doc(db, 'warehouse_locations', v.id), { ...v }); };
  const addAsset = async (v: Asset) => { await setDoc(doc(db, 'assets', v.id), v); };
  const addRoutine = async (v: MaintenanceRoutine) => { await setDoc(doc(db, 'routines', v.id), v); };
  const updateRoutine = async (v: MaintenanceRoutine) => { await updateDoc(doc(db, 'routines', v.id), { ...v }); };
  const deleteRoutine = async (id: string) => { await deleteDoc(doc(db, 'routines', id)); };
  const addChecklistModel = async (v: ChecklistModel) => { await setDoc(doc(db, 'checklist_models', v.id), v); };
  const updateChecklistModel = async (v: ChecklistModel) => { await updateDoc(doc(db, 'checklist_models', v.id), { ...v }); };
  const addChecklistExecution = async (v: ChecklistExecution) => { await setDoc(doc(db, 'checklist_executions', v.id), v); };
  const addApprovalRule = async (v: ApprovalRule) => { await setDoc(doc(db, 'approval_rules', v.id), v); };
  const deleteApprovalRule = async (id: string) => { await deleteDoc(doc(db, 'approval_rules', id)); };
  const addNumerator = async (v: Numerator) => { await setDoc(doc(db, 'numerators', v.id), v); };
  const updateNumerator = async (v: Numerator) => { await updateDoc(doc(db, 'numerators', v.id), { ...v }); };
  const addClient = async (v: any) => { await setDoc(doc(db, 'clients', v.id), v); };
  const addSupplier = async (v: any) => { await setDoc(doc(db, 'suppliers', v.id), v); };
  const updateCompanySettings = async (s: CompanySettings) => { await setDoc(doc(db, 'settings', 'company'), s); };

  const checkAutomaticReplenishment = async (materialIds: string[]): Promise<string[]> => {
      const messages: string[] = [];
      for (const matId of Array.from(new Set(materialIds))) {
          const material = materials.find(m => m.id === matId);
          if (!material || material.minStock <= 0) continue;
          let reservedQty = 0;
          maintenanceOrders.forEach(o => {
              if (o.status !== MaintenanceStatus.CLOSED && o.assignedMaterials) {
                  const assignment = o.assignedMaterials.find(am => am.materialId === matId);
                  if (assignment) reservedQty += assignment.quantity;
              }
          });
          const availableStock = material.stock - reservedQty;
          if (availableStock < material.minStock) {
              const hasPendingRequest = purchaseRequests.some(pr => pr.status === RequestStatus.PENDING && pr.items.some(item => item.materialId === matId));
              if (!hasPendingRequest) {
                  const quantityToRequest = Math.max(material.minStock - availableStock, 1); 
                  const prNum = await getNextId('PURCHASE_REQUEST'); 
                  const newRequest: PurchaseRequest = {
                      id: `PR-AUTO-${Date.now()}`,
                      number: prNum, date: new Date().toISOString().split('T')[0],
                      requesterId: 'SYSTEM', requesterName: 'Sistema (Reposición Automática)',
                      origin: 'WAREHOUSE', status: RequestStatus.PENDING,
                      items: [{ materialId: material.id, description: `${material.code} - ${material.description}`, quantity: quantityToRequest, unit: material.unitOfMeasure }]
                  };
                  await addPurchaseRequest(newRequest);
                  messages.push(`Se generó SolPed automática ${prNum} para ${material.description}`);
              }
          }
      }
      return messages;
  };

  return (
    <MasterDataContext.Provider value={{
      regions, uoms, machineTypes, vehicleTypes, contracts, warehouses, warehouseLocations, suppliers, clients, 
      materials, assets, routines, maintenanceOrders, checklistModels, checklistExecutions, rfqs, purchaseRequests, 
      users, areas, approvalRules, numerators, companySettings, addRegion, deleteRegion, addUom, addMachineType, 
      addVehicleType, addWarehouse, updateWarehouse, addWarehouseLocation, updateWarehouseLocation, addMaterial, 
      updateMaterial, addClient, addSupplier, addAsset, addRoutine, updateRoutine, deleteRoutine, addChecklistModel, 
      updateChecklistModel, addChecklistExecution, addApprovalRule, deleteApprovalRule, addNumerator, updateNumerator, 
      updateRFQ, addRFQ, updateCompanySettings, getNextId, addUser, updateUser, addArea, deleteArea, addPurchaseRequest, 
      updatePurchaseRequest, checkAutomaticReplenishment, addContract, updateContract, deleteContract, getContractForMaterial
    }}>
      {children}
    </MasterDataContext.Provider>
  );
};
