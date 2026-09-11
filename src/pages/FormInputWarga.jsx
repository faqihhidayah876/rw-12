import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Camera, Save, ArrowLeft, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const FormInputWarga = () => {
  const [formData, setFormData] = useState({
    blok_nomor: '',
    no_kk: '',
    nama_kepala_keluarga: '',
    rt: '01',
    no_hp: '',
    agama: 'Islam',
    file_kk: null,
  });

  // State BARU: Array dinamis untuk anggota keluarga
  const [anggotaWarga, setAnggotaWarga] = useState([
    { nik: '', nama_lengkap: '', hubungan_keluarga: 'Kepala Keluarga' }
  ]);

  const [location, setLocation] = useState({ lat: null, lng: null });
  const [locationStatus, setLocationStatus] = useState('Mencari titik koordinat...');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setLocationStatus('Lokasi akurat ditemukan (Siap dikirim)');
        },
        (error) => {
          setLocationStatus('Gagal membaca lokasi. Pastikan GPS aktif.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Jika ganti nama kepala keluarga, otomatis update nama di anggota urutan pertama
    if (name === 'nama_kepala_keluarga') {
      const newAnggota = [...anggotaWarga];
      newAnggota[0].nama_lengkap = value;
      setAnggotaWarga(newAnggota);
    }
  };

  const handleFileChange = (e) => setFormData((prev) => ({ ...prev, file_kk: e.target.files[0] }));

  // --- Fungsi Dinamis Anggota Keluarga ---
  const handleAddAnggota = () => {
    setAnggotaWarga([...anggotaWarga, { nik: '', nama_lengkap: '', hubungan_keluarga: 'Istri' }]);
  };

  const handleRemoveAnggota = (index) => {
    if (anggotaWarga.length === 1) return;
    const newAnggota = anggotaWarga.filter((_, i) => i !== index);
    setAnggotaWarga(newAnggota);
  };

  const handleAnggotaChange = (index, field, value) => {
    const newAnggota = [...anggotaWarga];
    newAnggota[index][field] = value;
    setAnggotaWarga(newAnggota);
  };

  // --- SUBMIT DATA KE 3 TABEL SEKALIGUS ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi GPS
    if (!location.lat) {
      setValidationMsg('Anda belum mengaktifkan GPS. Silakan izinkan akses lokasi di browser atau nyalakan GPS HP Anda, lalu refresh halaman.');
      return;
    }
    // Validasi Kolom Kosong
    if (!formData.blok_nomor) {
      setValidationMsg('Anda belum mengisi kolom Blok Rumah. Silakan isi terlebih dahulu.');
      return;
    }
    if (!formData.no_kk) {
      setValidationMsg('Anda belum mengisi Nomor KK. Silakan isi terlebih dahulu.');
      return;
    }
    if (!formData.file_kk) {
      setValidationMsg('Anda belum melampirkan Foto KK. Silakan foto terlebih dahulu.');
      return;
    }

    // Jika lolos validasi, lanjut ke proses submit...
    setIsSubmitting(true);

    try {
      let fileUrl = null;

      // 1. UPLOAD FOTO KK
      if (formData.file_kk) {
        const fileExt = formData.file_kk.name.split('.').pop();
        const fileName = `${formData.no_kk}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('berkas_warga').upload(fileName, formData.file_kk);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('berkas_warga').getPublicUrl(fileName);
        fileUrl = publicUrlData.publicUrl;
      }

      // 2. SIMPAN/CEK RUMAH
      let rumahId = null;
      const { data: existingRumah } = await supabase.from('rumah').select('id').eq('blok_nomor', formData.blok_nomor).maybeSingle();

      if (existingRumah) {
        rumahId = existingRumah.id;
      } else {
        const { data: newRumah, error: insertRumahError } = await supabase
          .from('rumah').insert([{ blok_nomor: formData.blok_nomor, koordinat_lat: location.lat, koordinat_lng: location.lng, status_hunian: 'Berpenghuni' }]).select().single();
        if (insertRumahError) throw insertRumahError;
        rumahId = newRumah.id;
      }

      // 3. SIMPAN KELUARGA
      const { data: newKeluarga, error: keluargaError } = await supabase
        .from('keluarga')
        .insert([{
          rumah_id: rumahId, no_kk: formData.no_kk, nama_kepala_keluarga: formData.nama_kepala_keluarga,
          file_kk_url: fileUrl, status_domisili: 'Tetap', rt: formData.rt, no_hp: formData.no_hp, agama: formData.agama
        }])
        .select().single();
      
      if (keluargaError) throw keluargaError;

      // 4. SIMPAN INDIVIDU WARGA SECARA BATCH
      const dataWarga = anggotaWarga.map(anggota => ({
        keluarga_id: newKeluarga.id,
        nik: anggota.nik,
        nama_lengkap: anggota.nama_lengkap,
        hubungan_keluarga: anggota.hubungan_keluarga,
        status_warga: 'Hidup'
      }));

      const { error: wargaError } = await supabase.from('warga').insert(dataWarga);
      if (wargaError) throw wargaError;

      setShowSuccessModal(true);
      
      // Reset form
      setFormData({ blok_nomor: '', no_kk: '', nama_kepala_keluarga: '', rt: '01', no_hp: '', agama: 'Islam', file_kk: null });
      setAnggotaWarga([{ nik: '', nama_lengkap: '', hubungan_keluarga: 'Kepala Keluarga' }]);

    } catch (error) {
      console.error("Gagal menyimpan:", error);
      alert("Gagal: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center p-4 sm:p-8">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 relative overflow-hidden flex flex-col h-fit">
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <Link to="/" className="p-2 bg-white/40 hover:bg-white/70 rounded-full transition-all text-brand-dark"><ArrowLeft size={20} /></Link>
          <h2 className="text-xl font-bold text-slate-800">Pendataan Warga</h2>
        </div>

        <div className={`p-3 rounded-xl mb-6 flex items-start gap-3 text-sm font-medium border ${location.lat ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'} relative z-10`}>
          {location.lat ? <CheckCircle2 className="shrink-0" size={18} /> : <MapPin className="shrink-0 animate-bounce" size={18} />}
          <p>{locationStatus}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
          
          {/* SECTION 1: DATA KELUARGA */}
          <div className="p-4 bg-white/40 rounded-2xl border border-white/50 space-y-4">
            <h3 className="font-bold text-brand-dark border-b border-brand-light pb-2">1. Data Induk Keluarga</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Blok Rumah</label>
              <input type="text" name="blok_nomor" value={formData.blok_nomor} onChange={handleChange} className="w-full bg-white/70 border border-white focus:border-brand focus:ring-2 focus:ring-brand/30 rounded-xl px-3 py-2 outline-none" placeholder="Cth: A1-05" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor KK</label>
                <input type="number" name="no_kk" value={formData.no_kk} onChange={handleChange} className="w-full bg-white/70 border border-white focus:border-brand focus:ring-2 focus:ring-brand/30 rounded-xl px-3 py-2 outline-none" placeholder="16 Digit..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No HP Utama</label>
                <input type="tel" name="no_hp" value={formData.no_hp} onChange={handleChange} className="w-full bg-white/70 border border-white focus:border-brand focus:ring-2 focus:ring-brand/30 rounded-xl px-3 py-2 outline-none" placeholder="08..." />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kepala Keluarga (Sesuai KK)</label>
              <input type="text" name="nama_kepala_keluarga" value={formData.nama_kepala_keluarga} onChange={handleChange} className="w-full bg-white/70 border border-white focus:border-brand focus:ring-2 focus:ring-brand/30 rounded-xl px-3 py-2 outline-none" placeholder="Nama Lengkap..." />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Agama</label>
                <select name="agama" value={formData.agama} onChange={handleChange} className="w-full bg-white/70 border border-white focus:border-brand focus:ring-2 focus:ring-brand/30 rounded-xl px-3 py-2 outline-none text-sm">
                  <option value="" disabled>Pilih Agama</option>
                  <option value="Islam">Islam</option>
                  <option value="Kristen Protestan">Kristen Protestan</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Konghucu">Konghucu</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>
            
            <div className="mt-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">Foto Kartu Keluarga (KK)</label>
              {formData.file_kk ? (
                <div className="relative w-full h-24 bg-white/60 rounded-xl flex items-center justify-center border-2 border-brand/40 border-solid">
                  <p className="text-xs font-medium text-slate-700 px-4 text-center">{formData.file_kk.name}</p>
                  {/* Tombol Silang untuk Cancel */}
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, file_kk: null }))}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-brand/40 border-dashed rounded-xl cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                  <div className="flex flex-col items-center pt-2">
                    <Camera className="w-6 h-6 text-brand mb-1" />
                    <p className="text-xs text-slate-600 font-medium text-center px-4">Ketuk untuk Foto/Pilih File</p>
                  </div>
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* SECTION 2: DATA INDIVIDU WARGA (DINAMIS) */}
          <div className="p-4 bg-white/40 rounded-2xl border border-white/50 space-y-4">
            <h3 className="font-bold text-brand-dark border-b border-brand-light pb-2">2. Daftar Anggota Keluarga</h3>
            
            {anggotaWarga.map((anggota, index) => (
              <div key={index} className="bg-white/50 p-3 rounded-xl border border-slate-100 relative">
                {index > 0 && (
                  <button type="button" onClick={() => handleRemoveAnggota(index)} className="absolute top-3 right-3 text-red-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                )}
                
                <p className="text-xs font-bold text-brand mb-2">Anggota {index + 1}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">NIK</label>
                    <input type="number" value={anggota.nik} onChange={(e) => handleAnggotaChange(index, 'nik', e.target.value)} className="w-full bg-white/70 border border-white focus:border-brand rounded-lg px-2 py-1.5 text-sm outline-none" placeholder="16 Digit NIK" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Hubungan</label>
                    <select value={anggota.hubungan_keluarga} onChange={(e) => handleAnggotaChange(index, 'hubungan_keluarga', e.target.value)} className="w-full bg-white/70 border border-white focus:border-brand rounded-lg px-2 py-1.5 text-sm outline-none">
                      <option value="Kepala Keluarga">Kepala Keluarga</option>
                      <option value="Istri">Istri</option>
                      <option value="Suami">Suami</option>
                      <option value="Anak">Anak</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap</label>
                  <input type="text" value={anggota.nama_lengkap} onChange={(e) => handleAnggotaChange(index, 'nama_lengkap', e.target.value)} 
                    readOnly={index === 0}
                    className={`w-full border border-white focus:border-brand rounded-lg px-2 py-1.5 text-sm outline-none ${index === 0 ? 'bg-slate-100 text-slate-500' : 'bg-white/70'}`} 
                    placeholder="Nama sesuai NIK..." 
                  />
                </div>
              </div>
            ))}

            <button type="button" onClick={handleAddAnggota} className="w-full py-2 bg-brand-light/50 hover:bg-brand-light text-brand-dark text-sm font-bold rounded-xl flex items-center justify-center gap-2 border border-brand border-dashed transition-all">
              <Plus size={16} /> Tambah Anggota Keluarga
            </button>
          </div>

          <button type="submit" disabled={isSubmitting} className="glass-button w-full py-4 mt-2 rounded-xl flex items-center justify-center gap-2 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? <><Loader2 className="animate-spin" size={22} /> Menyimpan...</> : <><Save size={22} /> Simpan Semua Data</>}
          </button>
        </form>
      </div>

      {/* Pop-up Custom Sukses */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm z-50 p-4">
          <div className="bg-white/90 backdrop-blur-md border border-white shadow-2xl rounded-3xl p-8 max-w-sm w-full text-center transform animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 className="text-green-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Data Tersimpan!</h3>
            <p className="text-slate-500 mb-6 text-sm font-medium">Data keluarga, anggota warga, dan koordinat GPS berhasil direkam.</p>
            <button onClick={() => window.location.reload()} className="glass-button w-full py-3 rounded-xl font-bold">
              Tutup & Input Baru
            </button>
          </div>
        </div>
      )}

      {/* Pop-up Validasi Error */}
      {validationMsg && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-white/95 border-l-4 border-red-500 shadow-2xl rounded-2xl p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Peringatan</h3>
            <p className="text-slate-600 mb-6 text-sm font-medium">{validationMsg}</p>
            <button onClick={() => setValidationMsg('')} className="bg-red-500 hover:bg-red-600 text-white w-full py-2.5 rounded-xl font-bold transition-all">
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormInputWarga;