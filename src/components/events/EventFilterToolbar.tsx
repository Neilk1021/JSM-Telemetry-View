import React from 'react';
import { Search, X } from 'lucide-react';
import type { EventFilterState } from '../../types/telemetry';

interface EventFilterToolbarProps {
  filters: EventFilterState;
  onChange: (updated: Partial<EventFilterState>) => void;
  onReset: () => void;
  availableEventTypes: string[];
  availablePlayers: string[];
  totalFiltered: number;
  totalUnfiltered: number;
}

export const EventFilterToolbar: React.FC<EventFilterToolbarProps> = ({
  filters,
  onChange,
  onReset,
  availableEventTypes,
  availablePlayers,
  totalFiltered,
  totalUnfiltered,
}) => {
  const isFiltered = Boolean(
    filters.searchQuery ||
    filters.startDate ||
    filters.endDate ||
    filters.selectedEventType ||
    filters.selectedPlayerId
  );

  const applyPreset = (days: number | null) => {
    if (days === null) {
      onChange({ startDate: null, endDate: null });
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    onChange({
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    });
  };

  return (
    <div className="toolbar">
      <div className="toolbar-controls">
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={13} style={{ position: 'absolute', left: '8px', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="input-text"
            style={{ paddingLeft: '26px', width: '180px' }}
            placeholder="Search events..."
            value={filters.searchQuery}
            onChange={(e) => onChange({ searchQuery: e.target.value })}
          />
        </div>

        {/* Event Type Filter */}
        <select
          className="input-select"
          value={filters.selectedEventType}
          onChange={(e) => onChange({ selectedEventType: e.target.value })}
        >
          <option value="">All Event Types ({availableEventTypes.length})</option>
          {availableEventTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Player Filter */}
        <select
          className="input-select"
          value={filters.selectedPlayerId}
          onChange={(e) => onChange({ selectedPlayerId: e.target.value })}
        >
          <option value="">All Players ({availablePlayers.length})</option>
          {availablePlayers.map((p) => (
            <option key={p} value={p}>
              {p === 'anonymous' ? 'anonymous / unset' : p}
            </option>
          ))}
        </select>

        {/* Date Inputs */}
        <input
          type="date"
          className="input-date"
          value={filters.startDate || ''}
          onChange={(e) => onChange({ startDate: e.target.value || null })}
          title="From date"
        />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>to</span>
        <input
          type="date"
          className="input-date"
          value={filters.endDate || ''}
          onChange={(e) => onChange({ endDate: e.target.value || null })}
          title="To date"
        />

        {/* Presets */}
        <div style={{ display: 'flex', gap: '0.2rem' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyPreset(null)}>All</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyPreset(1)}>24h</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyPreset(7)}>7d</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyPreset(30)}>30d</button>
        </div>
      </div>

      {/* Results Count & Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{totalFiltered}</strong> of {totalUnfiltered}
        </span>
        {isFiltered && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onReset}>
            <X size={12} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
