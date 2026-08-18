import React, { useState } from 'react';
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
import { aggregateTowers } from '../../utils/analytics';
import { SimpleChartTooltip } from '../charts/SimpleChartTooltip';
import { formatNumber, formatPercent } from '../../utils/formatters';

interface TowerPopularityViewProps {
  mapAttempts: MapAttempt[];
  status: EndpointStatus;
}

export const TowerPopularityView: React.FC<TowerPopularityViewProps> = ({
  mapAttempts,
  status,
}) => {
  const [metricMode, setMetricMode] = useState<'deployment' | 'winrate'>('deployment');
  const towerStats = aggregateTowers(mapAttempts);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tower Popularity &amp; Usage</h1>
          <div className="page-subtitle">
            Hacking tower deployment volume, pick rates, and win rates (from <code>GET /map-attempts</code>)
          </div>
        </div>
      </div>

      {!status.mapAttemptsLive && (
        <div className="notice-banner">
          <div>
            <strong>Endpoint Status:</strong> <code>GET /map-attempts</code> is not live yet on the Go backend (HTTP 404).
            <div style={{ marginTop: '0.2rem', fontSize: '0.78rem' }}>
              Once the endpoint is live and players complete runs with towers, tower rankings and win rates will automatically display here.
            </div>
          </div>
        </div>
      )}

      {towerStats.length > 0 ? (
        <>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Tower Metrics Chart</div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  className={`btn btn-sm ${metricMode === 'deployment' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMetricMode('deployment')}
                >
                  Deployment Volume
                </button>
                <button
                  className={`btn btn-sm ${metricMode === 'winrate' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMetricMode('winrate')}
                >
                  Win Rate (%)
                </button>
              </div>
            </div>
            <div className="card-body">
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={towerStats} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ebecf0" />
                    <XAxis dataKey="tower" stroke="#5e6c84" fontSize={11} />
                    <YAxis stroke="#5e6c84" fontSize={11} />
                    <Tooltip content={<SimpleChartTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    {metricMode === 'deployment' ? (
                      <>
                        <Bar dataKey="totalDeployedCount" name="Total Deployed Units" fill="#0052cc" />
                        <Bar dataKey="runsPickedCount" name="Runs Picked" fill="#6554c0" />
                      </>
                    ) : (
                      <Bar 
                        dataKey="winRate" 
                        name="Win Rate" 
                        fill="#36b37e" 
                        unit="%"
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Tower Usage Table</div>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tower Name</th>
                    <th>Total Deployed</th>
                    <th>Runs Picked</th>
                    <th>Pick Rate</th>
                    <th>Avg Units / Run</th>
                    <th>Avg Level</th>
                    <th>Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {towerStats.map((t) => (
                    <tr key={t.tower}>
                      <td className="mono" style={{ fontWeight: 600 }}>{t.tower}</td>
                      <td className="mono">{formatNumber(t.totalDeployedCount)}</td>
                      <td className="mono">{t.runsPickedCount}</td>
                      <td className="mono">{formatPercent(t.pickRate)}</td>
                      <td className="mono">{t.avgCountPerRun.toFixed(1)}</td>
                      <td className="mono">Lvl {t.avgLevel.toFixed(1)}</td>
                      <td className="mono" style={{ fontWeight: 600 }}>{formatPercent(t.winRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No tower telemetry available from <code>GET /map-attempts</code>.</p>
        </div>
      )}
    </div>
  );
};
