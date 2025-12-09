
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  ShoppingCart, 
  Database, 
  Wrench, 
  Package, 
  Users, 
  Menu, 
  X, 
  Bell,
  Clock,
  Layers,
  Activity,
  Command,
  Lock,
  LogOut
} from 'lucide-react';
import Commercial from './components/commercial/index'; 
import MasterData from './components/MasterData';
import Maintenance from './components/maintenance/index'; 
import Warehouse from './components/Warehouse';
import UserManagement from './components/Users';
import { Login } from './components/Login';
import { MasterDataProvider } from './contexts/MasterDataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider, useUI } from './contexts/UIContext';
import { User, AccessLevel } from './types';

// --- Splash Screen Component ---
const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(onFinish, 500); // Wait for CSS animation
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-zinc-900 transition-opacity duration-500 ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="text-center animate-in zoom-in duration-700">
        <div className="flex justify-center mb-4">
           <div className="relative">
              <Layers size={64} className="text-accent animate-bounce" />
              <div className="absolute -bottom-2 w-full h-2 bg-black/20 blur-md rounded-[100%]"></div>
           </div>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-widest">PyME <span className="text-accent">ERP</span></h1>
        <p className="text-zinc-400 mt-2 text-sm uppercase tracking-widest">Soluciones Integrales</p>
        
        <div className="mt-8 flex justify-center">
           <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-accent w-1/2 animate-[ping_1s_ease-in-out_infinite]"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Live Clock Component ---
const LiveClock = () => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end mr-4 text-right hidden md:block">
      <div className="text-sm font-bold text-zinc-700 font-mono">
        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-xs text-zinc-400 capitalize">
        {date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
      </div>
    </div>
  );
};

// --- Layout Components ---

const SidebarItem = ({ to, icon: Icon, label, active, collapsed }: { to: string, icon: any, label: string, active: boolean, collapsed: boolean }) => (
  <Link 
    to={to} 
    title={collapsed ? label : undefined}
    className={`flex items-center ${collapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-300 group ${
      active 
        ? 'bg-accent text-white shadow-lg shadow-accent/25' 
        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
    }`}
  >
    <Icon 
      size={20} 
      className={`transition-transform duration-300 ${
        active 
          ? (collapsed ? 'scale-125' : 'scale-110') 
          : 'group-hover:scale-110'
      }`} 
    />
    {!collapsed && <span className="font-medium animate-in fade-in slide-in-from-left-2 duration-300">{label}</span>}
  </Link>
);

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { userProfile, logout } = useAuth(); 
  const { showConfirm, showToast } = useUI(); // Use UI Context

  const currentUser = userProfile;

  const handleLogout = async () => {
      const confirmed = await showConfirm(
          'Cerrar Sesión', 
          '¿Está seguro que desea salir del sistema?', 
          'info', 
          'Salir'
      );
      
      if (confirmed) {
          await logout();
          showToast('Sesión cerrada correctamente', 'info');
      }
  };

  // Helper to check ANY permission within a category
  const hasModuleAccess = (categoryPrefix: string): boolean => {
      if (!currentUser) return false;
      if (currentUser.role === 'ADMIN') return true; 
      
      const perms = currentUser.permissions || {};
      
      // Check if any key starting with prefix exists and is not NONE
      return Object.entries(perms).some(([key, level]) => 
          key.startsWith(categoryPrefix) && level !== 'NONE'
      );
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-primary text-white transition-all duration-300 flex flex-col shadow-2xl z-20 border-r border-zinc-800`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
          {isSidebarOpen && (
            <div className="flex items-center space-x-2 animate-in fade-in">
              <Command className="text-accent" size={24} />
              <h1 className="text-lg font-bold tracking-wider text-white">PyME <span className="text-accent">ERP</span></h1>
            </div>
          )}
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors">
            {isSidebarOpen ? <X size={18} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          <SidebarItem to="/" icon={HomeIcon} label="Home" active={location.pathname === "/"} collapsed={!isSidebarOpen} />
          
          {hasModuleAccess('COMMERCIAL') && (
            <SidebarItem to="/commercial" icon={ShoppingCart} label="Comercial" active={location.pathname === "/commercial"} collapsed={!isSidebarOpen} />
          )}
          
          {hasModuleAccess('MASTER_DATA') && (
            <SidebarItem to="/master-data" icon={Database} label="Datos Maestros" active={location.pathname === "/master-data"} collapsed={!isSidebarOpen} />
          )}
          
          {hasModuleAccess('MAINTENANCE') && (
            <SidebarItem to="/maintenance" icon={Wrench} label="Mantenimiento" active={location.pathname === "/maintenance"} collapsed={!isSidebarOpen} />
          )}
          
          {hasModuleAccess('WAREHOUSE') && (
            <SidebarItem to="/warehouse" icon={Package} label="Almacenes" active={location.pathname === "/warehouse"} collapsed={!isSidebarOpen} />
          )}
          
          {hasModuleAccess('USERS') && (
            <SidebarItem to="/users" icon={Users} label="Usuarios" active={location.pathname === "/users"} collapsed={!isSidebarOpen} />
          )}
        </nav>

        <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/30">
          <div className={`flex items-center ${!isSidebarOpen ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold shadow-md text-white text-xs overflow-hidden shrink-0 relative">
                {currentUser?.avatarUrl ? (
                    <img 
                        src={currentUser.avatarUrl} 
                        alt="" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                ) : null}
                <span className={`absolute inset-0 flex items-center justify-center ${currentUser?.avatarUrl ? 'hidden' : ''}`}>
                    {currentUser?.firstName?.substring(0,1)}{currentUser?.lastName?.substring(0,1)}
                </span>
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden animate-in fade-in slide-in-from-left-2 w-full">
                <p className="text-sm font-medium truncate text-zinc-200">{currentUser?.firstName} {currentUser?.lastName}</p>
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-zinc-500 truncate uppercase tracking-wider">{currentUser?.role}</p>
                    <button onClick={handleLogout} className="text-zinc-500 hover:text-red-400 transition-colors" title="Cerrar Sesión">
                        <LogOut size={14}/>
                    </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-zinc-50/50">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-between px-6 z-10 border-b border-zinc-200/50">
          <h2 className="text-lg font-semibold text-zinc-800 flex items-center">
            {location.pathname === '/' && <><HomeIcon className="mr-2 text-accent" size={20}/> Home</>}
            {location.pathname === '/commercial' && <><ShoppingCart className="mr-2 text-accent" size={20}/> Gestión Comercial</>}
            {location.pathname === '/master-data' && <><Database className="mr-2 text-accent" size={20}/> Datos Maestros</>}
            {location.pathname === '/maintenance' && <><Wrench className="mr-2 text-accent" size={20}/> Gestión de Mantenimiento</>}
            {location.pathname === '/warehouse' && <><Package className="mr-2 text-accent" size={20}/> Gestión de Almacenes</>}
            {location.pathname === '/users' && <><Users className="mr-2 text-accent" size={20}/> Administración de Usuarios</>}
          </h2>
          
          <div className="flex items-center">
            <LiveClock />
            <div className="h-8 w-px bg-zinc-200 mx-2 hidden md:block"></div>
            <button className="p-2 relative text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-6 scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
};

// --- Home / Welcome View ---
const Home = () => (
  <div className="h-full flex flex-col items-center justify-center pb-20 animate-in fade-in duration-700">
    <div className="relative mb-8">
        {/* Floating Animation Container */}
        <div className="relative w-48 h-48 flex items-center justify-center animate-float">
            <div className="absolute inset-0 bg-accent/5 rounded-full blur-3xl"></div>
            <div className="absolute top-0 right-0 p-4 bg-white rounded-2xl shadow-xl border border-zinc-100 transform rotate-12 z-10">
                <ShoppingCart size={32} className="text-zinc-400" />
            </div>
            <div className="absolute bottom-0 left-0 p-4 bg-white rounded-2xl shadow-xl border border-zinc-100 transform -rotate-12 z-10">
                <Wrench size={32} className="text-zinc-400" />
            </div>
            <div className="relative z-20 bg-white p-8 rounded-[2rem] shadow-2xl border border-zinc-100">
                <Layers size={64} className="text-accent" />
            </div>
        </div>
    </div>
    
    <h2 className="text-3xl font-bold text-zinc-800 mb-4 tracking-tight">Bienvenido a PyME ERP</h2>
    <p className="text-zinc-500 text-lg max-w-md text-center leading-relaxed">
        Sistema integral de gestión empresarial.
        <br/>
        <span className="text-sm mt-2 block text-zinc-400">Seleccione una funcionalidad en el menú lateral para comenzar a operar.</span>
    </p>

    <div className="mt-12 grid grid-cols-3 gap-4 opacity-50">
        <div className="w-2 h-2 bg-zinc-300 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-zinc-300 rounded-full animate-pulse delay-75"></div>
        <div className="w-2 h-2 bg-zinc-300 rounded-full animate-pulse delay-150"></div>
    </div>
  </div>
);

// MAIN APP COMPONENT
function AppContent() {
    const { currentUser, loading } = useAuth();
    const [showSplash, setShowSplash] = useState(true);

    if (showSplash) {
        return <SplashScreen onFinish={() => setShowSplash(false)} />;
    }

    if (!currentUser) {
        return <Login />;
    }

    return (
        <MasterDataProvider>
            <HashRouter>
                <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
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

export default function App() {
    return (
        <UIProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </UIProvider>
    );
}
