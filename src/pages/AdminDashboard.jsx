import { Link } from 'react-router-dom';
import { UserCircle } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="flex justify-center items-center min-h-screen p-6 relative">

      {/* Tombol Login di Kanan Atas */}
      <div className="absolute top-6 right-6 z-50">
        <Link
          to="/login"
          className="flex items-center gap-2 bg-white/60 hover:bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm text-brand-dark font-bold transition-all border border-white"
        >
          <UserCircle size={20} />
        </Link>
      </div>

      <div className="glass-panel p-10 rounded-3xl w-full max-w-lg text-center relative overflow-hidden">

        <div className="relative z-10 mt-8">
          <h1 className="text-4xl font-extrabold text-brand-dark mb-2 tracking-tight">
            BSKM RW 12
          </h1>
          <p className="text-slate-500 mb-8 font-medium">
            Sistem Geospasial & Pendataan Warga
          </p>

          <div className="flex flex-col gap-4">
            <Link
              to="/form"
              className="glass-button px-6 py-3 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
            >
              Masuk Form Pendataan (Tim Lapangan)
            </Link>
          </div>

          {/* --- FOOTER LINK LEGAL --- */}
          <div className="mt-8 flex items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-bold text-slate-500">
            <Link to="/syarat-ketentuan" className="hover:text-brand transition-colors">
              Syarat & Ketentuan
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/kebijakan-privasi" className="hover:text-brand transition-colors">
              Kebijakan Privasi
            </Link>
          </div>
          {/* ------------------------ */}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;