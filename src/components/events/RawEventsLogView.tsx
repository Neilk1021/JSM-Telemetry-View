import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Eye, 
  X,
  Code
} from 'lucide-react';
import type { TelemetryEvent } from '../../types/telemetry';
import { formatTimestamp, formatRelativeTime, exportToCsv, exportToJson } from '../../utils/formatters';

interface RawEventsLogViewProps {
  events: TelemetryEvent[];
  onSelectPlayer: (playerId: string) => void;
}

export const RawEventsLogView: React.FC<RawEventsLogViewProps> = ({
  events,
  onSelectPlayer,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [inspectedEvent, setInspectedEvent] = useState<TelemetryEvent | null>(null);

  const sortedEvents = [...events].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const totalPages = Math.max(1, Math.ceil(sortedEvents.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pageEvents = sortedEvents.slice(startIndex, startIndex + pageSize);

  const handleExportCsv = () => {
    exportToCsv('jsm_telemetry_events', sortedEvents as unknown as Record<string, unknown>[]);
  };

  const handleExportJson = () => {
    exportToJson('jsm_telemetry_events', sortedEvents);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Raw Telemetry Events Stream</h1>
          <div className="page-subtitle">
            All raw JSON rows fetched from <code>GET /stats</code>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCsv}>
            <Download size={13} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportJson}>
            <Download size={13} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Events Table ({sortedEvents.length})</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span>Order:</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            >
              {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th style={{ width: '220px' }}>Timestamp (UTC)</th>
                <th>Time Ago</th>
                <th>Player ID</th>
                <th>Event Type</th>
                <th style={{ textAlign: 'right', width: '80px' }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {pageEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No events found.
                  </td>
                </tr>
              ) : (
                pageEvents.map((ev, idx) => {
                  const num = startIndex + idx + 1;
                  return (
                    <tr key={num}>
                      <td className="mono" style={{ color: 'var(--text-secondary)' }}>{num}</td>
                      <td className="mono" style={{ fontSize: '0.78rem' }}>{formatTimestamp(ev.timestamp)}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{formatRelativeTime(ev.timestamp)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm mono"
                          style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem' }}
                          onClick={() => onSelectPlayer(ev.player_id || 'anonymous')}
                          title="Drilldown into this player"
                        >
                          {ev.player_id || 'anonymous / unset'}
                        </button>
                      </td>
                      <td>
                        <span className="lozenge lozenge-blue mono">{ev.event_type}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => setInspectedEvent(ev)}
                          title="Inspect raw event JSON"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.15rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span>Rows:</span>
            <select
              className="input-select"
              style={{ padding: '0.2rem 0.4rem', fontSize: '0.76rem' }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              Showing {sortedEvents.length > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, sortedEvents.length)} of {sortedEvents.length}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={13} />
              <span>Prev</span>
            </button>
            <span className="mono" style={{ fontSize: '0.78rem', padding: '0 0.3rem' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* JSON Inspector Modal */}
      {inspectedEvent && (
        <div className="modal-overlay" onClick={() => setInspectedEvent(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Code size={16} style={{ color: 'var(--color-blue-primary)' }} />
                <span style={{ fontWeight: 600 }}>Raw Event JSON Payload</span>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setInspectedEvent(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="modal-body">
              <pre style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-xs)',
                padding: '0.85rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--text-primary)',
                overflowX: 'auto',
              }}>
                {JSON.stringify(inspectedEvent, null, 2)}
              </pre>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setInspectedEvent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
