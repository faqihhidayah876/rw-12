import { useState, useEffect } from 'react';
import { Users, UserMinus, Activity, Wallet, Loader2, PieChart, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    keluarga: 0,
    wargaAktif: 0,
    kematian: 0,
    potensiKas: 0,
    demografi: { kk: 0, istri: 0, anak: 0, lainnya: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) setUserData(JSON.parse(user));

    const fetchStats = async () => {
      try {
        // 1. Ambil Total KK
        const { count: countKeluarga } = await supabase.from('keluarga').select('*', { count: 'exact', head: true });
        
        // 2. Ambil Total Warga Hidup
        const { count: countAktif } = await supabase.from('warga').select('*', { count: 'exact', head: true }).eq('status_warga', 'Hidup');
        
        // 3. Ambil Total Kematian
        const { count: countMeninggal } = await supabase.from('warga').select('*', { count: 'exact', head: true }).eq('status_warga', 'Meninggal');

        // 4. Tarik data khusus untuk membuat Grafik Demografi (Hanya yang Hidup)
        const { data: demografiData } = await supabase.from('warga').select('hubungan_keluarga').eq('status_warga', 'Hidup');
        
        let kk = 0, istri = 0, anak = 0, lainnya = 0;
        if (demografiData) {
          demografiData.forEach(d => {
            if (d.hubungan_keluarga === 'Kepala Keluarga') kk++;
            else if (d.hubungan_keluarga === 'Istri') istri++;
            else if (d.hubungan_keluarga === 'Anak') anak++;
            else lainnya++;
          });
        }

        setStats({
          keluarga: countKeluarga || 0,
          wargaAktif: countAktif || 0,
          kematian: countMeninggal || 0,
          potensiKas: (countKeluarga || 0) * 10000,
          demografi: { kk, istri, anak, lainnya }
        });
      } catch (error) {
        console.error("Gagal mengambil statistik:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Kalkulasi persentase untuk grafik
  const totalOrang = stats.wargaAktif || 1; // Cegah pembagian dengan 0
  const persentaseAnak = Math.round((stats.demografi.anak / totalOrang) * 100);
  const persentaseDewasa = Math.round(((stats.demografi.kk + stats.demografi.istri) / totalOrang) * 100);
  const persentaseLainnya = Math.round((stats.demografi.lainnya / totalOrang) * 100);

  return (
    <div className="space-y-6">
      {/* Header Sapaan */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Statistik BSKM</h1>
          <p className="text-slate-500 font-medium mt-1">Selamat bertugas, {userData?.nama_lengkap}. Berikut adalah metrik kependudukan terkini.</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold border border-blue-100">
          Status: Sistem Online Terhubung
        </div>
      </div>

      {/* Grid 4 Kartu Metrik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Jiwa (Aktif) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Warga (Aktif)</p>
            <h2 className="text-3xl font-extrabold text-slate-900">{stats.wargaAktif}</h2>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
        </div>

        {/* Total KK */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Kepala Keluarga</p>
            <h2 className="text-3xl font-extrabold text-slate-900">{stats.keluarga}</h2>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Activity size={24} /></div>
        </div>

        {/* Angka Kematian */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Angka Kematian</p>
            <h2 className="text-3xl font-extrabold text-red-600">{stats.kematian}</h2>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl"><UserMinus size={24} /></div>
        </div>

        {/* Potensi Kas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Potensi BSKM / Bulan</p>
            <h2 className="text-2xl font-extrabold text-emerald-600 mt-1">{formatRupiah(stats.potensiKas)}</h2>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Wallet size={24} /></div>
        </div>

      </div>

      {/* Bagian Bawah: Visualisasi Grafik (Tanpa Plugin Eksternal) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Grafik 1: Proporsi Demografi Warga */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="text-indigo-500" size={20}/> Demografi Warga (Aktif)
            </h3>
          </div>
          
          <div className="space-y-4">
            {/* Bar Anak */}
            <div>
              <div className="flex justify-between text-sm mb-1 font-semibold text-slate-700">
                <span>Kategori Anak</span>
                <span>{stats.demografi.anak} Jiwa ({persentaseAnak}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${persentaseAnak}%` }}></div>
              </div>
            </div>

            {/* Bar Dewasa (KK + Istri) */}
            <div>
              <div className="flex justify-between text-sm mb-1 font-semibold text-slate-700">
                <span>Kategori Dewasa (Suami & Istri)</span>
                <span>{stats.demografi.kk + stats.demografi.istri} Jiwa ({persentaseDewasa}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${persentaseDewasa}%` }}></div>
              </div>
            </div>

            {/* Bar Lainnya */}
            <div>
              <div className="flex justify-between text-sm mb-1 font-semibold text-slate-700">
                <span>Lainnya (Mertua, Famili, dll)</span>
                <span>{stats.demografi.lainnya} Jiwa ({persentaseLainnya}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-slate-400 h-3 rounded-full" style={{ width: `${persentaseLainnya}%` }}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Grafik 2: Rincian Keuangan Kas BSKM */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
          <BarChart3 className="text-slate-300 w-16 h-16 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Modul Keuangan Segera Hadir</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Saat ini perhitungan potensi kas adalah <strong>{formatRupiah(stats.potensiKas)}</strong> yang berasal dari <strong>{stats.keluarga} Kepala Keluarga</strong>. Fitur pelacakan iuran warga per-blok sedang dikembangkan.
          </p>
        </div>

      </div>
    </div>
  );
};

export default DashboardOverview;