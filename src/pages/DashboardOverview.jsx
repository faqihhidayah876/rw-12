import { useState, useEffect } from 'react';
import { Home, Users, UserPlus, Wallet, Loader2, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    rumah: 0,
    keluarga: 0,
    warga: 0,
    potensiKas: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Ambil data user yang sedang login
    const user = localStorage.getItem('user');
    if (user) setUserData(JSON.parse(user));

    const fetchStats = async () => {
      try {
        // Tarik jumlah total baris dari masing-masing tabel (head: true agar ringan, tidak download datanya)
        const { count: countRumah } = await supabase.from('rumah').select('*', { count: 'exact', head: true });
        const { count: countKeluarga } = await supabase.from('keluarga').select('*', { count: 'exact', head: true });
        // Hitung warga yang statusnya 'Hidup'
        const { count: countWarga } = await supabase.from('warga').select('*', { count: 'exact', head: true }).eq('status_warga', 'Hidup');

        setStats({
          rumah: countRumah || 0,
          keluarga: countKeluarga || 0,
          warga: countWarga || 0,
          potensiKas: (countKeluarga || 0) * 10000 // Rp 10.000 per KK
        });
      } catch (error) {
        console.error("Gagal mengambil statistik:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Format Rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Sapaan */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-brand flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Selamat datang, {userData?.nama_lengkap}! 👋</h1>
          <p className="text-slate-500 font-medium mt-1">Berikut adalah ringkasan data kependudukan dan BSKM RW 12 saat ini.</p>
        </div>
      </div>

      {/* Grid Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Kartu 1: Total Rumah */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Rumah</p>
              <h2 className="text-3xl font-extrabold text-slate-800">{stats.rumah}</h2>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Home size={24} />
            </div>
          </div>
        </div>

        {/* Kartu 2: Total KK */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-100 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total KK</p>
              <h2 className="text-3xl font-extrabold text-slate-800">{stats.keluarga}</h2>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* Kartu 3: Total Jiwa */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Warga</p>
              <h2 className="text-3xl font-extrabold text-slate-800">{stats.warga}</h2>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <UserPlus size={24} />
            </div>
          </div>
        </div>

        {/* Kartu 4: Potensi Kas */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-100 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Potensi BSKM/Bln</p>
              <h2 className="text-2xl font-extrabold text-slate-800 mt-1">{formatRupiah(stats.potensiKas)}</h2>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Wallet size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* Bagian Bawah: Info Tambahan (Mockup) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="text-brand" size={20}/> Aktivitas Pendataan Terbaru
          </h3>
          <div className="bg-white/50 rounded-xl p-8 text-center border border-dashed border-slate-300">
            <p className="text-slate-500 text-sm">Grafik atau daftar log aktivitas warga baru akan ditampilkan di sini.</p>
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={20}/> Status Pembayaran Kas
          </h3>
          <div className="bg-white/50 rounded-xl p-8 text-center border border-dashed border-slate-300">
            <p className="text-slate-500 text-sm">Sistem tracking lunas/nunggak iuran BSKM akan segera hadir.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;