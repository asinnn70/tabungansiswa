import React, { useEffect, useState } from 'react';
import { User as UserIcon, Save, Camera } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { studentApi, transactionApi } from '../lib/api';
import { StudentCard } from '../components/StudentCard';
import { Student, User } from '../types';

export const Profile = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    parent_name: '',
    phone: '',
    photo_url: '',
  });

  const userStr = localStorage.getItem('user');
  const user: User | null = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.student_id) {
        try {
          const [profileRes, balanceRes] = await Promise.all([
            studentApi.getById(user.student_id),
            transactionApi.getBalance(user.student_id)
          ]);

          if (profileRes.success) {
            setStudent(profileRes.data);
            setFormData({
              name: profileRes.data.name,
              parent_name: profileRes.data.parent_name,
              phone: profileRes.data.phone,
              photo_url: profileRes.data.photo_url || '',
            });
          }

          if (balanceRes.success) {
            setBalance(balanceRes.data.balance);
          }

        } catch (error) {
          console.error('Failed to fetch profile', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.student_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.student_id) return;

    setIsSubmitting(true);
    try {
      const res = await studentApi.update(user.student_id, formData);
      if (res.success) {
        setStudent(res.data);
        // Update local storage user name if it changed
        const updatedUser = { ...user, name: res.data.name };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        alert('Profil berhasil diperbarui');
        window.location.reload(); // Refresh to update layout name
      } else {
        alert(res.message || 'Gagal memperbarui profil');
      }
    } catch (error) {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Profil tidak ditemukan atau Anda login sebagai Admin.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Profil Saya</h2>
        <p className="text-slate-500">Kelola informasi pribadi Anda di sini.</p>
      </div>

      {student && <StudentCard student={student} />}

      <div className="mt-8">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-3">Edit Informasi</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Nama Lengkap" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <Input 
              label="Nama Orang Tua" 
              value={formData.parent_name}
              onChange={(e) => setFormData({...formData, parent_name: e.target.value})}
              required
            />
            <Input 
              label="No. Telepon" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
            <Input 
              label="URL Foto Profil" 
              placeholder="https://example.com/photo.jpg"
              value={formData.photo_url}
              onChange={(e) => setFormData({...formData, photo_url: e.target.value})}
            />
            
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2"
                isLoading={isSubmitting}
              >
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
