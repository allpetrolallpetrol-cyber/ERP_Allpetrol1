
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
  Clock,
  Layers,
  Activity,
  Command,
  Lock,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import Commercial from './components/commercial/index'; 
import { MasterData } from './components/MasterData';
import Maintenance from './components/maintenance/index'; 
import Warehouse from './components/Warehouse';
import UserManagement from './components/Users';
import { NotificationsBtn } from './components/NotificationsBtn';
import { Login } from './components/Login';
import { MasterDataProvider, useMasterData } from './contexts/MasterDataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider, useUI } from './contexts/UIContext';
import { User, AccessLevel } from './types';

// --- SUB-COMPONENTS FOR CLEANER CODE ---

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(onFinish, 500);
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
      </div>
    </div>
  );
};

const LiveClock = () => {
  const [date, setDate] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex flex-col items-end mr-4 text-right hidden md:block">
      <div className="text-sm font-semibold text-zinc-700 tracking-wide tabular-nums font-sans">
        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-xs text-zinc-400 capitalize tracking-tight font-medium">
        {date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
      </div>
    </div>
  );
};

const SidebarItem = ({ to, icon: Icon, label, active, collapsed }: { to: string, icon: any, label: string, active: boolean, collapsed: boolean }) => (
  <Link 
    to={to} 
    className={`flex items-center ${collapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-300 group overflow-hidden whitespace-nowrap ${
      active 
        ? 'bg-accent text-white shadow-lg shadow-accent/25' 
        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
    }`}
  >
    <Icon size={20} className={`transition-transform duration-300 flex-shrink-0 ${active ? (collapsed ? 'scale-125' : 'scale-110') : 'group-hover:scale-110'}`} />
    {!collapsed && <span className="font-medium animate-in fade-in slide-in-from-left-2 duration-300">{label}</span>}
  </Link>
);

const HeaderTitle = ({ pathname }: { pathname: string }) => {
    const getInfo = () => {
        switch(pathname) {
            case '/': return { icon: <HomeIcon className="text-accent" size={20}/>, label: 'Home' };
            case '/commercial': return { icon: <ShoppingCart className="text-accent" size={20}/>, label: 'Gestión Comercial' };
            case '/master-data': return { icon: <Database className="text-accent" size={20}/>, label: 'Datos Maestros' };
            case '/maintenance': return { icon: <Wrench className="text-accent" size={20}/>, label: 'Mantenimiento' };
            case '/warehouse': return { icon: <Package className="text-accent" size={20}/>, label: 'Almacenes' };
            case '/users': return { icon: <Users className="text-accent" size={20}/>, label: 'Usuarios' };
            default: return { icon: null, label: '' };
        }
    };
    const { icon, label } = getInfo();
    return (
        <h2 className="text-base md:text-lg font-bold text-zinc-800 flex items-center gap-2 truncate uppercase tracking-tight">
            {icon}
            {label}
        </h2>
    );
};

// --- MAIN LAYOUT ---

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const location = useLocation();
  const { userProfile, logout } = useAuth(); 
  const { showConfirm, showToast } = useUI();
  const { companySettings } = useMasterData();

  useEffect(() => {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, [location]);

  const handleLogout = async () => {
      const confirmed = await showConfirm('Cerrar Sesión', '¿Está seguro que desea salir?', 'info', 'Salir');
      if (confirmed) { await logout(); showToast('Sesión cerrada', 'info'); }
  };

  const hasModuleAccess = (categoryPrefix: string): boolean => {
      if (!userProfile) return false;
      if (userProfile.role === 'ADMIN') return true; 
      return Object.entries(userProfile.permissions || {}).some(([key, level]) => key.startsWith(categoryPrefix) && level !== 'NONE');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Mobile overlay */}
      {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 md:hidden animate-in fade-in" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* --- SIDEBAR --- */}
      <aside 
        className={`fixed z-40 h-full bg-primary text-white transition-all duration-300 ease-in-out flex flex-col shadow-2xl border-r border-zinc-800 md:relative ${isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full w-64 md:translate-x-0 md:w-20'}`}
      >
        {/* Sidebar Header: Branding */}
        <div className={`py-4 flex flex-col border-b border-zinc-800/50 bg-zinc-900/50 shrink-0 transition-all duration-300 min-h-[4rem] relative ${isSidebarOpen ? 'items-start px-4' : 'items-center px-0'}`}>
          <div className="flex items-center justify-between w-full mb-3">
              <div className={`flex items-center ${isSidebarOpen ? 'justify-start' : 'justify-center w-full'}`}>
                  <Command className="text-accent shrink-0 animate-pulse" size={24} />
                  {isSidebarOpen && <h1 className="ml-2 text-lg font-bold tracking-wider text-white whitespace-nowrap animate-in fade-in">PyME <span className="text-accent">ERP</span></h1>}
              </div>
              {isSidebarOpen && (
                  <button onClick={toggleSidebar} className="hidden md:flex p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                    <ChevronLeft size={20} className="text-zinc-400 hover:text-white" />
                  </button>
              )}
          </div>
          
          {/* Company Context Card */}
          {isSidebarOpen && companySettings?.name && (
              <div className="w-full flex items-center space-x-3 bg-zinc-800/40 p-2 rounded-lg border border-zinc-800 animate-in slide-in-from-left-2 fade-in">
                  {companySettings.logoUrl && (
                      <div className="w-8 h-8 rounded bg-white p-1 shrink-0 flex items-center justify-center shadow-inner overflow-hidden">
                        <img src={companySettings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                  )}
                  <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{companySettings.name}</p>
                  </div>
              </div>
          )}
        </div>
        
        {/* Toggle Button for Collapsed Desktop Sidebar */}
        {!isSidebarOpen && (
             <button onClick={toggleSidebar} className="hidden md:flex w-full py-2 justify-center hover:bg-zinc-800 transition-colors border-b border-zinc-800/50">
                <Menu size={20} className="text-zinc-400" />
              </button>
        )}

        {/* Sidebar Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto no-scrollbar overflow-x-hidden">
          <SidebarItem to="/" icon={HomeIcon} label="Home" active={location.pathname === "/"} collapsed={!isSidebarOpen} />
          {hasModuleAccess('COMMERCIAL') && <SidebarItem to="/commercial" icon={ShoppingCart} label="Comercial" active={location.pathname === "/commercial"} collapsed={!isSidebarOpen} />}
          {hasModuleAccess('MASTER_DATA') && <SidebarItem to="/master-data" icon={Database} label="Datos Maestros" active={location.pathname === "/master-data"} collapsed={!isSidebarOpen} />}
          {hasModuleAccess('MAINTENANCE') && <SidebarItem to="/maintenance" icon={Wrench} label="Mantenimiento" active={location.pathname === "/maintenance"} collapsed={!isSidebarOpen} />}
          {hasModuleAccess('WAREHOUSE') && <SidebarItem to="/warehouse" icon={Package} label="Almacenes" active={location.pathname === "/warehouse"} collapsed={!isSidebarOpen} />}
          {hasModuleAccess('USERS') && <SidebarItem to="/users" icon={Users} label="Usuarios" active={location.pathname === "/users"} collapsed={!isSidebarOpen} />}
        </nav>

        {/* Sidebar Footer: User Info */}
        <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/30 shrink-0">
          <div className={`flex ${!isSidebarOpen ? 'flex-col items-center gap-3' : 'items-center space-x-3'}`}>
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0 relative shadow-sm">
                {userProfile?.avatarUrl ? (
                    <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <span>{userProfile?.firstName?.substring(0,1)}{userProfile?.lastName?.substring(0,1)}</span>
                )}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden animate-in fade-in slide-in-from-left-2 w-full">
                <p className="text-sm font-medium truncate text-zinc-200">{userProfile?.firstName} {userProfile?.lastName}</p>
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-zinc-500 truncate uppercase tracking-wider">{userProfile?.role}</p>
                    <button onClick={handleLogout} className="text-zinc-500 hover:text-red-400 transition-colors"><LogOut size={14}/></button>
                </div>
              </div>
            )}
            {!isSidebarOpen && (
                <button onClick={handleLogout} className="text-zinc-500 hover:text-red-400 hover:bg-zinc-800 p-2 rounded-lg transition-colors"><LogOut size={18}/></button>
            )}
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-zinc-50/50">
        <header className="h-16 bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-between px-4 md:px-6 z-10 border-b border-zinc-200/50 shrink-0">
          <div className="flex items-center gap-3">
              <button onClick={toggleSidebar} className="md:hidden text-zinc-500 p-1 hover:text-accent transition-colors"><Menu size={24} /></button>
              <HeaderTitle pathname={location.pathname} />
          </div>
          <div className="flex items-center">
            <LiveClock />
            <div className="h-8 w-px bg-zinc-200 mx-2 hidden md:block"></div>
            <NotificationsBtn />
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>
    </div>
  );
};

const Home = () => (
  <div className="h-full flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
    <div className="relative mb-8 scale-75 md:scale-100">
        <div className="relative w-48 h-48 flex items-center justify-center animate-float">
            <div className="absolute inset-0 bg-accent/5 rounded-full blur-3xl"></div>
            <div className="relative z-20 bg-white p-8 rounded-[2rem] shadow-2xl border border-zinc-100">
                <Layers size={64} className="text-accent" />
            </div>
        </div>
        {/* Icon Floating decorations to match user's screenshot */}
        <div className="absolute -top-4 -right-4 bg-white p-3 rounded-xl shadow-lg border border-zinc-100 animate-bounce delay-75"><ShoppingCart size={24} className="text-zinc-400"/></div>
        <div className="absolute top-1/2 -left-12 bg-white p-3 rounded-xl shadow-lg border border-zinc-100 animate-pulse"><Wrench size={24} className="text-zinc-400"/></div>
    </div>
    <div className="text-center max-w-lg">
        <h2 className="text-3xl md:text-4xl font-bold text-zinc-800 mb-4 tracking-tight">Bienvenido a PyME ERP</h2>
        <p className="text-zinc-500 text-lg leading-relaxed mb-2 font-medium">Sistema integral de gestión empresarial.</p>
        <p className="text-zinc-400 text-sm">Seleccione una funcionalidad en el menú lateral para comenzar a operar.</p>
        
        {/* Pagination indicator (purely cosmetic from screenshot) */}
        <div className="flex justify-center gap-2 mt-8">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-200"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-200"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
        </div>
    </div>
  </div>
);

function AppContent() {
    const { currentUser, loading } = useAuth();
    const [showSplash, setShowSplash] = useState(true);
    if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;
    if (!currentUser) return <Login />;
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
