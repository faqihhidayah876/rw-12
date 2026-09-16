import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const SyaratKetentuan = () => {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-10 relative">

        {/* Tombol Kembali */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium mb-8 transition-colors"
        >
          <ArrowLeft size={20} /> Kembali ke Halaman Utama
        </Link>

        {/* Header Dokumen */}
        <div className="text-center mb-10 pb-8 border-b border-slate-200">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            SYARAT DAN KETENTUAN
          </h1>
          <p className="text-slate-600 font-medium">
            Penggunaan Sistem Informasi Kependudukan BSKM RW 12
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
              Selamat datang di Sistem Informasi Kependudukan BSKM RW 12 (selanjutnya disebut
              "Sistem"). Sistem ini dikelola oleh Badan Sosial dan Kematian Masyarakat (BSKM) RW 12
              Villa Indah Paus sebagai sarana pendataan warga, pencatatan kelahiran, dan pencatatan
              kematian.
            </p>
            <p>
              Dengan mengakses dan menggunakan Sistem ini, Anda (selanjutnya disebut "Pengguna")
              dianggap telah membaca, memahami, dan menyetujui seluruh Syarat dan Ketentuan yang
              berlaku.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Pasal 2 - DEFINISI</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Sistem</strong> adalah platform digital untuk pendataan warga RW 12.
              </li>
              <li>
                <strong>Pengguna</strong> adalah setiap individu yang mengakses Sistem.
              </li>
              <li>
                <strong>Tim Lapangan</strong> adalah anggota BSKM yang ditugaskan melakukan pendataan
                warga secara langsung dari rumah ke rumah.
              </li>
              <li>
                <strong>Admin</strong> adalah pengurus BSKM yang memiliki hak akses penuh untuk
                mengelola data dalam Sistem.
              </li>
              <li>
                <strong>Data Pribadi</strong> adalah data yang mengidentifikasi seseorang, baik
                secara langsung maupun tidak langsung.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Pasal 3 - KETENTUAN PENGGUNAAN</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Pengguna setuju untuk menggunakan Sistem ini hanya untuk tujuan yang sah, yaitu
                pendataan warga RW 12.
              </li>
              <li>
                Pengguna dilarang:
                <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
                  <li>Memasukkan data palsu, tidak benar, atau menyesatkan;</li>
                  <li>Menggunakan Sistem untuk tujuan komersial tanpa izin;</li>
                  <li>Melakukan tindakan yang merusak, mengganggu, atau membebani Sistem;</li>
                  <li>Mencoba mengakses data tanpa otorisasi;</li>
                  <li>Menggunakan alat otomatis (bot) untuk mengakses Sistem tanpa izin tertulis.</li>
                </ul>
              </li>
              <li>
                Sistem ini dilindungi oleh teknologi Cloudflare Turnstile untuk mencegah
                penyalahgunaan oleh bot atau aktivitas otomatis.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Pasal 4 - AKUN DAN OTORISASI</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Akses ke Sistem terbagi menjadi: Akses Publik (tanpa login) dan Akses Admin
                (memerlukan login).
              </li>
              <li>
                Akun Admin hanya diberikan kepada pengurus BSKM yang ditunjuk secara resmi oleh
                Ketua RW 12.
              </li>
              <li>
                Pengguna yang memiliki akun Admin wajib menjaga kerahasiaan kredensial (email dan
                password) mereka.
              </li>
              <li>
                Segala aktivitas yang dilakukan melalui akun Admin menjadi tanggung jawab pemilik
                akun.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Pasal 5 - DATA YANG DIKUMPULKAN</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Sistem ini mengumpulkan data sebagai berikut:
                <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
                  <li>
                    <strong>Data Keluarga:</strong> Nomor Kartu Keluarga, Nama Kepala Keluarga, RT,
                    No. HP, Agama;
                  </li>
                  <li>
                    <strong>Data Warga:</strong> NIK, Nama Lengkap, Hubungan Keluarga, Status
                    (Hidup/Meninggal/Pindah);
                  </li>
                  <li>
                    <strong>Data Rumah:</strong> Blok/Nomor Rumah, Koordinat GPS, Status Hunian;
                  </li>
                  <li>
                    <strong>Data Dokumen:</strong> Foto Kartu Keluarga (KK);
                  </li>
                  <li>
                    <strong>Data Lokasi:</strong> Koordinat GPS saat pendataan.
                  </li>
                </ul>
              </li>
              <li>
                Seluruh data dikumpulkan semata-mata untuk kepentingan pendataan kependudukan RW 12
                dan penyelenggaraan layanan BSKM.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Pasal 6 - PENGGUNAAN KECERDASAN BUATAN (AI)
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Sistem ini menggunakan teknologi Optical Character Recognition (OCR) berbasis AI
                untuk membaca data dari foto Kartu Keluarga.
              </li>
              <li>
                Data gambar yang diunggah untuk keperluan OCR:
                <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
                  <li>Diproses melalui penyedia layanan AI pihak ketiga (Mistral AI);</li>
                  <li>
                    <strong>TIDAK digunakan</strong> untuk pelatihan model AI tersebut;
                  </li>
                  <li>Dihapus dari server setelah pemrosesan selesai.</li>
                </ul>
              </li>
              <li>
                Pengguna dapat memilih untuk tidak menggunakan fitur OCR dan mengisi data secara
                manual.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Pasal 7 - BATASAN TANGGUNG JAWAB
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Pengurus BSKM RW 12 berupaya semaksimal mungkin menjaga keamanan Sistem, namun tidak
                bertanggung jawab atas: gangguan force majeure, kerugian akibat penyalahgunaan akun,
                atau ketidakakuratan data akibat kesalahan input.
              </li>
              <li>
                Pengguna bertanggung jawab penuh atas kebenaran data yang dimasukkan ke dalam
                Sistem.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Pasal 8 - HAK KEKAYAAN INTELEKTUAL
            </h3>
            <p>
              Seluruh konten, desain, dan kode dalam Sistem ini merupakan milik BSKM RW 12.
              Pengguna dilarang memperbanyak, memodifikasi, atau mendistribusikan konten tanpa izin
              tertulis.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Pasal 9 - PERUBAHAN SYARAT DAN KETENTUAN
            </h3>
            <p>
              BSKM RW 12 berhak mengubah Syarat dan Ketentuan ini sewaktu-waktu. Perubahan akan
              diumumkan melalui Sistem dan/atau saluran komunikasi resmi RW 12. Dengan terus
              menggunakan Sistem setelah perubahan dilakukan, Pengguna dianggap menyetujui perubahan
              tersebut.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Pasal 10 - HUKUM YANG BERLAKU
            </h3>
            <p>
              Syarat dan Ketentuan ini tunduk pada hukum yang berlaku di Republik Indonesia. Segala
              perselisihan yang timbul akan diselesaikan secara musyawarah mufakat. Apabila tidak
              tercapai kesepakatan, penyelesaian akan dilakukan sesuai dengan ketentuan hukum yang
              berlaku.
            </p>
          </section>

          <section className="bg-slate-50 p-6 rounded-xl border border-slate-100 mt-8">
            <h3 className="font-bold text-slate-900 text-lg mb-2">Pasal 11 - KONTAK</h3>
            <p className="mb-2">
              Untuk pertanyaan atau informasi lebih lanjut terkait Syarat dan Ketentuan ini, silakan
              menghubungi:
            </p>
            <p className="font-bold text-slate-800">Pengurus BSKM RW 12</p>
            <p>
              Email:{' '}
              <a
                href="mailto:pengurus@bskm-rw12.id"
                className="text-blue-600 hover:underline"
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

export default SyaratKetentuan;