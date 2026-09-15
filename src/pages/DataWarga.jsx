import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  Loader2, Search, Image as ImageIcon, Edit, Trash2, X,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, ShieldAlert,
  MapPin, UserPlus, ScanText
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

  // State alert
  const [alertMsg, setAlertMsg] = useState({ show: false, type: 'success', message: '' });

  // State untuk fitur Tambah Anggota Keluarga
  const [addMemberModal, setAddMemberModal] = useState(null);
  const [newMemberForm, setNewMemberForm] = useState({
    nik: '',
    nama_lengkap: '',
    hubungan_keluarga: 'Anak',
    status_warga: 'Hidup',
  });
  const [isNewborn, setIsNewborn] = useState(false);

  // State & ref untuk fitur OCR Scan KTP (via Vercel API proxy)
  const [isScanningKTP, setIsScanningKTP] = useState(false);
  const fileInputRef = useRef(null);

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
          tanggal_kematian, tanggal_kelahiran_tercatat,
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
      setAlertMsg({ show: true, type: 'error', message: 'Gagal memuat data: ' + error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // --- BUKA MODAL HAPUS ---
  const confirmDelete = (warga) => {
    setDeleteTarget(warga);
  };

  // --- EKSEKUSI HAPUS (Database + Storage) ---
  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { data: fileUrl, error } = await supabase.rpc('hapus_warga_pintar', {
        p_warga_id: deleteTarget.id
      });

      if (error) throw error;

      if (fileUrl && fileUrl !== 'HANYA_WARGA' && fileUrl.includes('berkas_warga/')) {
        const fileName = fileUrl.split('/').pop();
        const { error: storageError } = await supabase.storage
          .from('berkas_warga')
          .remove([fileName]);

        if (storageError) {
          console.error("Gagal membersihkan foto KK di Storage:", storageError);
        }
      }

      await fetchData();
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
      lat: warga.keluarga?.rumah?.koordinat_lat || 0.5333,
      lng: warga.keluarga?.rumah?.koordinat_lng || 101.4500,
    });
  };

  // --- SIMPAN PERUBAHAN (Warga + Lokasi Rumah) ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const payloadWarga = {
        nama_lengkap: editData.nama_lengkap,
        nik: editData.nik,
        hubungan_keluarga: editData.hubungan_keluarga,
        status_warga: editData.status_warga,
      };

      // Auto-catat tanggal kematian
      if (editData.status_warga === 'Meninggal' && !editData.tanggal_kematian) {
        payloadWarga.tanggal_kematian = new Date().toISOString();
      } else if (editData.status_warga !== 'Meninggal') {
        payloadWarga.tanggal_kematian = null;
      }

      // 1. Update data warga
      const { error: errWarga } = await supabase
        .from('warga')
        .update(payloadWarga)
        .eq('id', editData.id);

      if (errWarga) throw errWarga;

      // 2. Update koordinat rumah (jika ada relasi rumah)
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
      await fetchData();
      setAlertMsg({ show: true, type: 'success', message: 'Data warga dan lokasi rumah berhasil diperbarui.' });
    } catch (error) {
      setAlertMsg({ show: true, type: 'error', message: 'Gagal memperbarui: ' + error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  // ============================================================
  // --- OCR SCAN KTP VIA VERCEL API PROXY (/api/ocr) ---
  // ============================================================
  const handleScanKTP = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanningKTP(true);
    try {
      // 1. Convert gambar KTP ke Base64 (Data URI)
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });

      // 2. Tembak ke endpoint Vercel lokal (Server-side proxy)
      //    API Key Mistral disimpan aman di server, TIDAK di client.
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image })
      });

      // 3. Error handling
      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.error('OCR API Error:', response.status, errorBody);

        if (response.status === 429) {
          throw new Error('QUOTA_EXCEEDED');
        }
        throw new Error('API_ERROR');
      }

      const responseData = await response.json();

      // 4. Gabungkan seluruh teks markdown dari semua halaman
      // Struktur response OCR: { pages: [{ index, markdown, images, dimensions }], model, usage_info }
      const fullMarkdown = (responseData.pages || [])
        .map((p) => p.markdown || '')
        .join('\n')
        .trim();

      if (!fullMarkdown) {
        throw new Error('AI tidak mengembalikan teks dari gambar KTP. Coba foto yang lebih jelas.');
      }

      console.log('📄 Raw OCR markdown (KTP):', fullMarkdown);

      // 5. Parsing NIK (16 digit berurutan)
      const nikMatch = fullMarkdown.match(/\b(\d{16})\b/);
      const nik = nikMatch ? nikMatch[1] : '';

      // 6. Parsing Nama
      // Coba beberapa pattern: "Nama: X", "Nama : X", "**Nama:** X", "Nama Lengkap: X"
      let nama = '';
      const namaMatch =
        fullMarkdown.match(/(?:\*\*)?Nama(?:\s*Lengkap)?(?:\*\*)?\s*[:\-]\s*([^\n\r*_`]+)/i);
      if (namaMatch) {
        nama = namaMatch[1].trim();
      }

      // Bersihkan sisa karakter markdown jika ada
      nama = nama.replace(/[*_`#]/g, '').trim().toUpperCase();

      // 7. Auto-fill form
      if (nik || nama) {
        setNewMemberForm((prev) => ({
          ...prev,
          nik: nik || prev.nik,
          nama_lengkap: nama || prev.nama_lengkap,
        }));

        const detected = [];
        if (nik) detected.push(`NIK: ${nik}`);
        if (nama) detected.push(`Nama: ${nama}`);

        setAlertMsg({
          show: true,
          type: 'success',
          message: `KTP berhasil dipindai! Terdeteksi → ${detected.join(' | ')}`,
        });
      } else {
        // Kalau parsing gagal, tampilkan info raw text
        setAlertMsg({
          show: true,
          type: 'error',
          message: 'Gambar berhasil dibaca, tapi NIK/Nama tidak terdeteksi. Coba foto yang lebih jelas atau isi manual.',
        });
      }

    } catch (error) {
      console.error(error);

      if (error.message === 'QUOTA_EXCEEDED') {
        setAlertMsg({
          show: true,
          type: 'error',
          message: 'Limit AI Tercapai / Kuota Habis! Silakan isi data anggota secara manual.',
        });
      } else if (error.message === 'API_ERROR') {
        setAlertMsg({
          show: true,
          type: 'error',
          message: 'Koneksi ke server AI gagal. Silakan isi data anggota secara manual, atau coba lagi nanti.',
        });
      } else {
        setAlertMsg({
          show: true,
          type: 'error',
          message: 'Gagal memindai KTP: ' + error.message,
        });
      }
    } finally {
      setIsScanningKTP(false);
      // Kosongkan input file agar bisa pilih gambar yang sama lagi
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- SUBMIT ANGGOTA BARU ---
  const submitNewMember = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const payloadBaru = {
        keluarga_id: addMemberModal.keluarga.id,
        nik: newMemberForm.nik,
        nama_lengkap: newMemberForm.nama_lengkap,
        hubungan_keluarga: newMemberForm.hubungan_keluarga,
        status_warga: newMemberForm.status_warga,
      };

      // Jika Anak + Baru Lahir, catat waktunya
      if (newMemberForm.hubungan_keluarga === 'Anak' && isNewborn) {
        payloadBaru.tanggal_kelahiran_tercatat = new Date().toISOString();
      }

      const { error } = await supabase.from('warga').insert(payloadBaru);

      if (error) throw error;

      setAddMemberModal(null);
      setNewMemberForm({ nik: '', nama_lengkap: '', hubungan_keluarga: 'Anak', status_warga: 'Hidup' });
      setIsNewborn(false);
      await fetchData();
      setAlertMsg({ show: true, type: 'success', message: 'Anggota keluarga baru berhasil ditambahkan!' });
    } catch (error) {
      setAlertMsg({ show: true, type: 'error', message: 'Gagal menambahkan anggota: ' + error.message });
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
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Kependudukan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manajemen basis data warga, arsip Kartu Keluarga, dan titik lokasi rumah.
          </p>
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
                      <p className="font-medium text-slate-700">
                        Blok {warga.keluarga?.rumah?.blok_nomor || '-'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        RT {warga.keluarga?.rt || '-'}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                        warga.hubungan_keluarga === 'Kepala Keluarga'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {warga.hubungan_keluarga === 'Kepala Keluarga' && <ShieldAlert size={14} />}
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
                          {warga.hubungan_keluarga === 'Kepala Keluarga' && (
                            <button
                              onClick={() => setAddMemberModal(warga)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors rounded-md hover:bg-emerald-50"
                              title="Tambah Anggota (Anak/Istri) ke Keluarga Ini"
                            >
                              <UserPlus size={16} />
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(warga)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => confirmDelete(warga)}
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

      {/* --- MODAL KONFIRMASI HAPUS --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              deleteTarget.hubungan_keluarga === 'Kepala Keluarga' ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              <AlertTriangle className={`w-8 h-8 ${
                deleteTarget.hubungan_keluarga === 'Kepala Keluarga' ? 'text-red-600' : 'text-amber-600'
              }`} />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              {deleteTarget.hubungan_keluarga === 'Kepala Keluarga'
                ? 'HAPUS SATU KELUARGA?'
                : 'Hapus Data Warga?'}
            </h3>

            <div className="text-sm text-slate-600 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {deleteTarget.hubungan_keluarga === 'Kepala Keluarga' ? (
                <>
                  Anda akan menghapus data <strong>{deleteTarget.nama_lengkap}</strong>.<br />
                  Karena statusnya adalah Kepala Keluarga, tindakan ini akan ikut menghapus:
                  <ul className="text-left mt-2 mb-2 font-medium text-red-600 list-disc list-inside">
                    <li>Data Istri & Anak-anaknya</li>
                    <li>Data Arsip Keluarga</li>
                    <li>File Foto KK dari Server</li>
                  </ul>
                  Apakah Anda benar-benar yakin?
                </>
              ) : (
                <>
                  Anda yakin ingin menghapus data <strong>{deleteTarget.nama_lengkap}</strong>?
                  Tindakan ini tidak dapat dibatalkan.
                </>
              )}
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
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                  deleteTarget.hubungan_keluarga === 'Kepala Keluarga'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : 'Ya, Tetap Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* --- MODAL EDIT DATA & PETA --- */}
      {editData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
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
                    <option value="Menantu">Menantu</option>
                    <option value="Mertua">Mertua</option>
                    <option value="Orang Tua">Orang Tua</option>
                    <option value="Kakak/Adik Ipar">Kakak/Adik Ipar</option>
                    <option value="Cucu">Cucu</option>
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

              {/* INFO TANGGAL KEMATIAN */}
              {editData.status_warga === 'Meninggal' && editData.tanggal_kematian && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700 font-medium">
                  Tanggal kematian tercatat:{' '}
                  <strong>
                    {new Date(editData.tanggal_kematian).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                </div>
              )}

              <div className="mt-6">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <MapPin size={14} className="text-blue-500" />
                  Geser & Klik Peta untuk Mengubah Lokasi Rumah
                </label>
                <div className="h-48 w-full rounded-xl overflow-hidden border border-slate-300 relative z-0">
                  <MapContainer
                    center={[editLocation.lat, editLocation.lng]}
                    zoom={17}
                    maxZoom={22}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      maxNativeZoom={19}
                      maxZoom={22}
                    />
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

      {/* --- MODAL TAMBAH ANGGOTA BARU (DENGAN OCR SCAN KTP) --- */}
      {addMemberModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserPlus size={18} className="text-emerald-600" /> Tambah Anggota
              </h3>
              <button
                onClick={() => setAddMemberModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 shrink-0">
              <p className="text-xs text-emerald-700 font-medium">
                Menambahkan anggota ke Keluarga:
              </p>
              <p className="text-sm font-bold text-emerald-900">
                {addMemberModal.nama_lengkap} (Blok {addMemberModal.keluarga?.rumah?.blok_nomor || '-'})
              </p>
            </div>

            <form onSubmit={submitNewMember} className="p-5 space-y-4 overflow-y-auto">

              {/* TOMBOL SMART SCAN KTP OCR */}
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/jpg"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleScanKTP}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanningKTP}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  {isScanningKTP
                    ? <Loader2 className="animate-spin" size={16} />
                    : <ScanText size={16} />}
                  {isScanningKTP ? 'AI sedang membaca KTP...' : 'Scan KTP dengan AI'}
                </button>
                <p className="text-[10px] text-indigo-500 mt-2 font-medium text-center">
                  Unggah foto KTP untuk mengisi form otomatis.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={newMemberForm.nama_lengkap}
                  onChange={e => setNewMemberForm({ ...newMemberForm, nama_lengkap: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIK / No. Identitas</label>
                <input
                  type="number"
                  value={newMemberForm.nik}
                  onChange={e => setNewMemberForm({ ...newMemberForm, nik: e.target.value })}
                  placeholder="16 digit NIK"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hubungan Keluarga</label>
                <select
                  value={newMemberForm.hubungan_keluarga}
                  onChange={e => setNewMemberForm({ ...newMemberForm, hubungan_keluarga: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="Anak">Anak</option>
                  <option value="Istri">Istri</option>
                  <option value="Suami">Suami</option>
                  <option value="Menantu">Menantu</option>
                  <option value="Mertua">Mertua</option>
                  <option value="Orang Tua">Orang Tua</option>
                  <option value="Kakak/Adik Ipar">Kakak/Adik Ipar</option>
                  <option value="Cucu">Cucu</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* Logika Pintar: Hanya muncul jika yang dipilih adalah "Anak" */}
              {newMemberForm.hubungan_keluarga === 'Anak' && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg mt-2">
                  <label className="block text-xs font-bold text-emerald-800 mb-2">
                    Apakah anak ini baru lahir?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="newborn"
                        checked={isNewborn === true}
                        onChange={() => setIsNewborn(true)}
                        className="accent-emerald-600"
                      />
                      Ya, baru lahir
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="newborn"
                        checked={isNewborn === false}
                        onChange={() => setIsNewborn(false)}
                        className="accent-emerald-600"
                      />
                      Tidak
                    </label>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl mt-2 flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="animate-spin" size={18} /> : 'Simpan Anggota Baru'}
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
              <img
                src={selectedPhoto}
                alt="Foto KK"
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataWarga;