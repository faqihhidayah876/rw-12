import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import FormInputWarga from './pages/FormInputWarga';
import PetaWarga from './pages/PetaWarga';
import Login from './pages/auth/Login';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardOverview from './pages/DashboardOverview';
import DataWarga from './pages/DataWarga';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman Publik (Tanpa Login) */}
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/form" element={<FormInputWarga />} />
        <Route path="/login" element={<Login />} />

        {/* Halaman Khusus Pengurus (Dibungkus Layout Sidebar) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="warga" element={<DataWarga />} />
        </Route>

        {/* Peta punya halamannya sendiri (Bisa juga dimasukkan ke layout dashboard jika diinginkan) */}
        <Route path="/peta" element={<PetaWarga />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;