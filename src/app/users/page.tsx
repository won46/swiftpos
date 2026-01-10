'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { SearchInput, Button, Modal, Input } from '@/components/ui';
import { usersAPI } from '@/services/api';
import { Plus, Edit, Trash2, Users as UsersIcon, Shield, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string | Role;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'KASIR',
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (selectedRole) params.role = selectedRole;

      const response = await usersAPI.getAll(params);
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleName = (role: string | Role): string => {
    if (typeof role === 'string') return role;
    return role.name; // or role.displayName if preferred
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        fullName: user.fullName,
        role: getRoleName(user.role),
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        fullName: '',
        role: 'KASIR',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // Update
        await usersAPI.update(editingUser.id, {
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role as 'ADMIN' | 'MANAGER' | 'KASIR',
          isActive: formData.isActive,
          password: formData.password || undefined,
        });
      } else {
        // Create
        if (!formData.password) {
          alert('Password harus diisi untuk user baru');
          return;
        }
        await usersAPI.create({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role as 'ADMIN' | 'MANAGER' | 'KASIR',
        });
      }

      fetchUsers();
      handleCloseModal();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      alert(error.response?.data?.message || 'Gagal menyimpan user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;

    try {
      await usersAPI.delete(id);
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Gagal menghapus user');
    }
  };

  const getRoleIcon = (roleInput: string | Role) => {
    const role = getRoleName(roleInput);
    switch (role) {
      case 'ADMIN':
        return <Shield size={16} className="text-[var(--error)]" />;
      case 'MANAGER':
        return <UsersIcon size={16} className="text-[var(--warning)]" />;
      default:
        return <User size={16} className="text-[var(--info)]" />;
    }
  };

  const getRoleBadge = (roleInput: string | Role) => {
    const role = getRoleName(roleInput);
    switch (role) {
      case 'ADMIN':
        return 'badge-error';
      case 'MANAGER':
        return 'badge-warning';
      default:
        return 'badge-info';
    }
  };

  const filteredUsers = users.filter((user) =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 gradient-text">Manajemen Pengguna</h1>
            <p className="text-[var(--foreground-muted)]">
              Kelola akun pengguna dan hak akses
            </p>
          </div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => handleOpenModal()}
          >
            Tambah User
          </Button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama atau email..."
            />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input"
            >
              <option value="">Semua Role</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="KASIR">Kasir</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Total User</p>
            <p className="text-2xl font-bold">{filteredUsers.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Admin</p>
            <p className="text-2xl font-bold text-[var(--error)]">
              {filteredUsers.filter((u) => getRoleName(u.role) === 'ADMIN').length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Manager</p>
            <p className="text-2xl font-bold text-[var(--warning)]">
              {filteredUsers.filter((u) => getRoleName(u.role) === 'MANAGER').length}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-[var(--foreground-muted)] mb-1">Kasir</p>
            <p className="text-2xl font-bold text-[var(--info)]">
              {filteredUsers.filter((u) => getRoleName(u.role) === 'KASIR').length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="card">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[var(--foreground-muted)]">Memuat users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon size={48} className="mx-auto mb-4 text-[var(--foreground-muted)]" />
              <p className="text-[var(--foreground-muted)]">Tidak ada user</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Terdaftar</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="font-medium">{user.fullName}</td>
                      <td className="text-[var(--foreground-muted)]">{user.email}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span className={`badge ${getRoleBadge(user.role)}`}>
                            {getRoleName(user.role)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                          {user.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="text-[var(--foreground-muted)] text-sm">
                        {formatDate(user.createdAt)}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 rounded-lg hover:bg-[var(--error-bg)] text-[var(--error)] transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        size="md"
      >
        <h2 className="text-xl font-bold mb-6">
          {editingUser ? 'Edit User' : 'Tambah User Baru'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nama Lengkap *</label>
            <Input
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Password {editingUser ? '(kosongkan jika tidak diubah)' : '*'}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? 'Biarkan kosong untuk tidak mengubah' : 'Password'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="input w-full"
            >
              <option value="KASIR">Kasir</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Admin: Full access | Manager: Manage products & reports | Kasir: POS only
            </p>
          </div>

          {editingUser && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">User Aktif</span>
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleCloseModal}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSaveUser}
          >
            {editingUser ? 'Simpan Perubahan' : 'Tambah User'}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
