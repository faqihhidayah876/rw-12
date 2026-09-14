import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu, X, Baby, Home, Users, Map as MapIcon, LogOut, User,
  ChevronUp, LayoutDashboard, UserMinus
} from 'lucide-react';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userData, setUserData] = useState(null);

  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
    } else {
      setUserData(JSON.parse(user));
    }
  }, [navigate]);

  // Tutup dropdown profil jika user klik di luar area
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const confirmLogout = () => {
    localStorage.removeItem('user');
    setShowLogoutModal(false);
    navigate('/login', { state: { pesanLogout: 'Anda telah berhasil keluar dari sistem.' } });
  };

  const navMenu = [
    { name: 'Ringkasan', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Data Warga', icon: <Users size={20} />, path: '/dashboard/warga' },
    { name: 'Data Rumah', icon: <Home size={20} />, path: '/dashboard/rumah' },
    { name: 'Riwayat Kelahiran', icon: <Baby size={20} />, path: '/dashboard/kelahiran' },
    { name: 'Riwayat Kematian', icon: <UserMinus size={20} />, path: '/dashboard/kematian' },
    { name: 'Peta Lokasi', icon: <MapIcon size={20} />, path: '/peta' },   // ← DIPERBAIKI
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">

      {/* Tombol Menu Mobile */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-white border border-slate-200 p-2 rounded-lg text-slate-700 shadow-sm"
      >
        <Menu size={24} />
      </button>

      {/* Overlay Gelap Mobile */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>

        {/* Header Sidebar */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            BSKM<span className="text-blue-600">Admin</span>
          </h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-500 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigasi Utama */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2">
            Menu Utama
          </p>
          {navMenu.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-sm ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {item.icon} {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Akun & Logout Dropdown */}
        <div className="relative p-4 border-t border-slate-200" ref={menuRef}>
          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-slate-200 rounded-lg shadow-lg p-1">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowLogoutModal(true);
                }}
                className="flex items-center gap-2 w-full p-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}

          {/* Tombol Profil */}
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
              <User size={18} />
            </div>
            <div className="text-left flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">
                {userData?.nama_lengkap || 'Pengurus'}
              </p>
              <p className="text-xs text-slate-500 font-medium truncate capitalize">
                {userData?.role || 'Admin'}
              </p>
            </div>
            <ChevronUp
              size={16}
              className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden">
        <div className="p-4 md:p-8 pt-16 md:pt-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* MODAL KONFIRMASI LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="text-red-600 w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Keluar</h3>
            <p className="text-sm text-slate-500 mb-6">
              Apakah Anda yakin ingin keluar dari sistem admin BSKM?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardLayout;