import React, { useState } from 'react';
import { Save, User, Palette, Shield, Settings } from 'lucide-react';
import { useAuth } from '../lib/auth';

const SettingsPage: React.FC = () => {
  const { user, tokens } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const resp = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.access_token}`,
        },
        body: JSON.stringify({ display_name: displayName }),
      });
      if (!resp.ok) throw new Error((await resp.json()).detail || 'Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-[800px] mx-auto">
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <Settings size={16} />
        Settings
      </h2>

      {/* Profile Section */}
      <div className="card-surface p-4">
        <div className="flex items-center gap-2 mb-4">
          <User size={14} className="text-[var(--accent)]" />
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)]">Profile</span>
        </div>
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="block text-[10px] font-medium text-[var(--text-secondary)] mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-xs text-[var(--text-dim)] cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-[var(--text-secondary)] mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              placeholder="Your display name"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <Save size={12} />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            {saved && <span className="text-xs text-[var(--pass)]">Saved!</span>}
            {error && <span className="text-xs text-[var(--fail)]">{error}</span>}
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="card-surface p-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={14} className="text-[var(--accent)]" />
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)]">Account</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-[var(--bg-elevated)]">
            <span className="text-[var(--text-secondary)]">User ID</span>
            <span className="font-mono text-[var(--text-primary)]">{user?.id || '-'}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-[var(--bg-elevated)]">
            <span className="text-[var(--text-secondary)]">Verified</span>
            <span className={`font-semibold ${user?.is_verified ? 'text-[var(--pass)]' : 'text-[var(--warning)]'}`}>
              {user?.is_verified ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between items-center py-1.5 px-2 rounded-lg bg-[var(--bg-elevated)]">
            <span className="text-[var(--text-secondary)]">Member Since</span>
            <span className="font-mono text-[var(--text-primary)]">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Preferences Placeholder */}
      <div className="card-surface p-4">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={14} className="text-[var(--accent)]" />
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)]">Preferences</span>
        </div>
        <div className="text-xs text-[var(--text-dim)] p-3 rounded-lg bg-[var(--bg-elevated)] text-center">
          Theme, notification, and trading preferences coming soon.
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
