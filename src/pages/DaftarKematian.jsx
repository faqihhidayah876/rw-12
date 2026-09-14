import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Loader2, Search, Calendar, MapPin, UserMinus,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const DaftarKematian = () => {
  const [dataKematian, setDataKematian] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchKematian = async () => {
      try {
        const { data, error } = await supabase
          .from('warga')
          .select(`
            id, nik, nama_lengkap, hubungan_keluarga, tanggal_kematian,
            keluarga ( rt, rumah ( blok_nomor ) )
          `)
          .eq('status_warga', 'Meninggal')
          .order('tanggal_kematian', { ascending: false }); // Wafat terbaru di atas

        if (error) throw error;
        setDataKematian(data || []);
      } catch (error) {
        console.error("Gagal menarik data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchKematian();
  }, []);

  // Format tanggal Indonesia lengkap dengan jam
  const formatTanggal = (isoString) => {
    if (!isoString) return 'Waktu tidak tercatat (Data lama)';
    const date = new Date(isoString);
    return (
      date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB'
    );
  };

  // Filter & Search
  const filteredData = dataKematian.filter((warga) =>
    warga.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warga.keluarga?.rumah?.blok_nomor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserMinus className="text-slate-700" />
            Riwayat Warga Wafat
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Arsip buku kematian warga berdasarkan catatan sistem.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama atau blok..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset ke halaman 1 saat ngetik
            }}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-500 shadow-sm"
          />
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 border-b border-slate-700 text-white text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Nama & NIK</th>
                <th className="px-6 py-4 font-semibold">Waktu Tercatat di Sistem</th>
                <th className="px-6 py-4 font-semibold">Alamat Terakhir</th>
                <th className="px-6 py-4 font-semibold">Hubungan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Memuat riwayat...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500 italic">
                    {searchTerm
                      ? 'Tidak ada data yang cocok dengan pencarian.'
                      : 'Belum ada riwayat kematian tercatat.'}
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
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar size={16} className="text-red-500 shrink-0" />
                        <span className="font-medium text-xs">
                          {formatTanggal(warga.tanggal_kematian)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <MapPin size={16} className="text-blue-500 shrink-0" />
                        <span>
                          Blok {warga.keluarga?.rumah?.blok_nomor || '-'}{' '}
                          <span className="text-slate-500">
                            (RT {warga.keluarga?.rt || '-'})
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {warga.hubungan_keluarga}
                      </span>
                    </td>
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
              Menampilkan {indexOfFirstItem + 1} -{' '}
              {Math.min(indexOfLastItem, filteredData.length)} dari{' '}
              {filteredData.length} data
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-300 text-slate-600 disabled:opacity-50 disabled:bg-slate-100 hover:bg-white transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-300 text-slate-600 disabled:opacity-50 disabled:bg-slate-100 hover:bg-white transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DaftarKematian;