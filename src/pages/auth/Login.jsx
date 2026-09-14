import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowLeft, Loader2, CheckCircle2, X, Eye, EyeOff } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { supabase } from "../../lib/supabase";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [logoutMsg, setLogoutMsg] = useState(location.state?.pesanLogout || '');

  // State untuk visibilitas password
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validasi Anti-Bot Turnstile
    if (!turnstileToken) {
      alert('Sistem mendeteksi aktivitas mencurigakan. Harap tunggu verifikasi keamanan selesai.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Login menggunakan Supabase Auth resmi
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (authError) {
        console.error("Login Error:", authError);
        alert('Email atau password salah!');
        return;
      }

      // 2. Tarik informasi Role (Admin/RW) dari tabel pengurus
      const { data: pengurusData, error: pengurusError } = await supabase
        .from('pengurus')
        .select('*')
        .eq('email', credentials.email)
        .single();

      if (pengurusError || !pengurusData) {
        alert('Akun terdaftar, namun tidak memiliki akses pengurus.');
        return;
      }

      // 3. Simpan data lengkap ke LocalStorage dan masuk ke Dashboard
      localStorage.setItem('user', JSON.stringify(pengurusData));
      navigate('/dashboard');

    } catch (err) {
      console.error("Koneksi Error:", err);
      alert('Terjadi kesalahan koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 relative">

      <div className="absolute top-6 left-6 z-50">
        <Link
          to="/"
          className="flex items-center gap-2 bg-white/60 hover:bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm text-slate-700 font-bold transition-all border border-white"
        >
          <ArrowLeft size={20} />
        </Link>
      </div>

      {/* Notifikasi Logout Berhasil */}
      {logoutMsg && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-green-50 text-green-700 border border-green-200 px-6 py-3 rounded-xl shadow-sm flex items-center gap-3 font-medium text-sm">
          <CheckCircle2 size={18} /> {logoutMsg}
          <button
            onClick={() => setLogoutMsg('')}
            className="ml-2 text-green-500 hover:text-green-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="glass-panel p-8 rounded-3xl w-full max-w-sm relative mt-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-light/50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="text-brand w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-brand-dark">Login Pengurus</h2>
          <p className="text-sm text-slate-500">Silakan login untuk akses data</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* Input Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="email"
              placeholder="Alamat Email"
              required
              value={credentials.email}
              onChange={e => setCredentials({ ...credentials, email: e.target.value })}
              className="w-full bg-white/50 border border-white focus:border-brand rounded-xl pl-11 pr-4 py-3 outline-none transition-all shadow-sm placeholder-slate-400 text-slate-700 font-medium"
            />
          </div>

          {/* Input Password dengan Toggle Mata */}
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
              value={credentials.password}
              onChange={e => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full bg-white/50 border border-white focus:border-brand rounded-xl pl-11 pr-11 py-3 outline-none transition-all shadow-sm placeholder-slate-400 text-slate-700 font-medium"
            />
            {/* Tombol Toggle Mata */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-brand transition-colors focus:outline-none"
              title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Cloudflare Turnstile Widget */}
          <div className="flex justify-center mt-2 min-h-[65px]">
            <Turnstile
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={(token) => setTurnstileToken(token)}
              options={{ theme: 'light' }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !turnstileToken}
            className="glass-button w-full py-3 mt-2 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Masuk Sistem'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;