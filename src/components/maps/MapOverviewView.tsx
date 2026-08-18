import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import type { MapAttempt, EndpointStatus } from '../../types/telemetry';
import { aggregateMaps } from '../../utils/analytics';
import { SimpleChartTooltip } from '../charts/SimpleChartTooltip';
import { formatNumber, formatPercent, formatNanoseconds } from '../../utils/formatters';

interface MapOverviewViewProps {
  mapAttempts: MapAttempt[];
  status: EndpointStatus;
}

export const MapOverviewView: React.FC<MapOverviewViewProps> = ({
  mapAttempts,
  status,
}) => {
  const mapStats = aggregateMaps(mapAttempts);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Map Pass / Fail Rates</h1>
          <div className="page-subtitle">
            Hacking map completion rates, attempts to clear, and survival metrics (from <code>GET /map-attempts</code>)
          </div>
        </div>
      </div>

      {/* Offline / Not Live Notice Banner */}
      {!status.mapAttemptsLive && (
        <div className="notice-banner">
          <div>
            <strong>Endpoint Status:</strong> <code>GET /map-attempts</code> is not live yet on the Go backend (HTTP 404).
            <div style={{ marginTop: '0.2rem', fontSize: '0.78rem' }}>
              When the backend developer deploys the map telemetry endpoint, this section will automatically populate with real pass/fail stats and difficulty metrics.
            </div>
          </div>
        </div>
      )}

      {mapAttempts.length > 0 ? (
        <>
          <div className="metrics-row">
            <div className="metric-card">
              <div className="metric-label">Total Map Runs</div>
              <div className="metric-value">{mapAttempts.length}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Distinct Maps</div>
              <div className="metric-value">{mapStats.length}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Overall Win Rate</div>
              <div className="metric-value">
                {formatPercent(mapAttempts.filter(a => a.passed).length / mapAttempts.length)}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Pass vs Fail per Map</div>
            </div>
            <div className="card-body">
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mapStats} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ebecf0" />
                    <XAxis dataKey="mapName" stroke="#5e6c84" fontSize={11} />
                    <YAxis stroke="#5e6c84" fontSize={11} />
                    <Tooltip content={<SimpleChartTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="passedCount" name="Passed" fill="#36b37e" stackId="a" />
                    <Bar dataKey="failedCount" name="Failed" fill="#ff5630" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Map Difficulty Summary Table</div>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Map Name</th>
                    <th>Total Attempts</th>
                    <th>Win Rate</th>
                    <th>Record (W / L)</th>
                    <th>Avg Attempts to Clear</th>
                    <th>Avg Duration</th>
                    <th>1st-Time Pass %</th>
                  </tr>
                </thead>
                <tbody>
                  {mapStats.map((m) => (
                    <tr key={m.mapName}>
                      <td className="mono" style={{ fontWeight: 600 }}>{m.mapName}</td>
                      <td className="mono">{formatNumber(m.totalAttempts)}</td>
                      <td className="mono" style={{ fontWeight: 600 }}>{formatPercent(m.passRate)}</td>
                      <td className="mono">{m.passedCount}W / {m.failedCount}L</td>
                      <td className="mono">{m.avgAttemptsToComplete.toFixed(1)}</td>
                      <td className="mono">{formatNanoseconds(m.avgDurationSec * 1_000_000_000)}</td>
                      <td className="mono">{m.firstTimeTotal > 0 ? formatPercent(m.firstTimePassRate) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No map attempt data available from <code>GET /map-attempts</code>.</p>
        </div>
      )}
    </div>
  );
};
