import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Loader2, Search, Plus, MapPin, X, Trash2, Home,
  AlertTriangle, CheckCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const LocationSelector = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position.lat ? <Marker position={[position.lat, position.lng]} /> : null;
};

const DataRumah = () => {
  const [dataRumah, setDataRumah] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua'); // Semua | Berpenghuni | Kosong

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State (Tambah Rumah)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({ blok_nomor: '', rt: '01' });
  const [formLocation, setFormLocation] = useState({ lat: 0.5333, lng: 101.4500 });

  // State Modal Hapus & Notifikasi
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ show: false, type: '', message: '' });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rumah')
        .select(`
          id, blok_nomor, rt, koordinat_lat, koordinat_lng,
          keluarga ( id, warga ( status_warga ) )
        `)
        .order('blok_nomor', { ascending: true });

      if (error) throw error;

      // Format data untuk menentukan apakah rumah berpenghuni
      const formattedData = data.map(rumah => {
        let isBerpenghuni = false;
        if (rumah.keluarga && rumah.keluarga.length > 0) {
          rumah.keluarga.forEach(kel => {
            if (kel.warga && kel.warga.some(w => w.status_warga === 'Hidup')) {
              isBerpenghuni = true;
            }
          });
        }
        return { ...rumah, status: isBerpenghuni ? 'Berpenghuni' : 'Kosong' };
      });

      setDataRumah(formattedData);
    } catch (error) {
      console.error("Gagal menarik data rumah:", error);
      setAlertMsg({ show: true, type: 'error', message: 'Gagal memuat data: ' + error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('rumah').insert({
        blok_nomor: formData.blok_nomor,
        rt: formData.rt,
        koordinat_lat: formLocation.lat,
        koordinat_lng: formLocation.lng,
        status_hunian: 'Kosong'
      });

      if (error) throw error;

      setIsModalOpen(false);
      setFormData({ blok_nomor: '', rt: '01' });
      await fetchData();
      setAlertMsg({
        show: true,
        type: 'success',
        message: 'Rumah Kosong berhasil ditambahkan ke sistem & peta!'
      });
    } catch (error) {
      setAlertMsg({ show: true, type: 'error', message: 'Gagal menambahkan rumah: ' + error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- BUKA MODAL HAPUS ---
  const confirmDelete = (rumah) => {
    setDeleteTarget(rumah);
  };

  // --- EKSEKUSI HAPUS ---
  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('rumah')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      setDataRumah(dataRumah.filter(r => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      setAlertMsg({
        show: true,
        type: 'success',
        message: 'Rumah berhasil dihapus dari sistem.'
      });
    } catch (error) {
      setDeleteTarget(null);
      setAlertMsg({ show: true, type: 'error', message: 'Gagal menghapus: ' + error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  // --- FILTER & PAGINATION ---
  const filteredData = dataRumah.filter(rumah => {
    const matchesSearch = rumah.blok_nomor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'Semua' || rumah.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Rumah</h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar blok rumah kosong dan berpenghuni di RW 12.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-colors"
          >
            <Plus size={18} /> Tambah Rumah Kosong
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari nomor blok..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto">
          {['Semua', 'Berpenghuni', 'Kosong'].map(stat => (
            <button
              key={stat}
              onClick={() => { setFilterStatus(stat); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                filterStatus === stat
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {stat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Data Rumah */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Blok Rumah</th>
                <th className="px-6 py-4 font-semibold">Wilayah RT</th>
                <th className="px-6 py-4 font-semibold">Status Hunian</th>
                <th className="px-6 py-4 font-semibold">Koordinat GPS</th>
                {isAdmin && <th className="px-6 py-4 font-semibold text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                    Memuat data...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data rumah.
                  </td>
                </tr>
              ) : (
                currentItems.map((rumah) => (
                  <tr key={rumah.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          rumah.status === 'Berpenghuni'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          <Home size={18} />
                        </div>
                        <p className="font-extrabold text-slate-900 text-base">
                          Blok {rumah.blok_nomor}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      RT {rumah.rt || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        rumah.status === 'Berpenghuni'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {rumah.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {rumah.koordinat_lat && rumah.koordinat_lng
                        ? `${rumah.koordinat_lat.toFixed(5)}, ${rumah.koordinat_lng.toFixed(5)}`
                        : <span className="italic text-slate-400">Belum ada</span>}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => confirmDelete(rumah)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Permanen"
                        >
                          <Trash2 size={18} />
                        </button>
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

      {/* --- MODAL TAMBAH RUMAH KOSONG --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MapPin size={18} className="text-blue-600" /> Data Rumah Kosong
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blok & Nomor</label>
                  <input
                    type="text"
                    value={formData.blok_nomor}
                    onChange={e => setFormData({ ...formData, blok_nomor: e.target.value })}
                    placeholder="Contoh: A 12"
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Wilayah RT</label>
                  <select
                    value={formData.rt}
                    onChange={e => setFormData({ ...formData, rt: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="01">RT 01</option>
                    <option value="02">RT 02</option>
                    <option value="03">RT 03</option>
                    <option value="04">RT 04</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tandai Lokasi Rumah di Peta
                </label>
                <div className="h-56 w-full rounded-xl overflow-hidden border border-slate-300 relative">
                  <MapContainer
                    center={[formLocation.lat, formLocation.lng]}
                    zoom={18}
                    maxZoom={22}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      maxNativeZoom={19}
                      maxZoom={22}
                    />
                    <LocationSelector position={formLocation} setPosition={setFormLocation} />
                  </MapContainer>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                  *Geser peta dan klik pada atap rumah yang kosong untuk menitik kordinat.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-4 flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting
                  ? <Loader2 className="animate-spin" size={18} />
                  : 'Simpan Rumah Kosong ke Peta'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL KONFIRMASI HAPUS --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-red-600 w-8 h-8" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              Hapus Rumah?
            </h3>

            <div className="text-sm text-slate-600 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
              Anda akan menghapus <strong>Blok {deleteTarget.blok_nomor}</strong>{' '}
              (RT {deleteTarget.rt || '-'}) dari sistem dan peta secara permanen.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL NOTIFIKASI (SUKSES / GAGAL) --- */}
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
              onClick={() => setAlertMsg({ show: false, type: '', message: '' })}
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

export default DataRumah;