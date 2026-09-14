import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Search, Calendar, MapPin, Baby, ChevronLeft, ChevronRight } from 'lucide-react';

const DaftarKelahiran = () => {
  const [dataKelahiran, setDataKelahiran] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchKelahiran = async () => {
      try {
        const { data, error } = await supabase
          .from('warga')
          .select(`
            id, nik, nama_lengkap, tanggal_kelahiran_tercatat,
            keluarga ( nama_kepala_keluarga, rt, rumah ( blok_nomor ) )
          `)
          .not('tanggal_kelahiran_tercatat', 'is', null) // Hanya tarik yang ada tanggal lahirnya!
          .order('tanggal_kelahiran_tercatat', { ascending: false });

        if (error) throw error;
        setDataKelahiran(data || []);
      } catch (error) {
        console.error("Gagal menarik data kelahiran:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchKelahiran();
  }, []);

  const formatTanggal = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const filteredData = dataKelahiran.filter(warga => 
    warga.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warga.keluarga?.nama_kepala_keluarga.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Baby className="text-emerald-600" /> Riwayat Kelahiran Baru
          </h1>
          <p className="text-sm text-slate-500 mt-1">Arsip buku kelahiran anak warga berdasarkan catatan masuk sistem.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input type="text" placeholder="Cari nama anak atau ayah..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 shadow-sm" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50 border-b border-emerald-100 text-emerald-700 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Nama Anak & NIK</th>
                <th className="px-6 py-4 font-bold">Tanggal Tercatat</th>
                <th className="px-6 py-4 font-bold">Orang Tua (Kepala Keluarga)</th>
                <th className="px-6 py-4 font-bold">Lokasi Rumah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />Memuat riwayat...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Belum ada riwayat kelahiran baru yang tercatat.</td></tr>
              ) : (
                currentItems.map((warga) => (
                  <tr key={warga.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{warga.nama_lengkap}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{warga.nik || 'Belum ada NIK'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Calendar size={16} className="text-emerald-500" />
                        {formatTanggal(warga.tanggal_kelahiran_tercatat)}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {warga.keluarga?.nama_kepala_keluarga}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <MapPin size={16} className="text-blue-500"/>
                        Blok {warga.keluarga?.rumah?.blok_nomor || '-'} (RT {warga.keluarga?.rt || '-'})
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Kontrol Pagination */}
        {!isLoading && filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-500">Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} dari {filteredData.length} data</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-md border border-slate-300 text-slate-600 disabled:opacity-50 hover:bg-white"><ChevronLeft size={18}/></button>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 rounded-md border border-slate-300 text-slate-600 disabled:opacity-50 hover:bg-white"><ChevronRight size={18}/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DaftarKelahiran;