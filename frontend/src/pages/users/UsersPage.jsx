import React, { useState } from 'react';
import { Users, UserPlus, Shield, CheckCircle2, XCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { getRoleBadgeStyle } from '../../utils/permissions';

export default function UsersPage() {
  const { users, toggleUserStatus } = useAppData();
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
            User Management
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Admin console: Manage campus roles, technicians, and departmental faculty privileges.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={UserPlus}
          onClick={() => alert('Add user modal will be implemented in Phase 6!')}
        >
          Add Demo User
        </Button>
      </div>

      <div className="rounded-2xl border border-industrial-border overflow-hidden bg-bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-bg-secondary text-text-muted border-b border-industrial-border">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Department</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border">
              {users.map((u) => {
                const roleBadge = getRoleBadgeStyle(u.role);
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center text-accent-primary font-bold">
                          {u.avatarInitials}
                        </div>
                        <span className="font-semibold text-text-primary font-sans">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-text-muted">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] ${roleBadge.bg}`}>
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="p-4 text-text-secondary">{u.department}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 ${u.active ? 'text-status-success' : 'text-status-critical'}`}>
                        {u.active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {u.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-4">
                      {!isSelf && (
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className="text-[11px] text-text-muted hover:text-accent-primary underline"
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
