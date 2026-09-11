import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Search, Image as ImageIcon, Edit, Trash2, X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

const DataWarga = () => {
  const [dataWarga, setDataWarga] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State untuk Modal
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [editData, setEditData] = useState(null); // Menyimpan data yang sedang diedit
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // Menyimpan data yang mau dihapus
  const [successMsg, setSuccessMsg] = useState(''); // Menyimpan pesan sukses (Edit/Hapus)

  // Cek apakah user yang login adalah admin
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
            no_kk, file_kk_url, rt,
            rumah ( blok_nomor )
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

  // --- FUNGSI HAPUS ---
  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('warga').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      
      setDataWarga(dataWarga.filter(warga => warga.id !== deleteTarget.id));
      setDeleteTarget(null); // Tutup modal konfirmasi
      setSuccessMsg('Data warga berhasil dihapus dari sistem.'); // Tampilkan pop up sukses
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message);
    }
  };

  // --- FUNGSI EDIT ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('warga')
        .update({
          nama_lengkap: editData.nama_lengkap, nik: editData.nik, hubungan_keluarga: editData.hubungan_keluarga
        }).eq('id', editData.id);
      if (error) throw error;

      setEditData(null); // Tutup form edit
      setSuccessMsg('Data warga berhasil diperbarui.'); // Tampilkan pop up sukses
      fetchData(); 
    } catch (error) {
      alert('Gagal memperbarui: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Logika Filter & Pagination
  const filteredData = dataWarga.filter(warga => 
    warga.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warga.nik.includes(searchTerm) ||
    warga.keluarga?.rumah?.blok_nomor.toLowerCase().includes(searchTerm.toLowerCase())
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
          <p className="text-sm text-slate-500 mt-1">Manajemen basis data warga dan arsip Kartu Keluarga.</p>
        </div>
        
        {/* Input Pencarian */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama, NIK, atau Blok..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} // Reset page saat mencari
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Tabel Data (Clean UI) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Nama & NIK</th>
                <th className="px-6 py-4 font-semibold">Blok & RT</th>
                <th className="px-6 py-4 font-semibold">Hubungan</th>
                <th className="px-6 py-4 font-semibold text-center">Arsip KK</th>
                {isAdmin && <th className="px-6 py-4 font-semibold text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />Memuat data warga...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-center text-slate-500">Tidak ada data yang ditemukan.</td></tr>
              ) : (
                currentItems.map((warga) => (
                  <tr key={warga.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4"><p className="font-bold text-slate-900">{warga.nama_lengkap}</p><p className="text-xs text-slate-500 mt-0.5">{warga.nik}</p></td>
                    <td className="px-6 py-4"><p className="font-medium text-slate-700">Blok {warga.keluarga?.rumah?.blok_nomor || '-'}</p><p className="text-xs text-slate-500 mt-0.5">RT {warga.keluarga?.rt || '-'}</p></td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${warga.hubungan_keluarga === 'Kepala Keluarga' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {warga.hubungan_keluarga}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {warga.keluarga?.file_kk_url ? (
                        <button onClick={() => setSelectedPhoto(warga.keluarga.file_kk_url)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"><ImageIcon size={14} /> Lihat</button>
                      ) : <span className="text-xs text-slate-400 italic">Tidak ada foto</span>}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditData(warga)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50" title="Edit"><Edit size={16} /></button>
                          <button onClick={() => setDeleteTarget({ id: warga.id, nama: warga.nama_lengkap })} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50" title="Hapus"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION CONTROLS --- */}
        {!isLoading && filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-500">Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} dari {filteredData.length} data</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-300 text-slate-600 disabled:opacity-50 disabled:bg-slate-100 hover:bg-white"
              ><ChevronLeft size={18}/></button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-300 text-slate-600 disabled:opacity-50 disabled:bg-slate-100 hover:bg-white"
              ><ChevronRight size={18}/></button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL EDIT DATA --- */}
      {editData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">Edit Data Warga</h3>
              <button onClick={() => setEditData(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input type="text" value={editData.nama_lengkap} onChange={e => setEditData({...editData, nama_lengkap: e.target.value})} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIK</label>
                <input type="number" value={editData.nik} onChange={e => setEditData({...editData, nik: e.target.value})} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hubungan Keluarga</label>
                <select value={editData.hubungan_keluarga} onChange={e => setEditData({...editData, hubungan_keluarga: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none">
                  <option value="Kepala Keluarga">Kepala Keluarga</option>
                  <option value="Istri">Istri</option>
                  <option value="Suami">Suami</option>
                  <option value="Anak">Anak</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <button type="submit" disabled={isUpdating} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-4 flex justify-center items-center gap-2">
                {isUpdating ? <Loader2 className="animate-spin" size={18} /> : 'Simpan Perubahan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lihat Foto KK tetap sama... */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100"><h3 className="font-bold text-slate-800">Arsip Kartu Keluarga</h3><button onClick={() => setSelectedPhoto(null)} className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-lg"><X size={20} /></button></div>
            <div className="p-4 overflow-auto flex-1 bg-slate-50 flex justify-center"><img src={selectedPhoto} alt="Foto KK" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" /></div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center transform animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 className="text-red-500 w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Data Warga?</h3>
            <p className="text-sm text-slate-500 mb-6">Apakah Anda yakin ingin menghapus data <b>{deleteTarget.nama}</b>? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Batal</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUKSES (Edit / Hapus) */}
      {successMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center transform animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
              <CheckCircle2 className="text-green-500 w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Berhasil!</h3>
            <p className="text-sm text-slate-500 mb-6">{successMsg}</p>
            <button onClick={() => setSuccessMsg('')} className="w-full py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataWarga;