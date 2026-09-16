import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import FormInputWarga from './pages/FormInputWarga';
import PetaWarga from './pages/PetaWarga';
import Login from './pages/auth/Login';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardOverview from './pages/DashboardOverview';
import DataWarga from './pages/DataWarga';
import DataRumah from './pages/DataRumah';
import DaftarKematian from './pages/DaftarKematian';
import DaftarKelahiran from './pages/DaftarKelahiran';
import SyaratKetentuan from './pages/SyaratKetentuan';
import KebijakanPrivasi from './pages/KebijakanPrivasi';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman Publik (Tanpa Login) */}
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/form" element={<FormInputWarga />} />
        <Route path="/login" element={<Login />} />

        {/* Halaman Legal */}
        <Route path="/syarat-ketentuan" element={<SyaratKetentuan />} />
        <Route path="/kebijakan-privasi" element={<KebijakanPrivasi />} />

        {/* Halaman Khusus Pengurus (Dibungkus Layout Sidebar) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="warga" element={<DataWarga />} />
          <Route path="rumah" element={<DataRumah />} />
          <Route path="kematian" element={<DaftarKematian />} />
          <Route path="kelahiran" element={<DaftarKelahiran />} />
        </Route>

        {/* Peta punya halamannya sendiri */}
        <Route path="/peta" element={<PetaWarga />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;