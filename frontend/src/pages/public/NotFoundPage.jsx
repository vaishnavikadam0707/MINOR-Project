import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-status-critical/10 border border-status-critical/30 text-status-critical flex items-center justify-center mx-auto mb-6 shadow-glow-critical">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <span className="text-xs font-mono text-status-critical uppercase tracking-widest block mb-2">
          ERROR 404 // ROUTE NOT FOUND
        </span>

        <h1 className="text-3xl font-extrabold font-display text-text-primary tracking-tight mb-3">
          Unknown Coordinates
        </h1>

        <p className="text-sm text-text-secondary leading-relaxed mb-8">
          The requested system route does not exist or has been decommissioned from the campus asset directory.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>

          <Button
            variant="primary"
            icon={Home}
            onClick={() => navigate('/')}
          >
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
