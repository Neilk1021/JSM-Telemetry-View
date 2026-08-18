import React from 'react';
import { 
  RefreshCw, 
  Settings, 
  Download, 
  Activity, 
  Clock 
} from 'lucide-react';
import type { ApiConfig, EndpointStatus } from '../../types/telemetry';

interface AppNavbarProps {
  config: ApiConfig;
  status: EndpointStatus;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onAutoRefreshChange: (seconds: number) => void;
  onExportCsv: () => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  config,
  status,
  isLoading,
  onRefresh,
  onOpenSettings,
  onAutoRefreshChange,
  onExportCsv,
}) => {
  return (
    <header className="top-navbar">
      <div className="nav-brand">
        <div className="nav-brand-title">
          <Activity size={18} style={{ color: 'var(--color-blue-primary)' }} />
          <span>JSM Telemetry</span>
        </div>
        <span className="nav-brand-subtitle">
          Japanese Salaryman Playtest Data
        </span>
      </div>

      <div className="nav-actions">
        {/* /stats status badge */}
        <span 
          className={`lozenge ${status.statsLive ? 'lozenge-green' : 'lozenge-red'}`}
          title={status.statsError || `Connected: ${config.baseUrl}/stats`}
        >
          /stats: {status.statsLive ? `${status.statsCount} events` : 'Offline'}
        </span>

        {/* /map-attempts status badge */}
        <span 
          className={`lozenge ${status.mapAttemptsLive ? 'lozenge-green' : 'lozenge-gray'}`}
          title={status.mapAttemptsLive ? 'Live' : 'Not live yet (404)'}
        >
          /map-attempts: {status.mapAttemptsLive ? `${status.mapAttemptsCount} records` : 'Not live'}
        </span>

        {/* Auto Refresh dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.5rem' }}>
          <Clock size={13} style={{ color: 'var(--text-secondary)' }} />
          <select
            className="input-select"
            style={{ fontSize: '0.76rem', padding: '0.25rem 0.5rem' }}
            value={config.autoRefreshInterval}
            onChange={(e) => onAutoRefreshChange(Number(e.target.value))}
            title="Auto-refresh interval"
          >
            <option value={0}>Auto: Off</option>
            <option value={10}>Auto: 10s</option>
            <option value={30}>Auto: 30s</option>
            <option value={60}>Auto: 60s</option>
          </select>
        </div>

        {/* Refresh button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
          <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
        </button>

        {/* Export CSV button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onExportCsv}
          title="Export telemetry events to CSV"
        >
          <Download size={13} />
          <span>Export</span>
        </button>

        {/* Settings button */}
        <button
          className="btn btn-secondary btn-icon"
          onClick={onOpenSettings}
          title="Configure API credentials & endpoints"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
};
