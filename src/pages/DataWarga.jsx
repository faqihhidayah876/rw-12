import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Loader2, Search, Image as ImageIcon, Edit, Trash2, X,
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, MapPin
} from 'lucide-react';

// Import Peta
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Komponen untuk menangkap klik di Peta
const LocationSelector = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position.lat ? <Marker position={[position.lat, position.lng]} /> : null;
};

const DataWarga = () => {
  const [dataWarga, setDataWarga] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [editData, setEditData] = useState(null);
  const [editLocation, setEditLocation] = useState({ lat: 0, lng: 0 });
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State alert (menggantikan successMsg) — mendukung success & error
  const [alertMsg, setAlertMsg] = useState({ show: false, type: 'success', message: '' });

  // Cek role admin
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('warga')
        .select(`
          id, nik, nama_lengkap, hubungan_keluarga, status_warga,
          keluarga (
            id, no_kk, file_kk_url, rt,
            rumah ( id, blok_nomor, koordinat_lat, koordinat_lng )
          )
        `)
        .order('id', { ascending: false });

      if (error) throw error;
      setDataWarga(data || []);
    } catch (error) {
      console.error("Gagal menarik data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- BUKA MODAL HAPUS ---
  const openDeleteModal = (warga) => {
    setDeleteTarget({ id: warga.id, nama: warga.nama_lengkap });
  };

  // 2. Fungsi Mengeksekusi Hapus ke Supabase (Database + Storage)
  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      // 1. Panggil fungsi pintar di database
      const { data: fileUrl, error } = await supabase.rpc('hapus_warga_pintar', {
        p_warga_id: deleteTarget.id
      });

      if (error) throw error;

      // 2. Jika yang dihapus Kepala Keluarga & Punya Foto KK
      if (fileUrl && fileUrl !== 'HANYA_WARGA' && fileUrl.includes('berkas_warga/')) {
        // Ambil nama file asli dari ujung URL (misal: 123456_170000.jpg)
        const fileName = fileUrl.split('/').pop();

        // Hapus file tersebut dari Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('berkas_warga')
          .remove([fileName]);

        if (storageError) {
          console.error("Gagal membersihkan foto KK di Storage:", storageError);
        }
      }

      // 3. Refresh data dari server agar tabel langsung akurat (termasuk anak/istri yang ikut terhapus)
      fetchData();
      setDeleteTarget(null);
      setAlertMsg({ show: true, type: 'success', message: 'Data berhasil dihapus dari sistem.' });

    } catch (error) {
      setDeleteTarget(null);
      setAlertMsg({ show: true, type: 'error', message: 'Gagal menghapus data: ' + error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  // --- BUKA MODAL EDIT & SET KOORDINAT AWAL ---
  const openEditModal = (warga) => {
    setEditData(warga);
    setEditLocation({
      lat: warga.keluarga?.rumah?.koordinat_lat || 0.5333,   // Default Pekanbaru
      lng: warga.keluarga?.rumah?.koordinat_lng || 101.4500,
    });
  };

  // --- SIMPAN PERUBAHAN (Warga + Lokasi Rumah) ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      // 1. Update data warga
      const { error: errWarga } = await supabase
        .from('warga')
        .update({
          nama_lengkap: editData.nama_lengkap,
          nik: editData.nik,
          hubungan_keluarga: editData.hubungan_keluarga,
          status_warga: editData.status_warga,
        })
        .eq('id', editData.id);

      if (errWarga) throw errWarga;

      // 2. Update koordinat rumah
      if (editData.keluarga?.rumah?.id) {
        const { error: errRumah } = await supabase
          .from('rumah')
          .update({
            koordinat_lat: editLocation.lat,
            koordinat_lng: editLocation.lng,
          })
          .eq('id', editData.keluarga.rumah.id);

        if (errRumah) throw errRumah;
      }

      setEditData(null);
      setAlertMsg({ show: true, type: 'success', message: 'Data warga dan lokasi rumah berhasil diperbarui.' });
      fetchData();
    } catch (error) {
      setAlertMsg({ show: true, type: 'error', message: 'Gagal memperbarui: ' + error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  // --- FILTER & PAGINATION ---
  const filteredData = dataWarga.filter(warga =>
    warga.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warga.nik?.includes(searchTerm) ||
    warga.keluarga?.rumah?.blok_nomor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Kependudukan</h1>
          <p className="text-sm text-slate-500 mt-1">Manajemen basis data warga, arsip Kartu Keluarga, dan titik lokasi rumah.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama, NIK, atau Blok..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Nama & NIK</th>
                <th className="px-6 py-4 font-semibold">Blok & RT</th>
                <th className="px-6 py-4 font-semibold">Hubungan</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Arsip KK</th>
                {isAdmin && <th className="px-6 py-4 font-semibold text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                    Memuat data warga...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data yang ditemukan.
                  </td>
                </tr>
              ) : (
                currentItems.map((warga) => (
                  <tr key={warga.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{warga.nama_lengkap}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{warga.nik}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">Blok {warga.keluarga?.rumah?.blok_nomor || '-'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">RT {warga.keluarga?.rt || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        warga.hubungan_keluarga === 'Kepala Keluarga'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {warga.hubungan_keluarga}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        warga.status_warga === 'Meninggal'
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : warga.status_warga === 'Pindah'
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-green-50 text-green-700 border border-green-100'
                      }`}>
                        {warga.status_warga || 'Hidup'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {warga.keluarga?.file_kk_url ? (
                        <button
                          onClick={() => setSelectedPhoto(warga.keluarga.file_kk_url)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <ImageIcon size={14} /> Lihat
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Tidak ada foto</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(warga)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(warga)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-500">
              Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} dari {filteredData.length} data
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-300 text-slate-600 disabled:opacity-50 disabled:bg-slate-100 hover:bg-white"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-300 text-slate-600 disabled:opacity-50 disabled:bg-slate-100 hover:bg-white"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL EDIT DATA & PETA --- */}
      {editData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
              <h3 className="font-bold text-slate-800">Edit Data & Lokasi Warga</h3>
              <button
                onClick={() => setEditData(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editData.nama_lengkap}
                    onChange={e => setEditData({ ...editData, nama_lengkap: e.target.value })}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIK</label>
                  <input
                    type="number"
                    value={editData.nik}
                    onChange={e => setEditData({ ...editData, nik: e.target.value })}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hubungan Keluarga</label>
                  <select
                    value={editData.hubungan_keluarga}
                    onChange={e => setEditData({ ...editData, hubungan_keluarga: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="Kepala Keluarga">Kepala Keluarga</option>
                    <option value="Istri">Istri</option>
                    <option value="Suami">Suami</option>
                    <option value="Anak">Anak</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Warga</label>
                  <select
                    value={editData.status_warga}
                    onChange={e => setEditData({ ...editData, status_warga: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="Hidup">Hidup</option>
                    <option value="Meninggal">Meninggal</option>
                    <option value="Pindah">Pindah</option>
                  </select>
                </div>
              </div>

              {/* WIDGET PETA INTERAKTIF */}
              <div className="mt-6">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <MapPin size={14} className="text-blue-500" />
                  Geser & Klik Peta untuk Mengubah Lokasi Rumah
                </label>
                <div className="h-48 w-full rounded-xl overflow-hidden border border-slate-300 relative z-0">
                  <MapContainer
                    center={[editLocation.lat, editLocation.lng]}
                    zoom={17}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationSelector position={editLocation} setPosition={setEditLocation} />
                  </MapContainer>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                  Titik biru menandakan lokasi yang akan disimpan.
                </p>
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-4 flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="animate-spin" size={18} /> : 'Simpan Perubahan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL LIHAT FOTO KK --- */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Arsip Kartu Keluarga</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-slate-50 flex justify-center">
              <img src={selectedPhoto} alt="Foto KK" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL KONFIRMASI HAPUS --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center transform animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 className="text-red-500 w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Data Warga?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus data <b>{deleteTarget.nama}</b>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL ALERT (Sukses / Error) --- */}
      {alertMsg.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center transform animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border ${
              alertMsg.type === 'error'
                ? 'bg-red-50 border-red-100'
                : 'bg-green-50 border-green-100'
            }`}>
              {alertMsg.type === 'error'
                ? <AlertCircle className="text-red-500 w-6 h-6" />
                : <CheckCircle2 className="text-green-500 w-6 h-6" />}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {alertMsg.type === 'error' ? 'Gagal!' : 'Berhasil!'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">{alertMsg.message}</p>
            <button
              onClick={() => setAlertMsg({ show: false, type: 'success', message: '' })}
              className={`w-full py-2.5 rounded-xl font-medium text-white transition-colors shadow-sm ${
                alertMsg.type === 'error'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataWarga;