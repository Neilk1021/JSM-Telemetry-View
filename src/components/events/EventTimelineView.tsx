import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import type { TelemetryEvent } from '../../types/telemetry';
import type { EventTypeStat } from '../../utils/analytics';
import { generateTimelineData } from '../../utils/analytics';
import { SimpleChartTooltip } from '../charts/SimpleChartTooltip';
import { formatNumber } from '../../utils/formatters';

interface EventTimelineViewProps {
  events: TelemetryEvent[];
  eventStats: EventTypeStat[];
}

const SERIES_COLORS = ['#0052cc', '#36b37e', '#ffab00', '#6554c0', '#ff5630'];

export const EventTimelineView: React.FC<EventTimelineViewProps> = ({
  events,
  eventStats,
}) => {
  const [groupBy, setGroupBy] = useState<'day' | 'hour'>('day');
  const [chartMode, setChartMode] = useState<'total' | 'breakdown' | 'players'>('total');

  const topEventNames = eventStats.slice(0, 4).map(s => s.eventType);
  const timelineData = generateTimelineData(events, topEventNames, groupBy);

  let peakPoint = { formattedDate: '—', totalEvents: 0 };
  let totalSum = 0;
  for (const p of timelineData) {
    totalSum += p.totalEvents;
    if (p.totalEvents > peakPoint.totalEvents) {
      peakPoint = { formattedDate: p.formattedDate, totalEvents: p.totalEvents };
    }
  }
  const avgEvents = timelineData.length > 0 ? Math.round(totalSum / timelineData.length) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Event Timeline Trends</h1>
          <div className="page-subtitle">
            Time-series distribution of player events across the playtest timeline
          </div>
        </div>
      </div>

      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-label">Peak Activity Period</div>
          <div className="metric-value" style={{ fontSize: '1.2rem' }}>{peakPoint.formattedDate}</div>
          <div className="metric-subtext">{peakPoint.totalEvents} events recorded</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Average Per {groupBy === 'day' ? 'Day' : 'Hour'}</div>
          <div className="metric-value">{formatNumber(avgEvents)}</div>
          <div className="metric-subtext">Across {timelineData.length} time buckets</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Time Buckets</div>
          <div className="metric-value">{timelineData.length}</div>
          <div className="metric-subtext">Grouped by {groupBy}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Activity Graph</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.2rem' }}>
              <button
                className={`btn btn-sm ${chartMode === 'total' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setChartMode('total')}
              >
                Total Volume
              </button>
              <button
                className={`btn btn-sm ${chartMode === 'breakdown' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setChartMode('breakdown')}
              >
                By Event Type
              </button>
              <button
                className={`btn btn-sm ${chartMode === 'players' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setChartMode('players')}
              >
                Active Players
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.2rem' }}>
              <button
                className={`btn btn-sm ${groupBy === 'day' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setGroupBy('day')}
              >
                Daily
              </button>
              <button
                className={`btn btn-sm ${groupBy === 'hour' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setGroupBy('hour')}
              >
                Hourly
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div style={{ width: '100%', height: 350 }}>
            {timelineData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No events found in this date range.
              </div>
            ) : chartMode === 'total' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ebecf0" />
                  <XAxis dataKey="formattedDate" stroke="#5e6c84" fontSize={11} />
                  <YAxis stroke="#5e6c84" fontSize={11} />
                  <Tooltip content={<SimpleChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="totalEvents"
                    name="Events Logged"
                    stroke="#0052cc"
                    fill="#deebff"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : chartMode === 'breakdown' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ebecf0" />
                  <XAxis dataKey="formattedDate" stroke="#5e6c84" fontSize={11} />
                  <YAxis stroke="#5e6c84" fontSize={11} />
                  <Tooltip content={<SimpleChartTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  {topEventNames.map((name, idx) => (
                    <Area
                      key={name}
                      type="monotone"
                      dataKey={name}
                      name={name}
                      stackId="1"
                      stroke={SERIES_COLORS[idx % SERIES_COLORS.length]}
                      fill={SERIES_COLORS[idx % SERIES_COLORS.length]}
                      fillOpacity={0.5}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ebecf0" />
                  <XAxis dataKey="formattedDate" stroke="#5e6c84" fontSize={11} />
                  <YAxis stroke="#5e6c84" fontSize={11} />
                  <Tooltip content={<SimpleChartTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    type="monotone"
                    dataKey="uniquePlayers"
                    name="Unique Active Players"
                    stroke="#36b37e"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Timeline Records Table</div>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Total Events</th>
                <th>Unique Players</th>
              </tr>
            </thead>
            <tbody>
              {timelineData.map((d) => (
                <tr key={d.date}>
                  <td className="mono">{d.formattedDate}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>{formatNumber(d.totalEvents)}</td>
                  <td className="mono">{d.uniquePlayers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
