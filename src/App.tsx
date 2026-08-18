import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { 
  TelemetryEvent, 
  MapAttempt, 
  ApiConfig, 
  EndpointStatus, 
  EventFilterState, 
  NavView 
} from './types/telemetry';
import { 
  getStoredConfig, 
  saveStoredConfig, 
  fetchStats, 
  fetchMapAttempts 
} from './services/api';
import { 
  filterEvents, 
  aggregateEventTypes, 
  aggregatePlayerEvents 
} from './utils/analytics';
import { exportToCsv } from './utils/formatters';

// Layout
import { AppNavbar } from './components/layout/AppNavbar';
import { AppSidebar } from './components/layout/AppSidebar';

// Event Views
import { EventFilterToolbar } from './components/events/EventFilterToolbar';
import { EventFrequencyView } from './components/events/EventFrequencyView';
import { VoxPopuliView } from './components/events/VoxPopuliView';
import { EventTimelineView } from './components/events/EventTimelineView';
import { PlayerActivityView } from './components/events/PlayerActivityView';
import { RawEventsLogView } from './components/events/RawEventsLogView';

// Map Views
import { MapOverviewView } from './components/maps/MapOverviewView';
import { TowerPopularityView } from './components/maps/TowerPopularityView';
import { MapRawRunsView } from './components/maps/MapRawRunsView';

// Settings View
import { SettingsView } from './components/settings/SettingsView';

export const App: React.FC = () => {
  const [config, setConfig] = useState<ApiConfig>(getStoredConfig);
  const [currentView, setCurrentView] = useState<NavView>('events-frequency');
  const [isLoading, setIsLoading] = useState(true);

  // Raw data from endpoints (strictly separate)
  const [rawEvents, setRawEvents] = useState<TelemetryEvent[]>([]);
  const [rawMapAttempts, setRawMapAttempts] = useState<MapAttempt[]>([]);

  // Endpoint connection status
  const [status, setStatus] = useState<EndpointStatus>({
    statsLive: false,
    statsCount: 0,
    mapAttemptsLive: false,
    mapAttemptsCount: 0,
    lastChecked: null,
  });

  // Event filtering state
  const [eventFilters, setEventFilters] = useState<EventFilterState>({
    startDate: null,
    endDate: null,
    selectedEventType: '',
    selectedPlayerId: '',
    searchQuery: '',
  });

  // Fetch real data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const statsRes = await fetchStats(config);
      setRawEvents(statsRes.events);

      const mapRes = await fetchMapAttempts(config);
      setRawMapAttempts(mapRes.attempts);

      setStatus({
        statsLive: !statsRes.error,
        statsError: statsRes.error || undefined,
        statsCount: statsRes.events.length,
        mapAttemptsLive: mapRes.isLive,
        mapAttemptsError: mapRes.error || undefined,
        mapAttemptsCount: mapRes.attempts.length,
        lastChecked: new Date(),
      });
    } catch (err) {
      console.error('Error fetching telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh interval
  useEffect(() => {
    if (config.autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      loadData();
    }, config.autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [config.autoRefreshInterval, loadData]);

  const handleSaveConfig = (newConfig: Partial<ApiConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    saveStoredConfig(updated);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return filterEvents(rawEvents, eventFilters);
  }, [rawEvents, eventFilters]);

  // Aggregated Event Stats
  const eventStats = useMemo(() => {
    return aggregateEventTypes(filteredEvents);
  }, [filteredEvents]);

  const playerSummaries = useMemo(() => {
    return aggregatePlayerEvents(filteredEvents);
  }, [filteredEvents]);

  // Dropdown options
  const availableEventTypes = useMemo(() => {
    return Array.from(new Set(rawEvents.map(e => e.event_type).filter(Boolean))).sort();
  }, [rawEvents]);

  const availablePlayers = useMemo(() => {
    const ids = new Set<string>();
    rawEvents.forEach(e => ids.add(e.player_id || 'anonymous'));
    return Array.from(ids).sort();
  }, [rawEvents]);

  // Quick navigation / filter handlers
  const handleFilterType = (type: string) => {
    setEventFilters(prev => ({ ...prev, selectedEventType: type }));
  };

  const handleSelectPlayer = (playerId: string) => {
    setEventFilters(prev => ({ ...prev, selectedPlayerId: playerId }));
    setCurrentView('events-players');
  };

  const handleResetFilters = () => {
    setEventFilters({
      startDate: null,
      endDate: null,
      selectedEventType: '',
      selectedPlayerId: '',
      searchQuery: '',
    });
  };

  const handleExportCsv = () => {
    const ts = new Date().toISOString().slice(0, 10);
    exportToCsv(`jsm_telemetry_events_${ts}`, filteredEvents as unknown as Record<string, unknown>[]);
  };

  // Show general event filter toolbar for frequency, timeline, and raw logs (Vox Populi has its own day selector)
  const isFilterableEventView = currentView === 'events-frequency' || currentView === 'events-timeline' || currentView === 'events-raw';

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <AppNavbar
        config={config}
        status={status}
        isLoading={isLoading}
        onRefresh={loadData}
        onOpenSettings={() => setCurrentView('settings')}
        onAutoRefreshChange={(seconds) => handleSaveConfig({ autoRefreshInterval: seconds })}
        onExportCsv={handleExportCsv}
      />

      {/* Main Shell */}
      <div className="main-shell">
        {/* Left Navigation Sidebar */}
        <AppSidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          counts={{
            eventTypesCount: eventStats.length,
            eventPlayersCount: playerSummaries.length,
            rawEventsCount: rawEvents.length,
            mapAttemptsCount: rawMapAttempts.length,
          }}
        />

        {/* Content Area */}
        <main className="content-area">
          {/* Global Events Filter Toolbar */}
          {isFilterableEventView && (
            <EventFilterToolbar
              filters={eventFilters}
              onChange={(upd) => setEventFilters(prev => ({ ...prev, ...upd }))}
              onReset={handleResetFilters}
              availableEventTypes={availableEventTypes}
              availablePlayers={availablePlayers}
              totalFiltered={filteredEvents.length}
              totalUnfiltered={rawEvents.length}
            />
          )}

          {/* EVENTS TELEMETRY VIEWS */}
          {currentView === 'events-frequency' && (
            <EventFrequencyView
              eventStats={eventStats}
              totalEvents={filteredEvents.length}
              onFilterType={handleFilterType}
            />
          )}

          {currentView === 'events-vox-populi' && (
            <VoxPopuliView
              events={rawEvents}
            />
          )}

          {currentView === 'events-timeline' && (
            <EventTimelineView
              events={filteredEvents}
              eventStats={eventStats}
            />
          )}

          {currentView === 'events-players' && (
            <PlayerActivityView
              playerSummaries={playerSummaries}
              allEvents={rawEvents}
              selectedPlayerId={eventFilters.selectedPlayerId}
              onSelectPlayer={(pId) => setEventFilters(prev => ({ ...prev, selectedPlayerId: pId }))}
            />
          )}

          {currentView === 'events-raw' && (
            <RawEventsLogView
              events={filteredEvents}
              onSelectPlayer={handleSelectPlayer}
            />
          )}

          {/* MAP ATTEMPTS TELEMETRY VIEWS */}
          {currentView === 'maps-overview' && (
            <MapOverviewView
              mapAttempts={rawMapAttempts}
              status={status}
            />
          )}

          {currentView === 'maps-towers' && (
            <TowerPopularityView
              mapAttempts={rawMapAttempts}
              status={status}
            />
          )}

          {currentView === 'maps-raw' && (
            <MapRawRunsView
              mapAttempts={rawMapAttempts}
              status={status}
            />
          )}

          {/* SETTINGS VIEW */}
          {currentView === 'settings' && (
            <SettingsView
              config={config}
              onSave={handleSaveConfig}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
