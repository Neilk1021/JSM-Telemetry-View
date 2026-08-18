import React, { useState } from 'react';
import { Eye, EyeOff, Activity, RotateCcw } from 'lucide-react';
import type { ApiConfig } from '../../types/telemetry';
import { testConnection, resetStoredConfig } from '../../services/api';

interface SettingsViewProps {
  config: ApiConfig;
  onSave: (newConfig: Partial<ApiConfig>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSave,
}) => {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [autoRefresh, setAutoRefresh] = useState(config.autoRefreshInterval);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{
    statsOk: boolean;
    statsStatus: string;
    mapsOk: boolean;
    mapsStatus: string;
  } | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection(baseUrl, apiKey);
      setTestResult(res);
    } catch {
      setTestResult({
        statsOk: false,
        statsStatus: 'Test failed',
        mapsOk: false,
        mapsStatus: 'Test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSave({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      autoRefreshInterval: autoRefresh,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    const def = resetStoredConfig();
    setBaseUrl(def.baseUrl);
    setApiKey(def.apiKey);
    setAutoRefresh(def.autoRefreshInterval);
    setTestResult(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">API &amp; Environment Settings</h1>
          <div className="page-subtitle">
            Configure connection endpoints, authentication key, and polling parameters
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '640px' }}>
        <div className="card-header">
          <div className="card-title">Backend Connection Configuration</div>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Base URL */}
          <div className="form-group">
            <label>API Base URL</label>
            <input
              type="text"
              className="input-text mono"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://telemetry.japanesesalaryman.dev"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Base URL for the Go telemetry backend server.
            </span>
          </div>

          {/* API Key */}
          <div className="form-group">
            <label>X-API-Key</label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                type={showKey ? 'text' : 'password'}
                className="input-text mono"
                style={{ flex: 1 }}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API Key..."
              />
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Stored locally in browser storage &amp; gitignored .env.local.
            </span>
          </div>

          {/* Auto Refresh */}
          <div className="form-group">
            <label>Auto-Refresh Interval</label>
            <select
              className="input-select"
              value={autoRefresh}
              onChange={(e) => setAutoRefresh(Number(e.target.value))}
            >
              <option value={0}>Disabled (Manual refresh only)</option>
              <option value={10}>Every 10 seconds</option>
              <option value={30}>Every 30 seconds</option>
              <option value={60}>Every 60 seconds</option>
            </select>
          </div>

          {/* Test connection & results */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleTest}
              disabled={isTesting}
            >
              <Activity size={13} className={isTesting ? 'spin' : ''} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleReset}
            >
              <RotateCcw size={13} />
              <span>Reset to Defaults</span>
            </button>
          </div>

          {testResult && (
            <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-xs)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div>
                <span className={`lozenge ${testResult.statsOk ? 'lozenge-green' : 'lozenge-red'}`}>/stats</span>{' '}
                <span className="mono">{testResult.statsStatus}</span>
              </div>
              <div>
                <span className={`lozenge ${testResult.mapsOk ? 'lozenge-green' : 'lozenge-gray'}`}>/map-attempts</span>{' '}
                <span className="mono">{testResult.mapsStatus}</span>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save Configuration
            </button>
            {savedSuccess && (
              <span className="lozenge lozenge-green">Saved successfully</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
