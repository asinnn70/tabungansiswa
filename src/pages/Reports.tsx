import React, { useEffect, useState } from 'react';
import { 
  Download, 
  Filter, 
  FileSpreadsheet,
  Printer,
  Search
} from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { studentApi, transactionApi } from '../lib/api';
import { Student } from '../types';

export const Reports = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const isApiConfigured = import.meta.env.VITE_GAS_API_URL && !import.meta.env.VITE_GAS_API_URL.includes('YOUR_SCRIPT_ID');

  const fetchData = async () => {
    if (!isApiConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const stuRes = await studentApi.getAll();
      if (stuRes.success) {
        setStudents(stuRes.data);
        // Fetch balances for all students
        const balancePromises = stuRes.data.map(s => transactionApi.getBalance(s.id));
        const balanceResults = await Promise.all(balancePromises);
        
        const balanceMap: Record<string, number> = {};
        stuRes.data.forEach((s, i) => {
          if (balanceResults[i].success) {
            balanceMap[s.id] = balanceResults[i].data.balance;
          }
        });
        setBalances(balanceMap);
      }
    } catch (error) {
      console.error('Failed to fetch report data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const classes = ['Semua', ...Array.from(new Set(students.map(s => s.class)))];

  const filteredStudents = students.filter(s => {
    const matchClass = filterClass === 'Semua' || s.class === filterClass;
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis.includes(searchTerm);
    return matchClass && matchSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const exportCSV = () => {
    const headers = ['NIS', 'Nama', 'Kelas', 'Saldo'];
    const rows = filteredStudents.map(s => [
      s.nis,
      s.name,
      s.class,
      balances[s.id] || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Tabungan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Laporan Saldo Siswa</h2>
          <p className="text-slate-500">Lihat dan ekspor rekapitulasi saldo tabungan seluruh siswa.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Cetak
          </Button>
          <Button onClick={exportCSV} className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Ekspor CSV
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-1 gap-4">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input 
                placeholder="Cari siswa..." 
                className="pl-10 bg-white" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Kelas:</span>
              <select 
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
            <p className="text-xs text-emerald-600 font-semibold uppercase">Total Saldo Terfilter</p>
            <p className="text-lg font-bold text-emerald-700">
              {formatCurrency(filteredStudents.reduce((sum, s) => sum + (balances[s.id] || 0), 0))}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">NIS</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Lengkap</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Saldo Tabungan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{student.nis}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{student.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.class}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">
                      {formatCurrency(balances[student.id] || 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
