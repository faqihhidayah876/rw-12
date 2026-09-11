import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PetaWarga = () => {
  const [rumahList, setRumahList] = useState([]);
  
  // Titik tengah peta (Default: Koordinat RW kamu, bisa disesuaikan nanti)
  const centerPosition = [0.5, 101.44]; // Contoh koordinat Pekanbaru

  useEffect(() => {
    const fetchRumah = async () => {
      // Ambil data rumah beserta data keluarga di dalamnya
      const { data, error } = await supabase
        .from('rumah')
        .select(`
          id, blok_nomor, koordinat_lat, koordinat_lng, status_hunian,
          keluarga ( nama_kepala_keluarga, no_kk )
        `);
      
      if (!error && data) {
        setRumahList(data.filter(r => r.koordinat_lat !== null));
      }
    };
    fetchRumah();
  }, []);

  return (
    <div className="h-screen w-full flex flex-col relative">
      {/* Header Mengambang (Floating) */}
      <div className="absolute top-4 left-4 z-[400] flex gap-3">
        <Link to="/dashboard" className="glass-panel p-3 rounded-xl hover:bg-white/80 transition-all text-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div className="glass-panel px-5 py-2.5 rounded-xl flex items-center">
          <h1 className="font-bold text-slate-800 text-sm">Peta Persebaran Warga RW 12</h1>
        </div>
      </div>

      {/* Komponen Peta */}
      <MapContainer 
        center={centerPosition} 
        zoom={15} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {rumahList.map((rumah) => (
          <Marker key={rumah.id} position={[rumah.koordinat_lat, rumah.koordinat_lng]}>
            {/* INI KODE BARU: Label teks permanen di bawah marker */}
            <Tooltip direction="bottom" offset={[0, 10]} opacity={1} permanent>
              <span className="font-bold text-slate-700 text-xs">{rumah.blok_nomor}</span>
            </Tooltip>

            <Popup className="rounded-xl">
              <div className="p-1">
                <span className="text-xs font-bold text-brand uppercase tracking-wider mb-1 block">Blok {rumah.blok_nomor}</span>
                <p className="font-semibold text-slate-800 m-0">
                  {rumah.keluarga && rumah.keluarga.length > 0 
                    ? rumah.keluarga[0].nama_kepala_keluarga 
                    : 'Belum ada data KK'}
                </p>
                <p className="text-xs text-slate-500 mt-1">{rumah.status_hunian}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default PetaWarga;