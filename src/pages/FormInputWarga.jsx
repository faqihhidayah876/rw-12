import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Camera, Save, ArrowLeft, CheckCircle2, Loader2,
  Plus, Trash2, ScanText, AlertCircle, Users
} from 'lucide-react';
import imageCompression from 'browser-image-compression';
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

  const [anggotaWarga, setAnggotaWarga] = useState([
    { nik: '', nama_lengkap: '', hubungan_keluarga: 'Kepala Keluarga' }
  ]);

  const [location, setLocation] = useState({ lat: null, lng: null });
  const [locationStatus, setLocationStatus] = useState('Mencari titik koordinat...');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');

  // State untuk OCR Scan KK
  const [isScanningOCR, setIsScanningOCR] = useState(false);

  // State alert (menggantikan alert() native)
  const [alertMsg, setAlertMsg] = useState({ show: false, type: 'success', message: '' });

  // Ambil koordinat GPS saat halaman dimuat
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setLocationStatus('Lokasi akurat ditemukan (Siap dikirim)');
        },
        () => {
          setLocationStatus('Gagal membaca lokasi. Pastikan GPS aktif.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'nama_kepala_keluarga' && anggotaWarga.length > 0) {
      const newAnggota = [...anggotaWarga];
      newAnggota[0].nama_lengkap = value;
      setAnggotaWarga(newAnggota);
    }
  };

  const handleAddAnggota = () => {
    setAnggotaWarga([...anggotaWarga, { nik: '', nama_lengkap: '', hubungan_keluarga: 'Anak' }]);
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

  // ============================================================
  // --- PARSER PINTAR: EKSTRAK BANYAK ANGGOTA DARI TABEL KK ---
  // ============================================================
  const extractDataFromOCR = (markdown) => {
    const lines = markdown.split('\n');
    let parsedMembers = [];
    let extractedNoKK = '';

    // 1. Cari No. KK — biasanya 16 digit angka di luar tabel (header)
    const headerText = lines.filter((l) => !l.includes('|')).join(' ');
    const kkMatch = headerText.match(/\b(1[1-9][0-9]{14}|[0-9]{16})\b/);
    if (kkMatch) extractedNoKK = kkMatch[0];

    // 2. Parse Tabel Anggota (baris yang mengandung tanda '|')
    for (const line of lines) {
      if (!line.includes('|')) continue;

      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c !== '');

      const nikIndex = cells.findIndex((c) => /^\d{16}$/.test(c.replace(/\s/g, '')));

      if (nikIndex >= 0) {
        const nik = cells[nikIndex].replace(/\s/g, '');
        let nama = '';

        if (nikIndex > 0) {
          nama = cells[nikIndex - 1].replace(/^[0-9]+\.\s*/, '');
        }

        let hubungan = 'Anak';
        if (parsedMembers.length === 0) hubungan = 'Kepala Keluarga';
        else if (parsedMembers.length === 1) hubungan = 'Istri';

        parsedMembers.push({ nik, nama_lengkap: nama, hubungan_keluarga: hubungan });
      }
    }

    // Fallback: kalau parsing tabel gagal, sikat semua 16 digit angka
    if (parsedMembers.length === 0) {
      const allNumbers = markdown.match(/\b(1[1-9][0-9]{14}|[0-9]{16})\b/g) || [];
      if (allNumbers.length > 0) {
        if (!extractedNoKK) extractedNoKK = allNumbers[0];

        const niks = allNumbers.filter((n) => n !== extractedNoKK);
        niks.forEach((nik, idx) => {
          let hubungan = idx === 0 ? 'Kepala Keluarga' : idx === 1 ? 'Istri' : 'Anak';
          parsedMembers.push({ nik, nama_lengkap: '', hubungan_keluarga: hubungan });
        });
      }
    }

    return { no_kk: extractedNoKK, anggota: parsedMembers };
  };

  // ============================================================
  // --- OCR SCAN KK VIA MISTRAL AI ---
  // ============================================================
  const handleScanOCR = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData((prev) => ({ ...prev, file_kk: file }));

    if (!import.meta.env.VITE_MISTRAL_API_KEY) {
      setAlertMsg({
        show: true,
        type: 'error',
        message: 'API Key Mistral belum diset. Cek file .env Anda.'
      });
      if (e.target) e.target.value = '';
      return;
    }

    setIsScanningOCR(true);

    try {
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });

      const response = await fetch(import.meta.env.VITE_MISTRAL_OCR_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_MISTRAL_OCR_MODEL || 'mistral-ocr-latest',
          document: { type: 'image_url', image_url: base64Image },
          include_image_base64: true,
          include_blocks: true,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Mistral OCR Error:', errorBody);
        throw new Error(`Gagal menghubungi Mistral OCR (HTTP ${response.status}).`);
      }

      const responseData = await response.json();

      const fullMarkdown = (responseData.pages || [])
        .map((p) => p.markdown || '')
        .join('\n')
        .trim();

      if (!fullMarkdown) {
        throw new Error('AI tidak mengembalikan teks dari gambar KK. Coba foto yang lebih jelas.');
      }

      console.log('📄 Raw OCR markdown (KK):', fullMarkdown);

      const extractedData = extractDataFromOCR(fullMarkdown);

      setFormData((prev) => ({
        ...prev,
        no_kk: extractedData.no_kk || prev.no_kk,
        nama_kepala_keluarga:
          extractedData.anggota[0]?.nama_lengkap || prev.nama_kepala_keluarga,
      }));

      if (extractedData.anggota.length > 0) {
        setAnggotaWarga(extractedData.anggota);
      }

      setAlertMsg({
        show: true,
        type: 'success',
        message: extractedData.anggota.length > 0
          ? `Berhasil! AI mendeteksi ${extractedData.anggota.length} anggota keluarga dari foto KK ini.`
          : 'KK berhasil dipindai. Silakan periksa kembali datanya.',
      });

    } catch (error) {
      console.error(error);
      setAlertMsg({
        show: true,
        type: 'error',
        message: 'Gagal mengekstrak data dari gambar KK: ' + error.message,
      });
    } finally {
      setIsScanningOCR(false);
      if (e.target) e.target.value = '';
    }
  };

  // ============================================================
  // --- SUBMIT DATA (UPLOAD + INSERT/UPDATE MANUAL) ---
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi
    if (!location.lat) {
      setValidationMsg('Anda belum mengaktifkan GPS. Silakan izinkan akses lokasi di browser atau nyalakan GPS HP Anda, lalu refresh halaman.');
      return;
    }
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

    setIsSubmitting(true);

    try {
      let fileUrl = null;

      // 1. UPLOAD FOTO KK (Dengan Kompresi)
      if (formData.file_kk) {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };
        const compressedFile = await imageCompression(formData.file_kk, options);
        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `${formData.no_kk}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('berkas_warga')
          .upload(fileName, compressedFile);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('berkas_warga')
          .getPublicUrl(fileName);
        fileUrl = publicUrlData.publicUrl;
      }

      // 2. LOGIKA PINTAR: CEK & INSERT DATA RUMAH
      let rumahId;
      const { data: cekRumah } = await supabase
        .from('rumah')
        .select('id')
        .eq('blok_nomor', formData.blok_nomor)
        .single();

      if (cekRumah) {
        // Rumah sudah ada → update RT + koordinat + status
        rumahId = cekRumah.id;
        const { error: errUpdateRumah } = await supabase
          .from('rumah')
          .update({
            rt: formData.rt,
            koordinat_lat: location.lat,
            koordinat_lng: location.lng,
            status_hunian: 'Berpenghuni',
          })
          .eq('id', rumahId);
        if (errUpdateRumah) throw errUpdateRumah;
      } else {
        // Rumah belum ada → buat rumah baru
        const { data: rumahBaru, error: errRumah } = await supabase
          .from('rumah')
          .insert({
            blok_nomor: formData.blok_nomor,
            rt: formData.rt,
            koordinat_lat: location.lat,
            koordinat_lng: location.lng,
            status_hunian: 'Berpenghuni',
          })
          .select()
          .single();
        if (errRumah) throw errRumah;
        rumahId = rumahBaru.id;
      }

      // 3. INSERT DATA KELUARGA
      const { data: keluargaBaru, error: errKel } = await supabase
        .from('keluarga')
        .insert({
          no_kk: formData.no_kk,
          nama_kepala_keluarga: formData.nama_kepala_keluarga,
          rumah_id: rumahId,
          rt: formData.rt,
          no_hp: formData.no_hp,
          agama: formData.agama,
          file_kk_url: fileUrl,
        })
        .select()
        .single();

      if (errKel) throw errKel;

      // 4. INSERT SELURUH ANGGOTA WARGA
      const payloadWarga = anggotaWarga.map((anggota) => ({
        keluarga_id: keluargaBaru.id,
        nik: anggota.nik,
        nama_lengkap: anggota.nama_lengkap,
        hubungan_keluarga: anggota.hubungan_keluarga,
        status_warga: 'Hidup',
      }));

      const { error: errWarga } = await supabase.from('warga').insert(payloadWarga);
      if (errWarga) throw errWarga;

      // 5. TAMPILKAN POP-UP SUKSES & RESET FORM
      setShowSuccessModal(true);
      setFormData({
        blok_nomor: '',
        no_kk: '',
        nama_kepala_keluarga: '',
        rt: '01',
        no_hp: '',
        agama: 'Islam',
        file_kk: null,
      });
      setAnggotaWarga([{ nik: '', nama_lengkap: '', hubungan_keluarga: 'Kepala Keluarga' }]);

    } catch (error) {
      console.error('Gagal menyimpan:', error);
      setAlertMsg({ show: true, type: 'error', message: 'Gagal menyimpan: ' + error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center p-4 sm:p-8">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 relative overflow-hidden flex flex-col h-fit">

        <div className="flex items-center gap-3 mb-6 relative z-10">
          <Link
            to="/"
            className="p-2 bg-white/40 hover:bg-white/70 rounded-full transition-all text-brand-dark"
          >
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-xl font-bold text-slate-800">Pendataan Warga</h2>
        </div>

        {/* Status Lokasi GPS */}
        <div className={`p-3 rounded-xl mb-6 flex items-start gap-3 text-sm font-medium border ${
          location.lat
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        } relative z-10`}>
          {location.lat
            ? <CheckCircle2 className="shrink-0" size={18} />
            : <MapPin className="shrink-0 animate-bounce" size={18} />}
          <p>{locationStatus}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">

          {/* SECTION 1 */}
          <div className="p-4 bg-white/40 rounded-2xl border border-white/50 space-y-4">
            <h3 className="font-bold text-brand-dark border-b border-brand-light pb-2">
              1. Scan Cerdas AI & Info Dasar
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Pindai KK (Otomatis Isi Seluruh Form!)
              </label>

              {formData.file_kk ? (
                <div className="relative w-full py-4 px-2 bg-white/60 rounded-xl flex flex-col items-center justify-center border-2 border-brand/40 border-solid transition-all">
                  <p className="text-xs font-bold text-brand-dark text-center truncate w-full px-4">
                    {formData.file_kk.name}
                  </p>

                  {isScanningOCR && (
                    <div className="flex flex-col items-center gap-2 mt-3 text-blue-600 font-bold text-xs bg-blue-50 px-4 py-2 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={16} /> Sedang mengekstrak tabel...
                      </div>
                      <span className="text-[10px] text-blue-500 font-normal">
                        Memproses Anggota Keluarga
                      </span>
                    </div>
                  )}

                  {!isScanningOCR && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, file_kk: null }))}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-brand/40 border-dashed rounded-xl cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                    <div className="flex flex-col items-center pt-2 text-brand">
                      <Camera className="w-6 h-6 mb-1" />
                      <p className="text-[10px] font-bold text-center px-2">Jepret Kamera</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleScanOCR}
                      className="hidden"
                    />
                  </label>

                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-brand/40 border-dashed rounded-xl cursor-pointer bg-white/60 hover:bg-white/80 transition-all">
                    <div className="flex flex-col items-center pt-2 text-brand">
                      <ScanText className="w-6 h-6 mb-1" />
                      <p className="text-[10px] font-bold text-center px-2">Upload Galeri</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScanOCR}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Blok Rumah <span className="text-slate-400 font-normal">(Tim Lapangan)</span>
              </label>
              <input
                type="text"
                name="blok_nomor"
                value={formData.blok_nomor}
                onChange={handleChange}
                className="w-full bg-white/70 border border-white focus:border-brand focus:ring-2 focus:ring-brand/30 rounded-xl px-3 py-2 outline-none"
                placeholder="Cth: A1-05"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor KK <span className="text-slate-400 font-normal">(Auto)</span>
                </label>
                <input
                  type="number"
                  name="no_kk"
                  value={formData.no_kk}
                  onChange={handleChange}
                  className="w-full bg-white/70 border border-white focus:border-brand focus:ring-2 focus:ring-brand/30 rounded-xl px-3 py-2 outline-none"
                  placeholder="16 Digit..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No HP <span className="text-slate-400 font-normal">(Tim Lapangan)</span>
                </label>
                <input
                  type="tel"
                  name="no_hp"
                  value={formData.no_hp}
                  onChange={handleChange}
                  className="w-full bg-white/70 border border-white focus:border-brand focus:ring-2 focus:ring-brand/30 rounded-xl px-3 py-2 outline-none"
                  placeholder="08..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Kepala Keluarga (Sesuai KK)
              </label>
              <input
                type="text"
                name="nama_kepala_keluarga"
                value={formData.nama_kepala_keluarga}
                onChange={handleChange}
                className="w-full bg-white/70 border border-white focus:border-brand focus:ring-2 focus:ring-brand/30 rounded-xl px-3 py-2 outline-none"
                placeholder="Nama Lengkap..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Agama</label>
                <select
                  name="agama"
                  value={formData.agama}
                  onChange={handleChange}
                  className="w-full bg-white/70 border border-white focus:border-brand focus:ring-2 focus:ring-brand/30 rounded-xl px-3 py-2 outline-none text-sm"
                >
                  <option value="Islam">Islam</option>
                  <option value="Kristen Protestan">Kristen Protestan</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  RT <span className="text-slate-400 font-normal">(Tim Lapangan)</span>
                </label>
                <select
                  name="rt"
                  value={formData.rt}
                  onChange={handleChange}
                  className="w-full bg-white/70 border border-white focus:border-brand focus:ring-2 focus:ring-brand/30 rounded-xl px-3 py-2 outline-none text-sm"
                >
                  <option value="01">RT 01</option>
                  <option value="02">RT 02</option>
                  <option value="03">RT 03</option>
                  <option value="04">RT 04</option>
                  <option value="05">RT 05</option>
                  <option value="06">RT 06</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2 */}
          <div className="p-4 bg-white/40 rounded-2xl border border-white/50 space-y-4">
            <div className="flex justify-between items-center border-b border-brand-light pb-2">
              <h3 className="font-bold text-brand-dark flex items-center gap-2">
                <Users size={18} /> 2. Anggota Keluarga
              </h3>
              <span className="text-xs font-bold bg-brand/20 text-brand-dark px-2 py-1 rounded-md">
                {anggotaWarga.length} Terdeteksi
              </span>
            </div>

            {anggotaWarga.map((anggota, index) => (
              <div key={index} className="bg-white/50 p-3 rounded-xl border border-slate-100 relative">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAnggota(index)}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <p className="text-xs font-bold text-brand mb-2">Anggota {index + 1}</p>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">NIK</label>
                    <input
                      type="number"
                      value={anggota.nik}
                      onChange={(e) => handleAnggotaChange(index, 'nik', e.target.value)}
                      className="w-full bg-white/70 border border-white focus:border-brand rounded-lg px-2 py-1.5 text-sm outline-none"
                      placeholder="16 Digit NIK"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Hubungan</label>
                    <select
                      value={anggota.hubungan_keluarga}
                      onChange={(e) => handleAnggotaChange(index, 'hubungan_keluarga', e.target.value)}
                      className="w-full bg-white/70 border border-white focus:border-brand rounded-lg px-2 py-1.5 text-sm outline-none"
                    >
                      <option value="Kepala Keluarga">Kepala Keluarga</option>
                      <option value="Istri">Istri</option>
                      <option value="Suami">Suami</option>
                      <option value="Anak">Anak</option>
                      <option value="Menantu">Menantu</option>
                      <option value="Mertua">Mertua</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={anggota.nama_lengkap}
                    onChange={(e) => handleAnggotaChange(index, 'nama_lengkap', e.target.value)}
                    className="w-full bg-white/70 border border-white focus:border-brand rounded-lg px-2 py-1.5 text-sm outline-none"
                    placeholder="Nama sesuai NIK..."
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddAnggota}
              className="w-full py-2 bg-brand-light/50 hover:bg-brand-light text-brand-dark text-sm font-bold rounded-xl flex items-center justify-center gap-2 border border-brand border-dashed transition-all"
            >
              <Plus size={16} /> Tambah Manual Anggota
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isScanningOCR}
            className="glass-button w-full py-4 mt-2 rounded-xl flex items-center justify-center gap-2 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? <><Loader2 className="animate-spin" size={22} /> Mengirim Data...</>
              : <><Save size={22} /> Simpan Data ke Server</>}
          </button>
        </form>
      </div>

      {/* --- MODAL SUKSES --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-emerald-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Data Tersimpan!</h3>
            <p className="text-slate-500 mb-6 text-sm font-medium">
              Data keluarga, anggota warga, dan koordinat GPS berhasil direkam.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="glass-button w-full py-3 rounded-xl font-bold"
            >
              Tutup & Input Baru
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL VALIDASI ERROR --- */}
      {validationMsg && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-600 w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Peringatan</h3>
            <p className="text-slate-600 mb-6 text-sm font-medium">{validationMsg}</p>
            <button
              onClick={() => setValidationMsg('')}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL ALERT (Sukses / Gagal) --- */}
      {alertMsg.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
              alertMsg.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
            }`}>
              {alertMsg.type === 'success'
                ? <CheckCircle2 className="text-emerald-600 w-7 h-7" />
                : <AlertCircle className="text-red-600 w-7 h-7" />}
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
    </div>
  );
};

export default FormInputWarga;