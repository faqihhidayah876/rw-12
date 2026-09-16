import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const KebijakanPrivasi = () => {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-10 relative">

        {/* Tombol Kembali */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-medium mb-8 transition-colors"
        >
          <ArrowLeft size={20} /> Kembali ke Halaman Utama
        </Link>

        {/* Header Dokumen */}
        <div className="text-center mb-10 pb-8 border-b border-slate-200">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            KEBIJAKAN PRIVASI
          </h1>
          <p className="text-slate-600 font-medium">
            Sistem Informasi Kependudukan BSKM RW 12
          </p>
          <p className="text-sm text-slate-400 mt-4">
            Terakhir diperbarui: 16 September 2026
          </p>
        </div>

        {/* Isi Dokumen */}
        <div className="space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Pasal 1 - PENDAHULUAN</h3>
            <p className="mb-2">
              Kebijakan Privasi ini menjelaskan bagaimana Badan Sosial dan Kematian Masyarakat
              (BSKM) RW 12 mengumpulkan, menggunakan, menyimpan, dan melindungi Data Pribadi
              Pengguna Sistem Informasi Kependudukan RW 12.
            </p>
            <p className="mb-2">Kebijakan ini disusun berdasarkan:</p>
            <ol className="list-decimal pl-5 space-y-1 mb-2">
              <li>
                Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP);
              </li>
              <li>
                Peraturan Pemerintah Nomor 71 Tahun 2019 tentang Penyelenggaraan Sistem dan
                Transaksi Elektronik;
              </li>
              <li>Asas pelindungan data pribadi yang berlaku di Indonesia.</li>
            </ol>
            <p>
              Dengan menggunakan Sistem ini, Pengguna menyetujui pengelolaan Data Pribadi sesuai
              dengan dokumen ini.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Pasal 2 - DEFINISI</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Data Pribadi</strong> adalah data tentang orang perseorangan yang
                teridentifikasi dan/atau dapat diidentifikasi secara tersendiri atau dikombinasi
                dengan informasi lainnya, baik secara langsung maupun tidak langsung.
              </li>
              <li>
                <strong>Subjek Data Pribadi</strong> adalah orang perseorangan yang Data Pribadinya
                diproses dalam Sistem.
              </li>
              <li>
                <strong>Pengendali Data Pribadi</strong> adalah pihak yang menentukan tujuan dan
                melakukan kendali atas pemrosesan Data Pribadi (dalam hal ini: BSKM RW 12).
              </li>
              <li>
                <strong>Pemroses Data Pribadi</strong> adalah pihak yang melakukan pemrosesan Data
                Pribadi atas nama Pengendali Data Pribadi (Supabase, Vercel, Mistral AI, Cloudflare).
              </li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Pasal 3 - DATA PRIBADI YANG DIKUMPULKAN
            </h3>
            <div className="grid sm:grid-cols-2 gap-6 mt-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800 mb-2">A. Data Bersifat Umum</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Nomor KK & NIK</li>
                  <li>Nama Lengkap & Agama</li>
                  <li>Hubungan Keluarga & Status Warga</li>
                  <li>Wilayah RT & Blok Rumah</li>
                  <li>Nomor HP</li>
                  <li>Koordinat GPS Rumah</li>
                  <li>Foto Kartu Keluarga</li>
                </ul>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="font-bold text-amber-900 mb-2">B. Data Bersifat Spesifik</p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-amber-800">
                  <li>Data kematian (tanggal dan status)</li>
                  <li>Data kelahiran (tanggal dan status)</li>
                  <li>Data kondisi sakit anggota keluarga (untuk santunan)</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
              Sistem TIDAK mengumpulkan data biometrik, genetika, keuangan pribadi, atau catatan
              kejahatan.
            </div>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Pasal 4 - TUJUAN PEMROSESAN DATA
            </h3>
            <p className="mb-2">Data Pribadi yang dikumpulkan digunakan untuk:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Pendataan kependudukan RW 12 yang akurat dan terkini;</li>
              <li>Penyelenggaraan layanan sosial dan kematian oleh BSKM;</li>
              <li>Pemberian santunan kepada warga yang berhak;</li>
              <li>Pencatatan riwayat kelahiran dan kematian warga;</li>
              <li>Pembuatan laporan kependudukan untuk kepentingan RW;</li>
              <li>Keperluan administrasi pemerintahan tingkat RT/RW.</li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Pasal 5 - DASAR HUKUM PEMROSESAN
            </h3>
            <p className="mb-2">
              Pemrosesan Data Pribadi dalam Sistem ini dilakukan berdasarkan:
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                <strong>Persetujuan Subjek Data Pribadi</strong> (UU PDP Pasal 20 ayat (2) huruf a)
                — melalui penggunaan Sistem;
              </li>
              <li>
                <strong>Pelaksanaan kewajiban hukum Pengendali Data Pribadi</strong> (UU PDP Pasal
                20 ayat (2) huruf c) — untuk kepentingan pendataan kependudukan;
              </li>
              <li>
                <strong>Pelaksanaan tugas dalam rangka kepentingan umum</strong> (UU PDP Pasal 20
                ayat (2) huruf e) — untuk penyelenggaraan layanan sosial dan kematian.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Pasal 6 - HAK SUBJEK DATA PRIBADI
            </h3>
            <p className="mb-2">Sesuai Pasal 5-15 UU PDP, Anda memiliki hak untuk:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>
                <strong>Hak Mendapatkan Informasi</strong> — mengetahui identitas Pengendali Data,
                tujuan, dan akuntabilitas pemrosesan;
              </li>
              <li>
                <strong>Hak Akses</strong> — mengakses dan memperoleh salinan Data Pribadi;
              </li>
              <li>
                <strong>Hak Memperbarui dan Memperbaiki</strong> — melengkapi atau memperbaiki data
                yang tidak akurat;
              </li>
              <li>
                <strong>Hak Mengakhiri Pemrosesan</strong> — mengakhiri pemrosesan serta menghapus
                Data Pribadi;
              </li>
              <li>
                <strong>Hak Menarik Persetujuan</strong> — menarik kembali persetujuan pemrosesan;
              </li>
              <li>
                <strong>Hak Mengajukan Keberatan</strong> — atas keputusan otomatis;
              </li>
              <li>
                <strong>Hak Menuntut Ganti Rugi</strong> — atas pelanggaran pemrosesan Data Pribadi;
              </li>
              <li>
                <strong>Hak Portabilitas Data</strong> — mendapatkan data dalam format umum.
              </li>
            </ul>
            <p className="mt-3 text-sm text-slate-500">
              Untuk menggunakan hak-hak tersebut, hubungi Pengurus BSKM RW 12 melalui kontak di
              Pasal 11.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Pasal 7 - PENYIMPANAN DAN KEAMANAN DATA
            </h3>
            <ol className="list-decimal pl-5 space-y-3">
              <li>
                <strong>Penyimpanan:</strong> Data disimpan di server Supabase terenkripsi dengan
                standar keamanan industri. Foto KK disimpan dengan nama file acak (UUID) untuk
                mencegah akses tidak sah.
              </li>
              <li>
                <strong>Keamanan:</strong> Data dilindungi dengan Row Level Security (RLS) pada
                database, verifikasi anti-bot Cloudflare Turnstile, autentikasi Admin berbasis token
                (JWT), dan pembatasan akses API di sisi server.
              </li>
              <li>
                <strong>Retensi:</strong> Data disimpan selama warga berdomisili di RW 12, atau
                dialihkan ke arsip historis jika pindah/meninggal. Data dapat dihapus atas permintaan
                Subjek Data Pribadi.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Pasal 8 - PENGUNGKAPAN DATA PRIBADI
            </h3>
            <p className="mb-2">
              Data Pribadi <strong>TIDAK AKAN</strong> diungkapkan kepada pihak ketiga tanpa
              persetujuan Subjek Data Pribadi, kecuali diwajibkan oleh peraturan perundang-undangan.
            </p>
            <p className="mb-2">Data Pribadi <strong>TIDAK AKAN</strong>:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Dijual kepada pihak ketiga;</li>
              <li>Digunakan untuk tujuan komersial;</li>
              <li>Digunakan untuk pelatihan model AI.</li>
            </ul>
            <p className="mt-2 text-sm text-slate-500">
              Pihak ketiga yang terlibat dalam pemrosesan teknis: Supabase (database), Vercel
              (hosting), Mistral AI (OCR — tidak menggunakan data untuk pelatihan), Cloudflare
              (keamanan).
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Pasal 9 - PELANGGARAN DATA PRIBADI
            </h3>
            <p className="mb-2">
              Dalam hal terjadi kegagalan pelindungan Data Pribadi (data breach), BSKM RW 12 akan:
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Melakukan penanganan dan pemulihan sistem segera mungkin;</li>
              <li>
                Memberitahukan secara tertulis kepada Subjek Data Pribadi dan Lembaga terkait paling
                lambat 3 x 24 jam sejak diketahui;
              </li>
              <li>Melaporkan penyebab dan upaya penanganan kepada pihak berwenang.</li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Pasal 10 - PERUBAHAN KEBIJAKAN PRIVASI
            </h3>
            <p>
              Kebijakan Privasi ini dapat diubah sewaktu-waktu untuk menyesuaikan dengan
              perkembangan hukum, teknologi, atau kebutuhan Sistem. Perubahan akan diumumkan melalui
              Sistem dan/atau saluran komunikasi resmi RW 12. Dengan terus menggunakan Sistem
              setelah perubahan, Pengguna dianggap menyetujui perubahan tersebut.
            </p>
          </section>

          <section className="bg-slate-50 p-6 rounded-xl border border-slate-100 mt-8">
            <h3 className="font-bold text-slate-900 text-lg mb-2">Pasal 11 - KONTAK</h3>
            <p className="mb-2">
              Untuk pertanyaan, permohonan penggunaan hak, atau pengaduan terkait pelindungan Data
              Pribadi, silakan menghubungi:
            </p>
            <p className="font-bold text-slate-800">Pengendali Data Pribadi:</p>
            <p className="font-bold text-slate-800">BSKM RW 12</p>
            <p>
              Email:{' '}
              <a
                href="mailto:pengurus@bskm-rw12.id"
                className="text-emerald-600 hover:underline"
              >
                vaaaqee@gmail.com
              </a>
            </p>
            <p>
              Alamat: Sekretariat BSKM RW 12, Perumahan Villa Indah Paus, Kel. Tangkerang Tengah,
              Kec. Marpoyan Damai, Kota Pekanbaru
            </p>
          </section>

          {/* Info Footer — Simpel */}
          <div className="pt-6 mt-8 border-t border-slate-200 text-center text-xs text-slate-500">
            <p>
              Ditetapkan di Pekanbaru, 16 September 2026 oleh Pengurus BSKM RW 12.
            </p>
            <p className="mt-1 font-semibold text-slate-600">
              BSKM RW 12 Villa Indah Paus
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default KebijakanPrivasi;