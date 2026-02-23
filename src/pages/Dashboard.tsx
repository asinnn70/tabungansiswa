import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  RefreshCw,
  User as UserIcon
} from 'lucide-react';
import { Card, cn, Modal, Button, Input } from '../components/ui';
import { dashboardApi, transactionApi, studentApi } from '../lib/api';
import { DashboardStats, Transaction, Student, User } from '../types';
import { format, isValid } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { StudentCard } from '../components/StudentCard';

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentBalance, setStudentBalance] = useState<number | null>(null);
  const [pendingTotal, setPendingTotal] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const userStr = localStorage.getItem('user');
  const user: User | null = userStr ? JSON.parse(userStr) : null;
  
  const navigate = useNavigate();
  const isApiConfigured = import.meta.env.VITE_GAS_API_URL && !import.meta.env.VITE_GAS_API_URL.includes('YOUR_SCRIPT_ID');

  const fetchData = async () => {
    try {
      if (user?.role === 'admin') {
        const [statsRes, transRes, stuRes] = await Promise.all([
          dashboardApi.getStats(),
          transactionApi.getAll(),
          studentApi.getAll()
        ]);
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (transRes.success && Array.isArray(transRes.data)) {
          const normalized = transRes.data.map((t: any) => ({
            ...t,
            id: t.id || t.ID || t.Id,
            student_id: t.student_id || t.StudentId || t.studentId || t.NIS || t.nis,
            amount: Number(t.amount || t.Amount || 0),
            type: (t.type || t.Type || 'deposit').toLowerCase(),
            status: (t.status || t.Status || 'pending').toLowerCase(),
            date: t.date || t.Date || t.timestamp || t.Timestamp || new Date().toISOString(),
            created_by: t.created_by || t.CreatedBy || t.createdBy || ''
          }));
          setRecentTransactions(normalized.slice(-5).reverse());
          const pending = normalized.filter((t: any) => t.status === 'pending');
          setPendingCount(pending.length);
        }
        if (stuRes.success && Array.isArray(stuRes.data)) {
          const normalizedStudents = stuRes.data.map((s: any) => ({
            ...s,
            id: String(s.id || s.ID || s.Id || s.nis || s.NIS || ''),
            name: s.name || s.Name || 'Tanpa Nama',
            nis: s.nis || s.NIS || '',
            class: s.class || s.Class || s.Kelas || s.kelas || ''
          }));
          setStudents(normalizedStudents);
        }
      } else if (user?.role === 'student' && user.student_id) {
        const [transRes, balanceRes, stuRes] = await Promise.all([
          transactionApi.getAll(),
          transactionApi.getBalance(user.student_id),
          studentApi.getById(user.student_id)
        ]);
        if (transRes.success && Array.isArray(transRes.data)) {
          const allTrans = transRes.data.map((t: any) => ({
            ...t,
            id: t.id || t.ID || t.Id,
            student_id: t.student_id || t.StudentId || t.studentId || t.NIS || t.nis,
            amount: Number(t.amount || t.Amount || 0),
            type: t.type || t.Type || 'deposit',
            status: t.status || t.Status || 'completed',
            date: t.date || t.Date || t.timestamp || t.Timestamp || new Date().toISOString(),
            created_by: t.created_by || t.CreatedBy || t.createdBy || ''
          }));

          if (user?.role === 'student' && user.student_id) {
            const myTrans = allTrans.filter(t => t.student_id === user.student_id);
            setRecentTransactions(myTrans.slice(-5).reverse());
            
            const pending = myTrans
              .filter(t => t.status === 'pending' && t.type === 'deposit')
              .reduce((sum, t) => sum + Number(t.amount), 0);
            setPendingTotal(pending);
          } else {
            setRecentTransactions(allTrans.slice(-5).reverse());
          }
        }
        if (balanceRes.success && balanceRes.data) setStudentBalance(balanceRes.data.balance);
        if (stuRes.success && stuRes.data) {
          const s = stuRes.data as any;
          const normalized = {
            ...s,
            id: String(s.id || s.ID || s.Id || s.nis || s.NIS || ''),
            name: s.name || s.Name || 'Tanpa Nama',
            nis: s.nis || s.NIS || '',
            class: s.class || s.Class || s.Kelas || s.kelas || ''
          };
          setStudents([normalized]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isApiConfigured) {
      setLoading(false);
      return;
    }
    fetchData();

    const intervalId = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [isApiConfigured, user?.role, user?.student_id]);

  const handleRequestDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.student_id) return;
    
    setIsSubmitting(true);
    try {
      const res = await transactionApi.deposit({
        student_id: user.student_id,
        amount: Number(depositAmount),
        method: 'Transfer/Request',
        note: depositNote,
        status: 'pending', // Always pending from student request
        created_by: user.name
      });
      
      if (res.success) {
        setIsDepositModalOpen(false);
        setDepositAmount('');
        setDepositNote('');
        alert('Permintaan setoran telah dikirim dan menunggu persetujuan admin.');
        fetchData();
      } else {
        alert(res.message || 'Gagal mengirim permintaan');
      }
    } catch (error) {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!isApiConfigured && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4 items-start">
          <div className="bg-amber-100 p-2 rounded-lg">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-900">Konfigurasi Diperlukan</h3>
            <p className="text-amber-700 mt-1">
              Backend Google Apps Script belum terhubung. Silakan ikuti panduan di <strong>README.md</strong> untuk men-deploy script dan masukkan URL-nya ke variabel lingkungan <code>VITE_GAS_API_URL</code>.
            </p>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Ringkasan Dashboard</h2>
            <p className="text-slate-500">Selamat datang kembali, {user?.name}!</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchData()} className="flex items-center gap-2">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Segarkan
            </Button>
            {user?.role === 'student' && (
              <>
                <button 
                  onClick={() => setIsDepositModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 rounded-xl text-sm font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Tambah Setoran
                </button>
                <button 
                  onClick={() => window.location.href = '/profile'}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  Edit Profil
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {user?.role === 'admin' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Siswa</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalStudents || 0}</h3>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Tabungan</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(stats?.totalSavings || 0)}</h3>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <Wallet className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card 
            className="p-6 bg-white border-l-4 border-l-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
            onClick={() => navigate('/transactions', { state: { filter: 'pending' } })}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Transaksi Pending</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{pendingCount}</h3>
                 <p className="text-[10px] text-amber-600 font-medium mt-1 italic">* Perlu persetujuan Anda</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-xl">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-white border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Saldo Tabungan Saya</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(studentBalance || 0)}</h3>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl">
                <Wallet className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Setoran Pending</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(pendingTotal)}</h3>
                <p className="text-[10px] text-amber-600 font-medium mt-1 italic">* Menunggu verifikasi admin</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Transaksi Terakhir</h3>
            {user?.role === 'admin' && <button className="text-sm text-emerald-600 font-medium hover:underline">Lihat Semua</button>}
          </div>
          <Card>
            <div className="divide-y divide-slate-100">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => {
                  const student = students.find(s => s.id === tx.student_id);
                  return (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-full",
                          tx.status === 'pending' ? "bg-amber-50 text-amber-600" :
                          tx.type === 'deposit' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                          {tx.status === 'pending' ? <Clock className="w-5 h-5" /> :
                           tx.type === 'deposit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 flex items-center gap-2">
                            {tx.type === 'deposit' ? 'Setoran' : 'Penarikan'} {user?.role === 'admin' ? `- ${student ? student.name : tx.student_id}` : ''}
                            {tx.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                                <Clock className="w-2.5 h-2.5" /> Pending
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">
                            {tx.date && isValid(new Date(tx.date)) 
                              ? format(new Date(tx.date), 'dd MMMM yyyy, HH:mm', { locale: idLocale }) 
                              : '-'}
                          </p>
                        </div>
                      </div>
                      <p className={cn(
                        "font-bold",
                        tx.status === 'pending' ? "text-amber-600" :
                        tx.type === 'deposit' ? "text-emerald-600" : "text-red-600"
                      )}>
                        {tx.type === 'deposit' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500">Belum ada transaksi</div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {user?.role === 'admin' && (
            <>
              <h3 className="text-lg font-semibold text-slate-900">Informasi Sistem</h3>
              <Card className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Waktu Server</p>
                    <p className="text-xs text-slate-500">{format(new Date(), 'EEEE, dd MMMM yyyy', { locale: idLocale })}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Aplikasi ini terhubung langsung dengan Google Sheets sebagai database utama. Pastikan koneksi internet stabil untuk sinkronisasi data.
                  </p>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title="Tambah Setoran Tabungan"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDepositModalOpen(false)}>Batal</Button>
            <Button 
              variant="success" 
              onClick={handleRequestDeposit} 
              isLoading={isSubmitting}
            >
              Kirim Permintaan
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-4">
            <p className="text-xs text-emerald-800 leading-relaxed">
              <strong>Info:</strong> Masukkan jumlah setoran yang ingin Anda tabung. Admin akan memverifikasi dan menyetujui setoran Anda setelah uang diterima.
            </p>
          </div>
          
          <Input 
            label="Jumlah Setoran (IDR)" 
            type="number"
            placeholder="Contoh: 50000"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            required
          />
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Catatan / Pesan</label>
            <textarea 
              className="flex min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              placeholder="Contoh: Titip ke wali kelas / Transfer via Bank"
              value={depositNote}
              onChange={(e) => setDepositNote(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};


