import React from 'react';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import Button from '../../components/common/Button';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useAppData();
  const { currentUser } = useAuth();

  const userNotifs = notifications.filter(
    (n) => !n.recipientUserId || n.recipientUserId === currentUser?.id
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
            System Notifications
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Real-time campus maintenance warnings, dispatch updates, and status notices.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={CheckCheck}
          onClick={markAllNotificationsAsRead}
        >
          Mark All Read
        </Button>
      </div>

      <div className="space-y-3">
        {userNotifs.map((n) => (
          <div
            key={n.id}
            onClick={() => {
              markNotificationAsRead(n.id);
              if (n.relatedPath) navigate(n.relatedPath);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
              !n.read
                ? 'bg-bg-card border-accent-primary/40 shadow-glow-sm'
                : 'bg-bg-elevated/40 border-industrial-border opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? 'bg-accent-primary animate-pulse' : 'bg-transparent'}`} />
              <div>
                <h3 className="text-sm font-bold text-text-primary">{n.title}</h3>
                <p className="text-xs text-text-secondary mt-0.5">{n.message}</p>
                <span className="text-[10px] font-mono text-text-muted mt-2 block">{n.createdAt}</span>
              </div>
            </div>

            {n.relatedPath && (
              <ExternalLink className="w-4 h-4 text-text-muted hover:text-accent-primary shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
