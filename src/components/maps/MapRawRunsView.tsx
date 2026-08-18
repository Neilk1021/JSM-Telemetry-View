import React from 'react';
import type { MapAttempt, EndpointStatus } from '../../types/telemetry';
import { formatTimestamp, formatNanoseconds } from '../../utils/formatters';

interface MapRawRunsViewProps {
  mapAttempts: MapAttempt[];
  status: EndpointStatus;
}

export const MapRawRunsView: React.FC<MapRawRunsViewProps> = ({
  mapAttempts,
  status,
}) => {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Map Attempts Log</h1>
          <div className="page-subtitle">
            Chronological raw run records from <code>GET /map-attempts</code>
          </div>
        </div>
      </div>

      {!status.mapAttemptsLive && (
        <div className="notice-banner">
          <div>
            <strong>Endpoint Status:</strong> <code>GET /map-attempts</code> is not live yet on the Go backend (HTTP 404).
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Run Attempts Table ({mapAttempts.length})</div>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Player ID</th>
                <th>Map</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Rounds</th>
                <th>Duration</th>
                <th>Towers Used</th>
              </tr>
            </thead>
            <tbody>
              {mapAttempts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No map runs recorded.
                  </td>
                </tr>
              ) : (
                mapAttempts.map((m, idx) => (
                  <tr key={idx}>
                    <td className="mono" style={{ fontSize: '0.78rem' }}>{formatTimestamp(m.timestamp)}</td>
                    <td className="mono">{m.player_id || 'anonymous'}</td>
                    <td className="mono" style={{ fontWeight: 600 }}>{m.map_name}</td>
                    <td>
                      <span className={`lozenge ${m.passed ? 'lozenge-green' : 'lozenge-red'}`}>
                        {m.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td className="mono">{m.attempts}</td>
                    <td className="mono">{m.rounds}</td>
                    <td className="mono">{formatNanoseconds(m.duration)}</td>
                    <td className="mono" style={{ fontSize: '0.75rem' }}>
                      {(m.towers || []).map(t => `${t.tower} x${t.count}`).join(', ') || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
