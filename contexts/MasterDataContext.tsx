
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
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ApprovalRule, Material, Asset, MaintenanceRoutine, ChecklistModel, ChecklistExecution, Numerator, DocumentType, Warehouse, WarehouseLocation, Client, Supplier, User, Area, SYSTEM_MODULES, AccessLevel } from '../types';

interface MasterDataContextType {
  regions: string[];
  uoms: string[]; 
  machineTypes: string[];
  vehicleTypes: string[];
  warehouses: Warehouse[]; 
  warehouseLocations: WarehouseLocation[]; 
  suppliers: Supplier[];
  clients: Client[]; 
  materials: Material[]; 
  assets: Asset[]; 
  routines: MaintenanceRoutine[]; 
  checklistModels: ChecklistModel[]; 
  checklistExecutions: ChecklistExecution[]; 
  
  // Updated User Management
  users: User[]; 
  areas: Area[];
  addUser: (u: User) => Promise<void>;
  updateUser: (u: User) => Promise<void>;
  addArea: (a: Area) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;

  approvalRules: ApprovalRule[];
  numerators: Numerator[]; 

  addRegion: (val: string) => void;
  addUom: (val: string) => void;
  addMachineType: (val: string) => void;
  addVehicleType: (val: string) => void;
  
  // Warehouse CRUD
  addWarehouse: (val: Warehouse) => void;
  updateWarehouse: (val: Warehouse) => void;
  addWarehouseLocation: (val: WarehouseLocation) => void;
  updateWarehouseLocation: (val: WarehouseLocation) => void;

  addMaterial: (val: Material) => void; 
  addAsset: (val: Asset) => void; 
  addRoutine: (val: MaintenanceRoutine) => void; 
  updateRoutine: (val: MaintenanceRoutine) => void; 
  addChecklistModel: (val: ChecklistModel) => void; 
  updateChecklistModel: (val: ChecklistModel) => void; 
  addChecklistExecution: (val: ChecklistExecution) => void; 
  addApprovalRule: (rule: ApprovalRule) => void;
  deleteApprovalRule: (id: string) => void;
  
  // Numerator Functions
  addNumerator: (num: Numerator) => void;
  updateNumerator: (num: Numerator) => void;
  getNextId: (type: DocumentType) => Promise<string>; 
  
  // Helper for generic clients
  addClient: (val: any) => Promise<void>;
  addSupplier: (val: any) => Promise<void>;
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
  // --- REAL TIME FIRESTORE STATE ---
  const [regions, setRegions] = useState<string[]>([]);
  const [uoms, setUoms] = useState<string[]>([]);
  const [machineTypes, setMachineTypes] = useState<string[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  
  // Warehouse State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseLocations, setWarehouseLocations] = useState<WarehouseLocation[]>([]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clients, setClients] = useState<Client[]>([]); 
  const [materials, setMaterials] = useState<Material[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [routines, setRoutines] = useState<MaintenanceRoutine[]>([]);
  const [checklistModels, setChecklistModels] = useState<ChecklistModel[]>([]);
  const [checklistExecutions, setChecklistExecutions] = useState<ChecklistExecution[]>([]);
  
  // Users & Areas
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([]);
  const [numerators, setNumerators] = useState<Numerator[]>([]);

  // --- HELPER: Subscribe to simple list collections ---
  
  useEffect(() => {
    // Defaults for UI params
    setRegions(['Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán', 'Entre Ríos']);
    setUoms(['Unidad (UN)', 'Litro (LT)', 'Metro (MT)', 'Kilo (KG)', 'Metro Cuadrado (M2)', 'Metro Cúbico (M3)']);
    setMachineTypes(['Pesada', 'Liviana', 'Herramienta de Mano', 'CNC']);
    setVehicleTypes(['Utilitario', 'Camión', 'Automóvil', 'Autoelevador']);
  }, []);

  // --- FIRESTORE SUBSCRIPTIONS ---

  // USERS Subscription
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
        if(snap.empty) {
            // Create default admin if empty
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
                permissions: adminPermissions, // All permissions ADMIN
                profile: 'Admin',
                areaId: 'AREA-ADM'
            };
            setDoc(doc(db, 'users', admin.id), admin);
        }
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    });
    return () => unsub();
  }, []);

  // AREAS Subscription (Mocked via Firestore or Local defaults if empty)
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
    const unsub = onSnapshot(collection(db, 'warehouses'), (snap) => {
        if (snap.empty) {
            const def = { id: 'WH-001', name: 'Depósito Central', responsible: 'Jefe Depósito' };
            setDoc(doc(db, 'warehouses', def.id), def);
        }
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
    const unsub = onSnapshot(collection(db, 'checklist_models'), (snap) => {
        setChecklistModels(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChecklistModel)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Order by timestamp desc
    const q = query(collection(db, 'checklist_executions'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
        setChecklistExecutions(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChecklistExecution)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'approval_rules'), (snap) => {
        setApprovalRules(snap.docs.map(d => ({ id: d.id, ...d.data() } as ApprovalRule)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'numerators'), (snap) => {
        const nums = snap.docs.map(d => ({ id: d.id, ...d.data() } as Numerator));
        if (nums.length === 0) {
            const defaults: Numerator[] = [
                { id: 'NUM-001', name: 'Orden de Compra General', prefix: '', currentValue: 4899999999, length: 10, assignedType: 'PURCHASE_ORDER' },
                { id: 'NUM-002', name: 'Petición de Oferta (RFQ)', prefix: '', currentValue: 9999999, length: 8, assignedType: 'RFQ' },
                { id: 'NUM-003', name: 'Orden Mantenimiento', prefix: 'OT-', currentValue: 1000, length: 6, assignedType: 'MAINTENANCE_ORDER' },
                { id: 'NUM-004', name: 'Aviso de Avería', prefix: 'AVISO-', currentValue: 500, length: 4, assignedType: 'WORK_REQUEST' },
                { id: 'NUM-MAT', name: 'Maestro de Materiales', prefix: '', currentValue: 2999999, length: 7, assignedType: 'MATERIAL' },
                { id: 'NUM-SUP', name: 'Maestro de Proveedores', prefix: '', currentValue: 1399999, length: 7, assignedType: 'SUPPLIER' },
                { id: 'NUM-CLI', name: 'Maestro de Clientes', prefix: '', currentValue: 1099999, length: 7, assignedType: 'CLIENT' },
            ];
            defaults.forEach(n => setDoc(doc(db, 'numerators', n.id), n));
        } else {
            setNumerators(nums);
        }
    });
    return () => unsub();
  }, []);


  // --- ACTIONS (Writes to DB) ---

  const addRegion = (val: string) => setRegions(prev => [...prev, val]); 
  const addUom = (val: string) => setUoms(prev => [...prev, val]);
  const addMachineType = (val: string) => setMachineTypes(prev => [...prev, val]);
  const addVehicleType = (val: string) => setVehicleTypes(prev => [...prev, val]);
  
  // User Actions
  const addUser = async (u: User) => {
      await setDoc(doc(db, 'users', u.id), u);
  };
  const updateUser = async (u: User) => {
      await updateDoc(doc(db, 'users', u.id), { ...u });
  };
  
  // Area Actions
  const addArea = async (a: Area) => {
      await setDoc(doc(db, 'areas', a.id), a);
  };
  const deleteArea = async (id: string) => {
      await deleteDoc(doc(db, 'areas', id));
  };

  // Warehouse Actions
  const addWarehouse = async (val: Warehouse) => {
      await setDoc(doc(db, 'warehouses', val.id), val);
  };
  const updateWarehouse = async (val: Warehouse) => {
      await updateDoc(doc(db, 'warehouses', val.id), { ...val });
  };
  
  // Location Actions
  const addWarehouseLocation = async (val: WarehouseLocation) => {
      await setDoc(doc(db, 'warehouse_locations', val.id), val);
  };
  const updateWarehouseLocation = async (val: WarehouseLocation) => {
      await updateDoc(doc(db, 'warehouse_locations', val.id), { ...val });
  };

  const addMaterial = async (val: Material) => {
      await setDoc(doc(db, 'materials', val.id), val);
  };

  const addClient = async (val: any) => {
      await setDoc(doc(db, 'clients', val.id), val);
  }

  const addSupplier = async (val: any) => {
      await setDoc(doc(db, 'suppliers', val.id), val);
  }

  const addAsset = async (val: Asset) => {
      await setDoc(doc(db, 'assets', val.id), val);
  };

  const addRoutine = async (val: MaintenanceRoutine) => {
      await setDoc(doc(db, 'routines', val.id), val);
  };

  const updateRoutine = async (val: MaintenanceRoutine) => {
      await updateDoc(doc(db, 'routines', val.id), { ...val });
  };

  const addChecklistModel = async (val: ChecklistModel) => {
      await setDoc(doc(db, 'checklist_models', val.id), val);
  };

  const updateChecklistModel = async (val: ChecklistModel) => {
      await updateDoc(doc(db, 'checklist_models', val.id), { ...val });
  };
  
  const addChecklistExecution = async (val: ChecklistExecution) => {
      await setDoc(doc(db, 'checklist_executions', val.id), val);
  };

  const addApprovalRule = async (rule: ApprovalRule) => {
      await setDoc(doc(db, 'approval_rules', rule.id), rule);
  };

  const deleteApprovalRule = async (id: string) => {
      await deleteDoc(doc(db, 'approval_rules', id));
  };

  const addNumerator = async (num: Numerator) => {
      await setDoc(doc(db, 'numerators', num.id), num);
  };

  const updateNumerator = async (num: Numerator) => {
      await updateDoc(doc(db, 'numerators', num.id), { ...num });
  };
  
  const getNextId = async (type: DocumentType): Promise<string> => {
      const num = numerators.find(n => n.assignedType === type);
      
      if (!num) {
          return `${type}-${Date.now().toString().slice(-6)}`;
      }

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

  return (
    <MasterDataContext.Provider value={{
      regions,
      uoms,
      machineTypes,
      vehicleTypes,
      warehouses,
      warehouseLocations,
      suppliers,
      clients, 
      materials,
      assets,
      routines,
      checklistModels,
      checklistExecutions,
      users,
      areas,
      approvalRules,
      numerators,
      addRegion,
      addUom,
      addMachineType,
      addVehicleType,
      addWarehouse,
      updateWarehouse,
      addWarehouseLocation,
      updateWarehouseLocation,
      addMaterial,
      addClient,
      addSupplier,
      addAsset,
      addRoutine,
      updateRoutine,
      addChecklistModel,
      updateChecklistModel,
      addChecklistExecution,
      addApprovalRule,
      deleteApprovalRule,
      addNumerator,
      updateNumerator,
      getNextId,
      addUser,
      updateUser,
      addArea,
      deleteArea
    }}>
      {children}
    </MasterDataContext.Provider>
  );
};
