import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import type { EventTypeStat } from '../../utils/analytics';
import { SimpleChartTooltip } from '../charts/SimpleChartTooltip';
import { formatNumber, formatPercent, formatTimestamp, formatRelativeTime } from '../../utils/formatters';

interface EventFrequencyViewProps {
  eventStats: EventTypeStat[];
  totalEvents: number;
  onFilterType: (type: string) => void;
}

export const EventFrequencyView: React.FC<EventFrequencyViewProps> = ({
  eventStats,
  totalEvents,
  onFilterType,
}) => {
  const [metricMode, setMetricMode] = useState<'count' | 'percent'>('count');
  const [sortBy, setSortBy] = useState<'count' | 'name' | 'players'>('count');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const sorted = [...eventStats].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'count') comp = a.count - b.count;
    else if (sortBy === 'name') comp = a.eventType.localeCompare(b.eventType);
    else if (sortBy === 'players') comp = a.uniquePlayers - b.uniquePlayers;
    return sortOrder === 'desc' ? -comp : comp;
  });

  const chartData = sorted.map(s => ({
    name: s.eventType,
    count: s.count,
    percent: Number((s.percentage * 100).toFixed(1)),
    uniquePlayers: s.uniquePlayers,
  }));

  const toggleSort = (col: 'count' | 'name' | 'players') => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const topEvent = eventStats.length > 0 ? eventStats[0] : null;

  return (
    <div>
      {/* Page Title */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Event Type Frequency</h1>
          <div className="page-subtitle">
            Count and distribution of all telemetry actions logged across {formatNumber(totalEvents)} raw events
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-label">Total Events Logged</div>
          <div className="metric-value">{formatNumber(totalEvents)}</div>
          <div className="metric-subtext">From GET /stats</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Distinct Event Types</div>
          <div className="metric-value">{eventStats.length}</div>
          <div className="metric-subtext">Unique action keys</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Top Event Type</div>
          <div className="metric-value" style={{ fontSize: '1.2rem', color: 'var(--color-blue-text)' }}>
            {topEvent ? topEvent.eventType : '—'}
          </div>
          <div className="metric-subtext">
            {topEvent ? `${formatNumber(topEvent.count)} occurrences (${formatPercent(topEvent.percentage)})` : 'No data'}
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Frequency Distribution</div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              className={`btn btn-sm ${metricMode === 'count' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMetricMode('count')}
            >
              Raw Count
            </button>
            <button
              className={`btn btn-sm ${metricMode === 'percent' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMetricMode('percent')}
            >
              Percentage (%)
            </button>
          </div>
        </div>
        <div className="card-body">
          <div style={{ width: '100%', height: Math.max(300, chartData.length * 32) }}>
            {chartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No events match the current filter.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ebecf0" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#5e6c84"
                    fontSize={11}
                    tickFormatter={(val) => metricMode === 'percent' ? `${val}%` : formatNumber(val)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#172b4d"
                    fontSize={12}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    content={
                      <SimpleChartTooltip
                        formatter={(val) => metricMode === 'percent' ? `${val}%` : formatNumber(Number(val))}
                      />
                    }
                  />
                  <Bar
                    dataKey={metricMode === 'percent' ? 'percent' : 'count'}
                    name={metricMode === 'percent' ? 'Percentage' : 'Occurrences'}
                    fill="#0052cc"
                    radius={[0, 2, 2, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Granular Breakdown Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Event Types Breakdown Table</div>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>
                  Event Type {sortBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('count')}>
                  Occurrences {sortBy === 'count' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>Share (%)</th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('players')}>
                  Unique Players {sortBy === 'players' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>First Seen</th>
                <th>Last Seen</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No events found.
                  </td>
                </tr>
              ) : (
                sorted.map((item) => (
                  <tr key={item.eventType}>
                    <td>
                      <span className="lozenge lozenge-blue mono">
                        {item.eventType}
                      </span>
                    </td>
                    <td className="mono" style={{ fontWeight: 600 }}>
                      {formatNumber(item.count)}
                    </td>
                    <td className="mono">
                      {formatPercent(item.percentage)}
                    </td>
                    <td className="mono">
                      {item.uniquePlayers}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                      {formatTimestamp(item.firstSeen)}
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>
                      {formatRelativeTime(item.lastSeen)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onFilterType(item.eventType)}
                        title="Filter for only this event"
                      >
                        Filter
                      </button>
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
