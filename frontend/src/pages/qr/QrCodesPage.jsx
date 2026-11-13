import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  Search,
  Download,
  Printer,
  ExternalLink,
  MapPin,
  Building,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import Button from '../../components/common/Button';
import SearchInput from '../../components/forms/SearchInput';
import SelectInput from '../../components/forms/SelectInput';
import Badge from '../../components/common/Badge';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../utils/permissions';

export default function QrCodesPage() {
  const navigate = useNavigate();
  const { assets } = useAppData();
  const { role } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const canDownload = hasPermission(role, 'CAN_DOWNLOAD_QR');

  // Dynamic categories
  const categories = React.useMemo(() => {
    const unique = Array.from(new Set(assets.map((a) => a.category).filter(Boolean)));
    return unique.sort().map((c) => ({ value: c, label: c }));
  }, [assets]);

  // Filtered Assets
  const filteredAssets = React.useMemo(() => {
    return assets.filter((a) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.name?.toLowerCase().includes(q) ||
        a.assetId?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q);
      const matchesCat = !categoryFilter || a.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [assets, search, categoryFilter]);

  // Copy URL helper
  const handleCopyTarget = (asset) => {
    const url = `${window.location.origin}/app/assets/${asset.assetId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(asset.id);
    showToast({
      type: 'info',
      title: 'Target Link Copied',
      message: `Copied route for ${asset.assetId}`
    });
    setTimeout(() => setCopiedId(''), 2000);
  };

  // Download PNG helper
  const handleDownloadQr = (asset) => {
    const canvas = document.getElementById(`qr-canvas-${asset.assetId}`);
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${asset.assetId}_QR.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast({
        type: 'success',
        title: 'QR Code Downloaded',
        message: `Saved ${asset.assetId}_QR.png`
      });
    }
  };

  // Print Label helper
  const handlePrintQr = (asset) => {
    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (!printWindow) {
      showToast({
        type: 'error',
        title: 'Pop-up Blocked',
        message: 'Please allow popups to open the print-ready QR label.'
      });
      return;
    }

    const canvas = document.getElementById(`qr-canvas-${asset.assetId}`);
    const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Asset Label - ${asset.assetId}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body {
              font-family: 'Inter', system-ui, sans-serif;
              margin: 0;
              padding: 24px;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #ffffff;
              color: #000000;
            }
            .label-card {
              border: 3px solid #111;
              border-radius: 16px;
              padding: 24px;
              width: 340px;
              text-align: center;
              page-break-inside: avoid;
            }
            .brand {
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              margin-bottom: 10px;
              border-bottom: 2px solid #000;
              padding-bottom: 6px;
            }
            .asset-id {
              font-family: monospace;
              font-size: 24px;
              font-weight: 900;
              margin: 10px 0 6px 0;
            }
            .asset-name {
              font-size: 14px;
              font-weight: 700;
              margin-bottom: 6px;
            }
            .meta {
              font-size: 11px;
              color: #444;
              margin-bottom: 16px;
            }
            img.qr {
              width: 190px;
              height: 190px;
              margin: 0 auto;
              display: block;
            }
            .footer-tag {
              font-size: 10px;
              font-family: monospace;
              color: #555;
              margin-top: 14px;
              border-top: 1px dashed #bbb;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="brand">SMART ASSETCARE // CAMPUS HARDWARE</div>
            <div class="asset-id">${asset.assetId}</div>
            <div class="asset-name">${asset.name}</div>
            <div class="meta">${asset.location} • ${asset.department}</div>
            <img class="qr" src="${qrDataUrl}" alt="QR Code" />
            <div class="footer-tag">SCAN WITH MOBILE TO ACCESS MAINTENANCE RECORDS</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Hidden canvases for PNG downloads */}
      <div className="hidden">
        {assets.map((a) => (
          <QRCodeCanvas
            key={`canvas-${a.assetId}`}
            id={`qr-canvas-${a.assetId}`}
            value={window.location.origin + `/app/assets/${a.assetId}`}
            size={512}
            level="H"
            includeMargin={true}
          />
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-text-primary tracking-tight">
            QR Code Management
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Generate, download and print high-resolution digital barcodes linking directly to asset telemetry.
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-accent-primary/10 border border-accent-primary/30 text-xs font-mono text-accent-primary flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          <span>{assets.length} Active Digital Passports</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-bg-card border border-industrial-border flex flex-col sm:flex-row items-center gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Filter QR cards by asset name, ID, or location..."
          className="flex-1 w-full"
        />

        <div className="w-full sm:w-64">
          <SelectInput
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={categories}
            placeholder="All Categories"
          />
        </div>

        {(search || categoryFilter) && (
          <Button
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={() => {
              setSearch('');
              setCategoryFilter('');
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* QR Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAssets.map((ast) => {
          const qrRoute = `/app/assets/${ast.assetId}`;

          return (
            <div
              key={ast.id}
              className="p-5 rounded-2xl bg-bg-card border border-industrial-border hover:border-accent-primary/40 hover:shadow-glow-sm transition-all duration-300 flex flex-col items-center justify-between text-center group"
            >
              {/* Top Meta */}
              <div className="w-full flex items-center justify-between text-xs font-mono mb-3">
                <span className="font-bold text-accent-primary">{ast.assetId}</span>
                <Badge status={ast.status} size="xs" />
              </div>

              {/* QR Code Container */}
              <div
                onClick={() => navigate(qrRoute)}
                className="w-44 h-44 p-4 rounded-2xl bg-white shadow-card-dark flex items-center justify-center mb-3 cursor-pointer group-hover:scale-105 transition-transform duration-300"
                title="Click to open Asset Details"
              >
                <QRCodeSVG
                  value={window.location.origin + qrRoute}
                  size={150}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Details */}
              <div className="w-full space-y-1 mb-4">
                <h3
                  onClick={() => navigate(qrRoute)}
                  className="text-sm font-bold font-display text-text-primary hover:text-accent-primary transition-colors cursor-pointer truncate"
                  title={ast.name}
                >
                  {ast.name}
                </h3>

                <p className="text-[11px] text-text-muted truncate">
                  {ast.location}
                </p>

                <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] font-mono text-text-muted">
                  <span>Target: {qrRoute}</span>
                  <button
                    onClick={() => handleCopyTarget(ast)}
                    className="text-accent-primary hover:underline"
                    title="Copy full link"
                  >
                    {copiedId === ast.id ? (
                      <Check className="w-3 h-3 text-status-success inline" />
                    ) : (
                      <Copy className="w-3 h-3 inline" />
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full pt-2 border-t border-industrial-border">
                <Button
                  variant="outline"
                  size="xs"
                  icon={Download}
                  onClick={() => handleDownloadQr(ast)}
                  className="flex-1 justify-center"
                  disabled={!canDownload}
                  title={!canDownload ? 'Manager/Admin only' : 'Download PNG'}
                >
                  PNG
                </Button>

                <Button
                  variant="primary"
                  size="xs"
                  icon={Printer}
                  onClick={() => handlePrintQr(ast)}
                  className="flex-1 justify-center"
                  disabled={!canDownload}
                  title={!canDownload ? 'Manager/Admin only' : 'Print Label'}
                >
                  Print Tag
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
