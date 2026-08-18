import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import type { TelemetryEvent } from '../../types/telemetry';
import type { PlayerEventSummary } from '../../utils/analytics';
import { aggregateEventTypes } from '../../utils/analytics';
import { SimpleChartTooltip } from '../charts/SimpleChartTooltip';
import { formatNumber, formatTimestamp, formatRelativeTime } from '../../utils/formatters';

interface PlayerActivityViewProps {
  playerSummaries: PlayerEventSummary[];
  allEvents: TelemetryEvent[];
  selectedPlayerId: string;
  onSelectPlayer: (playerId: string) => void;
}

export const PlayerActivityView: React.FC<PlayerActivityViewProps> = ({
  playerSummaries,
  allEvents,
  selectedPlayerId,
  onSelectPlayer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSummaries = useMemo(() => {
    if (!searchTerm.trim()) return playerSummaries;
    const q = searchTerm.toLowerCase();
    return playerSummaries.filter(
      p => p.playerId.toLowerCase().includes(q) || p.displayId.toLowerCase().includes(q)
    );
  }, [playerSummaries, searchTerm]);

  const activePlayer = useMemo(() => {
    if (!selectedPlayerId) {
      return playerSummaries[0] || null;
    }
    return playerSummaries.find(p => p.playerId === selectedPlayerId) || playerSummaries[0] || null;
  }, [playerSummaries, selectedPlayerId]);

  const activePlayerEvents = useMemo(() => {
    if (!activePlayer) return [];
    return allEvents.filter(e => (e.player_id || 'anonymous') === activePlayer.playerId);
  }, [allEvents, activePlayer]);

  const activePlayerStats = useMemo(() => {
    return aggregateEventTypes(activePlayerEvents);
  }, [activePlayerEvents]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Player Activity Drill-Down</h1>
          <div className="page-subtitle">
            Individual player event histories and action distributions
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left: Player Directory Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Players ({playerSummaries.length})</div>
            <input
              type="text"
              className="input-text"
              placeholder="Search player ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '150px' }}
            />
          </div>
          <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Player ID</th>
                  <th>Total Events</th>
                  <th>Top Action</th>
                  <th style={{ textAlign: 'right' }}>Select</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      No players found.
                    </td>
                  </tr>
                ) : (
                  filteredSummaries.map((p) => {
                    const isSelected = activePlayer?.playerId === p.playerId;
                    return (
                      <tr 
                        key={p.playerId}
                        style={{ backgroundColor: isSelected ? 'var(--bg-active)' : undefined }}
                      >
                        <td>
                          <span className="mono" style={{ fontWeight: 600 }}>
                            {p.displayId}
                          </span>
                        </td>
                        <td className="mono">{formatNumber(p.totalEvents)}</td>
                        <td>
                          <span className="lozenge lozenge-gray mono" style={{ fontSize: '0.7rem' }}>
                            {p.topEventType}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => onSelectPlayer(p.playerId)}
                          >
                            {isSelected ? 'Viewing' : 'Inspect'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Selected Player Detail */}
        {activePlayer ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Player Info Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  Player: <span className="mono" style={{ color: 'var(--color-blue-text)' }}>{activePlayer.displayId}</span>
                </div>
                <span className="lozenge lozenge-blue mono">{activePlayer.totalEvents} events</span>
              </div>
              <div className="card-body" style={{ padding: '0.85rem 1.15rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>First Seen: </span>
                    <strong className="mono">{formatTimestamp(activePlayer.firstSeen)}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Last Active: </span>
                    <strong className="mono">{formatRelativeTime(activePlayer.lastSeen)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Distribution Bar Chart */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Action Breakdown for {activePlayer.displayId}</div>
              </div>
              <div className="card-body">
                <div style={{ width: '100%', height: Math.max(180, activePlayerStats.length * 28) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activePlayerStats}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ebecf0" horizontal={false} />
                      <XAxis type="number" stroke="#5e6c84" fontSize={11} />
                      <YAxis type="category" dataKey="eventType" stroke="#172b4d" fontSize={11} tickLine={false} width={80} />
                      <Tooltip content={<SimpleChartTooltip />} />
                      <Bar dataKey="count" fill="#0052cc" radius={[0, 2, 2, 0]} barSize={16} name="Occurrences" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Chronological Event History */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Action History Log</div>
              </div>
              <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Timestamp (UTC)</th>
                      <th>Event Type</th>
                      <th>Time Ago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePlayerEvents.map((ev, i) => (
                      <tr key={i}>
                        <td className="mono" style={{ fontSize: '0.78rem' }}>{formatTimestamp(ev.timestamp)}</td>
                        <td><span className="lozenge lozenge-blue mono">{ev.event_type}</span></td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{formatRelativeTime(ev.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Select a player to view drilldown analytics.
          </div>
        )}
      </div>
    </div>
  );
};
