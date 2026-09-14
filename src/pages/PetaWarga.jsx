import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { ArrowLeft, Users, Home, MapPin, X, User, AlertCircle, Search, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const PetaWarga = () => {
  const [dataRumah, setDataRumah] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Modal & Map Control
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  // State untuk Fitur Pencarian
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const fetchPeta = async () => {
      try {
        const { data, error } = await supabase
          .from('rumah')
          .select(`
            id, blok_nomor, koordinat_lat, koordinat_lng,
            keluarga (
              id, no_kk, nama_kepala_keluarga, rt,
              warga ( id, nik, nama_lengkap, hubungan_keluarga, status_warga )
            )
          `);

        if (error) throw error;

        // Proses data untuk menentukan status hunian
        const processedData = (data || []).map(rumah => {
          const adaKeluarga = rumah.keluarga && rumah.keluarga.length > 0;
          let isBerpenghuni = false;
          let jumlahWargaHidup = 0;

          if (adaKeluarga) {
            rumah.keluarga.forEach(kel => {
              kel.warga?.forEach(w => {
                if (w.status_warga === 'Hidup') {
                  isBerpenghuni = true;
                  jumlahWargaHidup++;
                }
              });
            });
          }
          return { ...rumah, adaKeluarga, isBerpenghuni, jumlahWargaHidup };
        });

        setDataRumah(processedData);
      } catch (error) {
        console.error("Gagal menarik data peta:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPeta();
  }, []);

  // --- 1. FITUR MICRO-MARKER ---
  const createCustomIcon = (isBerpenghuni, blok) => {
    return L.divIcon({
      className: 'bg-transparent border-none',
      html: `<div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg text-[10px] font-extrabold text-white transition-transform hover:scale-110 ${isBerpenghuni ? 'bg-blue-600' : 'bg-red-500'}">${blok}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  // --- 2. FITUR TELEPORTASI PETA ---
  const flyToHouse = (rumah) => {
    if (mapInstance) {
      mapInstance.flyTo([rumah.koordinat_lat, rumah.koordinat_lng], 21, {
        animate: true,
        duration: 1.5
      });

      if (rumah.adaKeluarga) {
        setTimeout(() => {
          setSelectedDetail(rumah);
        }, 800);
      }
    }
    setIsSearchOpen(false);
  };

  const mapCenter = dataRumah.length > 0 && dataRumah[0].koordinat_lat
    ? [dataRumah[0].koordinat_lat, dataRumah[0].koordinat_lng]
    : [0.5333, 101.4500];

  const filteredRumah = dataRumah.filter(r =>
    r.blok_nomor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full h-screen bg-slate-100 overflow-hidden">

      {/* --- HEADER MENGAMBANG & TOMBOL CARI (MOBILE) --- */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-2 md:gap-3">
        <Link to="/dashboard" className="bg-white p-3 rounded-xl hover:bg-slate-50 transition-all text-slate-800 shadow-lg border border-slate-200">
          <ArrowLeft size={20} />
        </Link>
        <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-200 flex items-center gap-2">
          <MapPin className="text-blue-600" size={20} />
          <h1 className="font-bold text-slate-800 text-sm hidden sm:block">Peta Persebaran Warga</h1>
        </div>
        <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="lg:hidden bg-blue-600 text-white p-3 rounded-xl shadow-lg">
          <Search size={20} />
        </button>
      </div>

      {/* --- PANEL NAVIGATOR PENCARIAN --- */}
      <div className={`absolute top-20 lg:top-4 right-4 z-[400] w-72 max-h-[85vh] bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 ${isSearchOpen ? 'translate-x-0 opacity-100 visible' : 'translate-x-10 opacity-0 invisible lg:translate-x-0 lg:opacity-100 lg:visible'}`}>

        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Navigation size={16} className="text-blue-600"/> Navigator Blok
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari blok (Cth: E 27)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredRumah.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-4">Blok tidak ditemukan.</p>
          ) : (
            filteredRumah.map(rumah => (
              <button
                key={rumah.id}
                onClick={() => flyToHouse(rumah)}
                className="w-full flex items-center justify-between p-3 hover:bg-blue-50 rounded-xl transition-colors text-left group"
              >
                <div>
                  <p className="font-bold text-slate-800 group-hover:text-blue-700">Blok {rumah.blok_nomor}</p>
                  <p className="text-[10px] text-slate-500">
                    {rumah.isBerpenghuni ? `${rumah.jumlahWargaHidup} Penghuni` : 'Kosong/Riwayat'}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${rumah.isBerpenghuni ? 'bg-blue-500' : 'bg-red-500'}`}></div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* --- PETA INTERAKTIF --- */}
      {isLoading ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <MapContainer
          center={mapCenter}
          zoom={17}
          zoomControl={false}
          ref={setMapInstance}
          style={{ height: '100%', width: '100%', zIndex: 10 }}
        >
          {/* Tombol Zoom dipindahkan ke kanan bawah */}
          <ZoomControl position="bottomright" />

          {/* Overzoom: peta tetap tajam hingga zoom 22 */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxNativeZoom={19}
            maxZoom={22}
          />

          {dataRumah.map((rumah) => {
            const keluargaUtama = rumah.adaKeluarga ? rumah.keluarga[0] : null;

            return (
              <Marker
                key={rumah.id}
                position={[rumah.koordinat_lat, rumah.koordinat_lng]}
                icon={createCustomIcon(rumah.isBerpenghuni, rumah.blok_nomor)}
              >
                <Popup className="custom-popup border-none rounded-xl">
                  <div className="p-1 min-w-[180px]">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                      <Home size={16} className={rumah.isBerpenghuni ? "text-blue-600" : "text-red-500"} />
                      <h3 className="font-extrabold text-slate-800 text-sm">Blok {rumah.blok_nomor}</h3>
                      {keluargaUtama && (
                        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${rumah.isBerpenghuni ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                          RT {keluargaUtama.rt}
                        </span>
                      )}
                    </div>

                    {rumah.isBerpenghuni ? (
                      <div className="space-y-1.5 mb-3">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Kepala Keluarga</p>
                        <p className="text-sm font-bold text-slate-900 leading-tight">{keluargaUtama.nama_kepala_keluarga}</p>
                      </div>
                    ) : (
                      <div className="mb-3 text-center py-2 bg-red-50 rounded-lg">
                        <AlertCircle size={20} className="text-red-500 mx-auto mb-1" />
                        <p className="text-xs font-bold text-red-700">Kosong / Historis</p>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedDetail(rumah)}
                      disabled={!rumah.adaKeluarga}
                      className={`w-full py-2 text-white text-xs font-bold rounded-lg transition-colors ${
                        !rumah.adaKeluarga
                          ? 'bg-slate-300 cursor-not-allowed'
                          : rumah.isBerpenghuni
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {rumah.adaKeluarga ? 'Lihat Detail Historis' : 'Data Kosong'}
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      )}

      {/* --- MODAL LIHAT DETAIL WARGA --- */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] border border-slate-100">

            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Detail Penghuni Rumah</h3>
                <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                  <MapPin size={14} /> Blok {selectedDetail.blok_nomor}
                </p>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1.5 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded-lg hover:border-red-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto bg-white">
              {selectedDetail.keluarga?.map((kel) => (
                <div key={kel.id} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-3 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                    <div className="bg-slate-500 p-1.5 rounded-lg">
                      <User size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                        Keluarga Terdaftar (RT {kel.rt})
                      </p>
                      <p className="text-sm font-bold text-slate-900">{kel.nama_kepala_keluarga}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pl-2 border-l-2 border-slate-100 ml-4">
                    {kel.warga?.map((w) => (
                      <div
                        key={w.id}
                        className={`flex justify-between items-center p-3 rounded-xl border relative ${
                          w.status_warga === 'Hidup'
                            ? 'bg-white border-slate-200'
                            : 'bg-red-50 border-red-100'
                        }`}
                      >
                        <div className="absolute left-[-23px] top-1/2 -translate-y-1/2 w-4 h-0.5 bg-slate-200"></div>
                        <div>
                          <p className={`font-bold text-sm ${w.status_warga === 'Hidup' ? 'text-slate-800' : 'text-red-700'}`}>
                            {w.nama_lengkap}
                            {w.status_warga !== 'Hidup' && (
                              <span className="ml-2 text-[10px] bg-red-200 text-red-700 px-1.5 py-0.5 rounded font-extrabold uppercase">
                                [{w.status_warga}]
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{w.nik}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                            w.hubungan_keluarga === 'Kepala Keluarga'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {w.hubungan_keluarga}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PetaWarga;