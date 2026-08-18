import React, { useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  PieChart as PieIcon,
  Gamepad2
} from 'lucide-react';
import type { TelemetryEvent } from '../../types/telemetry';
import { getAvailableVoxPopuliDays, getDailyVoxPopuli } from '../../utils/analytics';
import { SimpleChartTooltip } from '../charts/SimpleChartTooltip';
import { formatNumber, formatPercent } from '../../utils/formatters';

interface VoxPopuliViewProps {
  events: TelemetryEvent[];
}

const PALETTE = [
  '#0052cc', // Primary blue
  '#36b37e', // Green
  '#ffab00', // Amber
  '#6554c0', // Purple
  '#ff5630', // Red
  '#00b8d9', // Cyan
  '#4c9aff', // Light blue
  '#57d9a3', // Mint
  '#ff8b00', // Orange
  '#8777d9', // Lavender
];

export const VoxPopuliView: React.FC<VoxPopuliViewProps> = ({ events }) => {
  const dayOptions = getAvailableVoxPopuliDays(events);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(
    dayOptions[0]?.key || ''
  );

  const activeIndex = dayOptions.findIndex(d => d.key === selectedDayKey);
  const dailyData = getDailyVoxPopuli(events, selectedDayKey);

  const handlePrevDay = () => {
    if (activeIndex > 0) {
      setSelectedDayKey(dayOptions[activeIndex - 1].key);
    }
  };

  const handleNextDay = () => {
    if (activeIndex < dayOptions.length - 1 && activeIndex !== -1) {
      setSelectedDayKey(dayOptions[activeIndex + 1].key);
    }
  };

  const chartData = (dailyData?.activities || []).map(a => ({
    name: a.eventType,
    value: a.count,
    percentage: Number((a.percentage * 100).toFixed(1)),
    uniquePlayers: a.uniquePlayers,
  }));

  const topActivity = dailyData?.activities[0] || null;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieIcon size={20} style={{ color: 'var(--color-blue-primary)' }} />
            <span>Vox Populi (Voice of the People)</span>
          </h1>
          <div className="page-subtitle">
            What players did on any given in-game day (Persona-style activity split)
          </div>
        </div>
      </div>

      {/* Date / Game Day Selector Toolbar */}
      <div className="toolbar">
        <div className="toolbar-controls">
          {dailyData?.isGameDay ? (
            <Gamepad2 size={15} style={{ color: 'var(--color-blue-primary)' }} />
          ) : (
            <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
          )}
          
          <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>
            {dailyData?.isGameDay ? 'In-Game Day:' : 'Select Day:'}
          </span>

          {/* Quick Dropdown of Days */}
          <select
            className="input-select"
            style={{ fontWeight: 600 }}
            value={selectedDayKey}
            onChange={(e) => setSelectedDayKey(e.target.value)}
          >
            {dayOptions.map((d) => (
              <option key={d.key} value={d.key}>
                {d.displayLabel} ({d.count} actions)
              </option>
            ))}
          </select>

          {/* Previous / Next Day Steppers */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrevDay}
              disabled={activeIndex <= 0}
              title="Previous Day"
            >
              <ChevronLeft size={13} />
              <span>Previous Day</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleNextDay}
              disabled={activeIndex >= dayOptions.length - 1 || activeIndex === -1}
              title="Next Day"
            >
              <span>Next Day</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          {dailyData?.isGameDay ? (
            <span className="lozenge lozenge-blue">In-Game Day Mode</span>
          ) : (
            <span className="lozenge lozenge-gray" title="Events currently use timestamp date until in-game day field is populated by backend">
              Timestamp Date Mode
            </span>
          )}
        </span>
      </div>

      {dailyData ? (
        <>
          {/* Daily KPI Metric Cards */}
          <div className="metrics-row">
            <div className="metric-card">
              <div className="metric-label">Selected Day</div>
              <div className="metric-value" style={{ fontSize: '1.25rem', color: 'var(--color-blue-text)' }}>
                {dailyData.displayTitle}
              </div>
              <div className="metric-subtext">
                {dailyData.isGameDay ? 'Roguelike in-game day' : 'Calendar timestamp'}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Total Actions Taken</div>
              <div className="metric-value">{formatNumber(dailyData.totalActions)}</div>
              <div className="metric-subtext">Across {dailyData.activities.length} distinct actions</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Active Players</div>
              <div className="metric-value">{dailyData.uniquePlayers}</div>
              <div className="metric-subtext">Participated on this day</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Top Choice of the Day</div>
              <div className="metric-value" style={{ fontSize: '1.15rem', color: 'var(--color-green-text)' }}>
                {topActivity ? topActivity.eventType : '—'}
              </div>
              <div className="metric-subtext">
                {topActivity ? `${formatPercent(topActivity.percentage)} of players (${topActivity.count} times)` : 'No actions'}
              </div>
            </div>
          </div>

          {/* Vox Populi Donut & Action Split Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
            {/* Donut Chart Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Activity Split (Donut Chart)</div>
                <span className="lozenge lozenge-blue mono">{dailyData.totalActions} actions</span>
              </div>
              <div className="card-body">
                <div style={{ width: '100%', height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={3}
                      >
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={
                          <SimpleChartTooltip
                            formatter={(val) => {
                              const total = dailyData.totalActions;
                              const pct = total > 0 ? ((Number(val) / total) * 100).toFixed(1) : '0';
                              return `${formatNumber(Number(val))} actions (${pct}%)`;
                            }}
                          />
                        }
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Activities Table Breakdown */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">What Players Did on {dailyData.displayTitle}</div>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Activity / Action</th>
                      <th>Percentage Split</th>
                      <th>Occurrences</th>
                      <th>Players</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.activities.map((act, idx) => (
                      <tr key={act.eventType}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span 
                              style={{ 
                                width: 10, 
                                height: 10, 
                                borderRadius: '2px', 
                                backgroundColor: PALETTE[idx % PALETTE.length],
                                display: 'inline-block' 
                              }} 
                            />
                            <span className="mono" style={{ fontWeight: 600 }}>
                              {act.eventType}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 80, height: 6, background: 'var(--bg-subtle)', borderRadius: 2, overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${act.percentage * 100}%`,
                                  height: '100%',
                                  backgroundColor: PALETTE[idx % PALETTE.length],
                                }}
                              />
                            </div>
                            <span className="mono" style={{ fontWeight: 600, fontSize: '0.78rem' }}>
                              {formatPercent(act.percentage)}
                            </span>
                          </div>
                        </td>
                        <td className="mono">{formatNumber(act.count)}</td>
                        <td className="mono">{act.uniquePlayers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No telemetry events recorded for this day.
        </div>
      )}
    </div>
  );
};
