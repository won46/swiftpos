'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui';
import { Shield, RotateCcw, Save, AlertCircle } from 'lucide-react';
import { rolePermissionsAPI } from '@/services/api';
import type { RolePermission } from '@/types';

type RoleTab = 'ADMIN' | 'MANAGER' | 'CASHIER';

export default function PermissionsPage() {
  const [activeRole, setActiveRole] = useState<RoleTab>('ADMIN');
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, [activeRole]);

  const fetchPermissions = async () => {
    try {
      setIsLoading(true);
      const response = await rolePermissionsAPI.getByRole(activeRole);
      setPermissions(response.data.data || []);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      alert('Gagal mengambil data permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePermission = (menuPath: string, field: keyof RolePermission, value: boolean) => {
    setPermissions(prev =>
      prev.map(p =>
        p.menuPath === menuPath ? { ...p, [field]: value } : p
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await rolePermissionsAPI.bulkUpdate(activeRole, permissions);
      alert('Permissions berhasil disimpan!');
      setHasChanges(false);
      fetchPermissions();
    } catch (error) {
      console.error('Failed to save permissions:', error);
      alert('Gagal menyimpan permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset permissions ke default? Perubahan yang belum disimpan akan hilang.')) {
      return;
    }

    try {
      setIsSaving(true);
      await rolePermissionsAPI.resetToDefaults(activeRole);
      alert('Permissions berhasil di-reset ke default!');
      fetchPermissions();
    } catch (error) {
      console.error('Failed to reset permissions:', error);
      alert('Gagal reset permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadgeColor = (role: RoleTab) => {
    const colors = {
      ADMIN: 'bg-purple-500',
      MANAGER: 'bg-blue-500',
      CASHIER: 'bg-green-500',
    };
    return colors[role];
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Kelola Permissions</h1>
              <p className="text-[var(--foreground-muted)]">
                Konfigurasi hak akses menu untuk setiap role
              </p>
            </div>
          </div>

          {/* Info Alert */}
          <div className="card bg-blue-500/10 border-blue-500/20">
            <div className="flex gap-3">
              <AlertCircle className="text-blue-500 flex-shrink-0" size={20} />
              <div className="text-sm">
                <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">
                  Perubahan berlaku real-time
                </p>
                <p className="text-[var(--foreground-muted)]">
                  Setelah disimpan, user dengan role tersebut akan langsung melihat menu sesuai permission yang dikonfigurasi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="flex gap-2 mb-6">
          {(['ADMIN', 'MANAGER', 'CASHIER'] as RoleTab[]).map((role) => (
            <button
              key={role}
              onClick={() => {
                if (hasChanges) {
                  if (confirm('Ada perubahan yang belum disimpan. Lanjutkan?')) {
                    setActiveRole(role);
                  }
                } else {
                  setActiveRole(role);
                }
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeRole === role
                  ? `${getRoleBadgeColor(role)} text-white shadow-lg`
                  : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Permission Matrix */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              Permission Matrix - {activeRole}
            </h2>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                icon={RotateCcw}
                onClick={handleReset}
                disabled={isSaving}
              >
                Reset ke Default
              </Button>
              <Button
                variant="primary"
                icon={Save}
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4 font-semibold">Menu</th>
                    <th className="text-center py-3 px-4 font-semibold w-24">
                      <div className="flex flex-col items-center">
                        <span>Read</span>
                        <span className="text-xs font-normal text-[var(--foreground-muted)]">(View)</span>
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 font-semibold w-24">
                      <div className="flex flex-col items-center">
                        <span>Create</span>
                        <span className="text-xs font-normal text-[var(--foreground-muted)]">(Add)</span>
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 font-semibold w-24">
                      <div className="flex flex-col items-center">
                        <span>Update</span>
                        <span className="text-xs font-normal text-[var(--foreground-muted)]">(Edit)</span>
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 font-semibold w-24">
                      <div className="flex flex-col items-center">
                        <span>Delete</span>
                        <span className="text-xs font-normal text-[var(--foreground-muted)]">(Remove)</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission) => (
                    <tr
                      key={permission.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{permission.menuLabel}</p>
                          <p className="text-sm text-[var(--foreground-muted)]">
                            {permission.menuPath}
                          </p>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <input
                          type="checkbox"
                          checked={permission.canRead}
                          onChange={(e) =>
                            updatePermission(permission.menuPath, 'canRead', e.target.checked)
                          }
                          className="w-5 h-5 cursor-pointer accent-[var(--primary)]"
                        />
                      </td>
                      <td className="text-center py-3 px-4">
                        <input
                          type="checkbox"
                          checked={permission.canCreate}
                          onChange={(e) =>
                            updatePermission(permission.menuPath, 'canCreate', e.target.checked)
                          }
                          disabled={!permission.canRead}
                          className="w-5 h-5 cursor-pointer accent-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="text-center py-3 px-4">
                        <input
                          type="checkbox"
                          checked={permission.canUpdate}
                          onChange={(e) =>
                            updatePermission(permission.menuPath, 'canUpdate', e.target.checked)
                          }
                          disabled={!permission.canRead}
                          className="w-5 h-5 cursor-pointer accent-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="text-center py-3 px-4">
                        <input
                          type="checkbox"
                          checked={permission.canDelete}
                          onChange={(e) =>
                            updatePermission(permission.menuPath, 'canDelete', e.target.checked)
                          }
                          disabled={!permission.canRead}
                          className="w-5 h-5 cursor-pointer accent-[var(--primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="card mt-6 bg-[var(--surface)]">
          <h3 className="font-semibold mb-3">Keterangan:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex gap-2">
              <span className="font-medium">Read:</span>
              <span className="text-[var(--foreground-muted)]">User bisa lihat & akses menu</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Create:</span>
              <span className="text-[var(--foreground-muted)]">User bisa tambah data baru</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Update:</span>
              <span className="text-[var(--foreground-muted)]">User bisa edit data existing</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Delete:</span>
              <span className="text-[var(--foreground-muted)]">User bisa hapus data</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
