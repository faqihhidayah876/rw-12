import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Search, Image as ImageIcon, Edit, Trash2, X } from 'lucide-react';

const DataWarga = () => {
  const [dataWarga, setDataWarga] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State untuk modal foto KK
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Cek apakah user yang login adalah admin
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Menarik data relasional dari tabel warga -> keluarga -> rumah
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

  // Logika Pencarian (Search)
  const filteredData = dataWarga.filter(warga => 
    warga.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warga.nik.includes(searchTerm) ||
    warga.keluarga?.rumah?.blok_nomor.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Tabel Data (Clean UI) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
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
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                    Memuat data warga...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada data yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((warga) => (
                  <tr key={warga.id} className="hover:bg-slate-50 transition-colors">
                    {/* Kolom 1: Nama & NIK */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{warga.nama_lengkap}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{warga.nik}</p>
                    </td>
                    
                    {/* Kolom 2: Alamat */}
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">Blok {warga.keluarga?.rumah?.blok_nomor || '-'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">RT {warga.keluarga?.rt || '-'}</p>
                    </td>
                    
                    {/* Kolom 3: Status Hubungan */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        warga.hubungan_keluarga === 'Kepala Keluarga' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {warga.hubungan_keluarga}
                      </span>
                    </td>

                    {/* Kolom 4: Foto KK */}
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

                    {/* Kolom 5: Aksi (Hanya tampil jika Admin) */}
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50" title="Hapus">
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
      </div>

      {/* MODAL LIHAT FOTO KK */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Arsip Kartu Keluarga</h3>
              <button onClick={() => setSelectedPhoto(null)} className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-slate-50 flex justify-center items-center">
              <img src={selectedPhoto} alt="Foto KK" className="max-w-full max-h-full object-contain rounded-lg shadow-sm border border-slate-200" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DataWarga;