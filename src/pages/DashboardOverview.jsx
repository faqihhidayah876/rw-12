import { useState, useEffect } from 'react';
import {
  Users, UserMinus, Activity, Wallet, Loader2, PieChart, BarChart3,
  FileSpreadsheet, CheckCircle, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Import library Excel
import * as XLSX from 'xlsx';

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    keluarga: 0,
    wargaAktif: 0,
    kematian: 0,
    potensiKas: 0,
    demografi: { kk: 0, istri: 0, anak: 0, lainnya: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [userData, setUserData] = useState(null);

  // State alert (menggantikan alert() native)
  const [alertMsg, setAlertMsg] = useState({ show: false, type: 'success', message: '' });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) setUserData(JSON.parse(user));

    const fetchStats = async () => {
      try {
        // 1. Ambil Total Warga Hidup
        const { count: countAktif } = await supabase
          .from('warga')
          .select('*', { count: 'exact', head: true })
          .eq('status_warga', 'Hidup');

        // 2. Ambil Total Kematian
        const { count: countMeninggal } = await supabase
          .from('warga')
          .select('*', { count: 'exact', head: true })
          .eq('status_warga', 'Meninggal');

        // 3. Tarik data untuk Demografi
        const { data: demografiData } = await supabase
          .from('warga')
          .select('hubungan_keluarga')
          .eq('status_warga', 'Hidup');

        let kk = 0, istri = 0, anak = 0, lainnya = 0;
        if (demografiData) {
          demografiData.forEach(d => {
            if (d.hubungan_keluarga === 'Kepala Keluarga') kk++;
            else if (d.hubungan_keluarga === 'Istri') istri++;
            else if (d.hubungan_keluarga === 'Anak') anak++;
            else lainnya++;
          });
        }

        // 4. Tarik Keluarga dan cek status warganya
        const { data: keluargaData } = await supabase
          .from('keluarga')
          .select('id, warga(status_warga)');

        let jumlahKeluargaAktif = 0;
        if (keluargaData) {
          jumlahKeluargaAktif = keluargaData.filter(kel =>
            kel.warga && kel.warga.some(w => w.status_warga === 'Hidup')
          ).length;
        }

        // Simpan Data
        setStats({
          keluarga: kk,
          wargaAktif: countAktif || 0,
          kematian: countMeninggal || 0,
          potensiKas: jumlahKeluargaAktif * 10000,
          demografi: { kk, istri, anak, lainnya }
        });
      } catch (error) {
        console.error("Gagal mengambil statistik:", error);
        setAlertMsg({
          show: true,
          type: 'error',
          message: 'Gagal memuat statistik: ' + error.message
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(angka);
  };

  // --- FUNGSI EKSPOR KE EXCEL ---
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      // 1. Tarik Data Warga & Keluarga & Rumah
      const { data: dbWarga, error: errWarga } = await supabase
        .from('warga')
        .select(`
          nik, nama_lengkap, hubungan_keluarga, status_warga, tanggal_kematian,
          keluarga ( no_kk, rt, rumah ( blok_nomor ) )
        `)
        .order('keluarga_id', { ascending: true });

      if (errWarga) throw errWarga;

      // 2. Tarik Data Rumah
      const { data: dbRumah, error: errRumah } = await supabase
        .from('rumah')
        .select(`blok_nomor, rt, status_hunian, koordinat_lat, koordinat_lng`)
        .order('blok_nomor', { ascending: true });

      if (errRumah) throw errRumah;

      // 3. Pisahkan & Format Data untuk Excel
      const dataWargaAktif = [];
      const dataKematian = [];

      dbWarga?.forEach(w => {
        const row = {
          'No. KK': w.keluarga?.no_kk || '-',
          'NIK': w.nik,
          'Nama Lengkap': w.nama_lengkap,
          'Hubungan': w.hubungan_keluarga,
          'Wilayah RT': `RT ${w.keluarga?.rt || '-'}`,
          'Blok Rumah': `Blok ${w.keluarga?.rumah?.blok_nomor || '-'}`
        };

        if (w.status_warga === 'Hidup') {
          dataWargaAktif.push(row);
        } else if (w.status_warga === 'Meninggal') {
          row['Tanggal Wafat Tercatat'] = w.tanggal_kematian
            ? new Date(w.tanggal_kematian).toLocaleString('id-ID')
            : 'Data Lama';
          dataKematian.push(row);
        }
      });

      const dataRumahExcel = dbRumah?.map(r => ({
        'Blok Rumah': r.blok_nomor,
        'Wilayah RT': r.rt ? `RT ${r.rt}` : '-',
        'Status Hunian': r.status_hunian,
        'Koordinat (Lat)': r.koordinat_lat,
        'Koordinat (Lng)': r.koordinat_lng
      }));

      // 4. Buat Workbook Excel dan Masukkan Sheet-nya
      const wb = XLSX.utils.book_new();

      const wsWarga = XLSX.utils.json_to_sheet(dataWargaAktif);
      XLSX.utils.book_append_sheet(wb, wsWarga, "Warga Aktif");

      const wsKematian = XLSX.utils.json_to_sheet(dataKematian);
      XLSX.utils.book_append_sheet(wb, wsKematian, "Riwayat Kematian");

      const wsRumah = XLSX.utils.json_to_sheet(dataRumahExcel);
      XLSX.utils.book_append_sheet(wb, wsRumah, "Data Rumah");

      // 5. Download File (Generate nama file otomatis dengan tanggal)
      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Laporan_BSKM_RW12_${dateStr}.xlsx`);

      setAlertMsg({
        show: true,
        type: 'success',
        message: 'Laporan Excel berhasil diunduh.'
      });
    } catch (error) {
      console.error("Gagal ekspor excel:", error);
      setAlertMsg({
        show: true,
        type: 'error',
        message: 'Gagal mengunduh data: ' + error.message
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Kalkulasi persentase untuk grafik
  const totalOrang = stats.wargaAktif || 1;
  const persentaseAnak = Math.round((stats.demografi.anak / totalOrang) * 100);
  const persentaseDewasa = Math.round(((stats.demografi.kk + stats.demografi.istri) / totalOrang) * 100);
  const persentaseLainnya = Math.round((stats.demografi.lainnya / totalOrang) * 100);

  return (
    <div className="space-y-6">
      {/* Header Sapaan & Tombol Export */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Statistik BSKM</h1>
          <p className="text-slate-500 font-medium mt-1">
            Selamat bertugas, {userData?.nama_lengkap}. Berikut adalah metrik kependudukan terkini.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="hidden sm:block bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-bold border border-blue-100">
            Sistem Aktif
          </div>

          {/* Tombol Excel */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <FileSpreadsheet size={18} />
            )}
            {isExporting ? 'Memproses...' : 'Unduh Excel'}
          </button>
        </div>
      </div>

      {/* Grid 4 Kartu Metrik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Jiwa (Aktif) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Warga (Aktif)
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900">{stats.wargaAktif}</h2>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
        </div>

        {/* Total KK */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Kepala Keluarga
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900">{stats.keluarga}</h2>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Activity size={24} /></div>
        </div>

        {/* Angka Kematian */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Angka Kematian
            </p>
            <h2 className="text-3xl font-extrabold text-red-600">{stats.kematian}</h2>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl"><UserMinus size={24} /></div>
        </div>

        {/* Potensi Kas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Potensi BSKM / Bulan
            </p>
            <h2 className="text-2xl font-extrabold text-emerald-600 mt-1">
              {formatRupiah(stats.potensiKas)}
            </h2>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Wallet size={24} /></div>
        </div>
      </div>

      {/* Bagian Bawah: Visualisasi Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Grafik 1: Proporsi Demografi Warga */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="text-indigo-500" size={20} /> Demografi Warga (Aktif)
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
                <div
                  className="bg-emerald-500 h-3 rounded-full"
                  style={{ width: `${persentaseAnak}%` }}
                ></div>
              </div>
            </div>

            {/* Bar Dewasa */}
            <div>
              <div className="flex justify-between text-sm mb-1 font-semibold text-slate-700">
                <span>Kategori Dewasa (Suami & Istri)</span>
                <span>{stats.demografi.kk + stats.demografi.istri} Jiwa ({persentaseDewasa}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ width: `${persentaseDewasa}%` }}
                ></div>
              </div>
            </div>

            {/* Bar Lainnya */}
            <div>
              <div className="flex justify-between text-sm mb-1 font-semibold text-slate-700">
                <span>Lainnya (Mertua, Famili, dll)</span>
                <span>{stats.demografi.lainnya} Jiwa ({persentaseLainnya}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="bg-slate-400 h-3 rounded-full"
                  style={{ width: `${persentaseLainnya}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Grafik 2: Rincian Keuangan Kas BSKM */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
          <BarChart3 className="text-slate-300 w-16 h-16 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Modul Keuangan Segera Hadir</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Saat ini perhitungan potensi kas adalah <strong>{formatRupiah(stats.potensiKas)}</strong>{' '}
            yang berasal dari <strong>{stats.keluarga} Kepala Keluarga</strong>. Fitur pelacakan
            iuran warga per-blok sedang dikembangkan.
          </p>
        </div>
      </div>

      {/* --- MODAL ALERT --- */}
      {alertMsg.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
              alertMsg.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
            }`}>
              {alertMsg.type === 'success'
                ? <CheckCircle className="text-emerald-600 w-7 h-7" />
                : <X className="text-red-600 w-7 h-7" />}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {alertMsg.type === 'success' ? 'Berhasil!' : 'Terjadi Kesalahan'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">{alertMsg.message}</p>
            <button
              onClick={() => setAlertMsg({ show: false, type: 'success', message: '' })}
              className={`w-full py-2.5 rounded-xl font-bold text-white transition-colors ${
                alertMsg.type === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;