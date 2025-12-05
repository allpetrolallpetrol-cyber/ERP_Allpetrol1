
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Database, 
  Wrench, 
  Package, 
  Users, 
  Menu, 
  X, 
  Bell
} from 'lucide-react';
import Commercial from './components/commercial/index'; // Updated import
import MasterData from './components/MasterData';
import Maintenance from './components/maintenance/index'; 
import Warehouse from './components/Warehouse';
import UserManagement from './components/Users';
import { MasterDataProvider } from './contexts/MasterDataContext';

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-accent text-white shadow-md' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl z-20`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {isSidebarOpen && <h1 className="text-xl font-bold tracking-wider text-white">Arg<span className="text-accent">ERP</span></h1>}
          <button onClick={toggleSidebar} className="p-1 rounded hover:bg-slate-800">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-6 px-2 space-y-2 overflow-y-auto">
          <SidebarItem to="/" icon={LayoutDashboard} label={isSidebarOpen ? "Dashboard" : ""} active={location.pathname === "/"} />
          <SidebarItem to="/commercial" icon={ShoppingCart} label={isSidebarOpen ? "Gestión Comercial" : ""} active={location.pathname === "/commercial"} />
          <SidebarItem to="/master-data" icon={Database} label={isSidebarOpen ? "Datos Maestros" : ""} active={location.pathname === "/master-data"} />
          <SidebarItem to="/maintenance" icon={Wrench} label={isSidebarOpen ? "Mantenimiento" : ""} active={location.pathname === "/maintenance"} />
          <SidebarItem to="/warehouse" icon={Package} label={isSidebarOpen ? "Almacenes" : ""} active={location.pathname === "/warehouse"} />
          <SidebarItem to="/users" icon={Users} label={isSidebarOpen ? "Usuarios" : ""} active={location.pathname === "/users"} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold">JD</div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">Juan Doe</p>
                <p className="text-xs text-slate-400 truncate">Administrador</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
          <h2 className="text-lg font-semibold text-slate-700">
            {location.pathname === '/' && 'Resumen General'}
            {location.pathname === '/commercial' && 'Gestión Comercial'}
            {location.pathname === '/master-data' && 'Datos Maestros'}
            {location.pathname === '/maintenance' && 'Gestión de Mantenimiento'}
            {location.pathname === '/warehouse' && 'Gestión de Almacenes'}
            {location.pathname === '/users' && 'Administración de Usuarios'}
          </h2>
          <div className="flex items-center space-x-4">
            <button className="p-2 relative text-slate-500 hover:text-slate-700">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[
      { title: "Pedidos Pendientes", value: "12", color: "bg-blue-500" },
      { title: "Órdenes Mantenimiento", value: "5", color: "bg-orange-500" },
      { title: "Alertas de Stock", value: "3", color: "bg-red-500" },
      { title: "Usuarios Activos", value: "24", color: "bg-green-500" }
    ].map((stat, idx) => (
      <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-slate-500 text-sm font-medium mb-2">{stat.title}</h3>
        <div className="flex items-end space-x-2">
          <span className="text-3xl font-bold text-slate-800">{stat.value}</span>
          <div className={`w-2 h-2 rounded-full mb-2 ${stat.color}`}></div>
        </div>
      </div>
    ))}
    <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Bienvenido a ArgERP</h3>
      <p className="text-slate-600">Seleccione un módulo del menú lateral para comenzar a operar.</p>
    </div>
  </div>
);

export default function App() {
  return (
    <MasterDataProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/commercial" element={<Commercial />} />
            <Route path="/master-data" element={<MasterData />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/warehouse" element={<Warehouse />} />
            <Route path="/users" element={<UserManagement />} />
          </Routes>
        </Layout>
      </HashRouter>
    </MasterDataProvider>
  );
}
