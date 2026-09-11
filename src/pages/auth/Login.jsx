import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { supabase } from "../../lib/supabase";

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validasi Anti-Bot Turnstile
    if (!turnstileToken) {
      alert('Sistem mendeteksi aktivitas mencurigakan. Harap tunggu verifikasi keamanan selesai.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Memanggil fungsi RPC (Stored Procedure) di Supabase yang mengecek password Hash
      const { data, error } = await supabase.rpc('cek_login_pengurus', {
        input_email: credentials.email,
        input_password: credentials.password
      });

      // Jika ada error dari server atau data tidak ditemukan (array kosong)
      if (error || !data || data.length === 0) {
        console.error("Login Error:", error);
        alert('Email atau password salah! Pastikan huruf besar/kecilnya tepat.');
      } else {
        // Login Berhasil! Simpan data (id, email, role, nama_lengkap) ke localStorage
        localStorage.setItem('user', JSON.stringify(data[0]));
        navigate('/dashboard'); 
      }
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
        <Link to="/" className="flex items-center gap-2 bg-white/60 hover:bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm text-slate-700 font-bold transition-all border border-white">
          <ArrowLeft size={20} />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      <div className="glass-panel p-8 rounded-3xl w-full max-w-sm relative mt-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-light/50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="text-brand w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-brand-dark">Portal Pengurus</h2>
          <p className="text-sm text-slate-500">Silakan login untuk akses data</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
              type="email" 
              placeholder="Alamat Email" 
              required 
              value={credentials.email}
              onChange={e => setCredentials({...credentials, email: e.target.value})}
              className="w-full bg-white/50 border border-white focus:border-brand rounded-xl pl-11 pr-4 py-3 outline-none transition-all shadow-sm placeholder-slate-400 text-slate-700 font-medium" 
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              required 
              value={credentials.password}
              onChange={e => setCredentials({...credentials, password: e.target.value})}
              className="w-full bg-white/50 border border-white focus:border-brand rounded-xl pl-11 pr-4 py-3 outline-none transition-all shadow-sm placeholder-slate-400 text-slate-700 font-medium" 
            />
          </div>

          <div className="flex justify-center mt-2">
            <Turnstile 
              siteKey="1x00000000000000000000AA" 
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