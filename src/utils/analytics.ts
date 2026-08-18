import type { TelemetryEvent, MapAttempt, EventFilterState, MapFilterState } from '../types/telemetry';

export interface EventTypeStat {
  eventType: string;
  count: number;
  percentage: number;
  uniquePlayers: number;
  firstSeen: string;
  lastSeen: string;
}

export interface PlayerEventSummary {
  playerId: string;
  displayId: string;
  totalEvents: number;
  firstSeen: string;
  lastSeen: string;
  topEventType: string;
  topEventCount: number;
}

export interface TimelineDataPoint {
  date: string;
  formattedDate: string;
  totalEvents: number;
  uniquePlayers: number;
  [eventTypeKey: string]: number | string;
}

export interface VoxPopuliDayOption {
  key: string;
  displayLabel: string;
  isGameDay: boolean;
  dayNumber?: number;
  count: number;
}

export interface DailyActivitySplit {
  dayKey: string;
  displayTitle: string;
  isGameDay: boolean;
  totalActions: number;
  uniquePlayers: number;
  activities: {
    eventType: string;
    count: number;
    percentage: number;
    uniquePlayers: number;
  }[];
}

export interface TowerStat {
  tower: string;
  totalDeployedCount: number;
  runsPickedCount: number;
  pickRate: number;
  avgCountPerRun: number;
  avgLevel: number;
  winCount: number;
  lossCount: number;
  winRate: number;
}

export interface MapStat {
  mapName: string;
  totalAttempts: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  avgAttemptsToComplete: number;
  avgRounds: number;
  avgDurationSec: number;
  avgRamUsed: number;
  avgCpuUsed: number;
  firstTimeTotal: number;
  firstTimePassed: number;
  firstTimePassRate: number;
  repeatTotal: number;
  repeatPassed: number;
  repeatPassRate: number;
}

/* =========================================================================
   EVENTS TELEMETRY (GET /stats)
   ========================================================================= */

export function filterEvents(events: TelemetryEvent[], filters: EventFilterState): TelemetryEvent[] {
  return events.filter(event => {
    // Date filter
    if (filters.startDate) {
      if (new Date(event.timestamp) < new Date(filters.startDate)) return false;
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(event.timestamp) > end) return false;
    }

    // Event type filter
    if (filters.selectedEventType) {
      if (event.event_type !== filters.selectedEventType) return false;
    }

    // Player ID filter
    if (filters.selectedPlayerId) {
      const pId = event.player_id || 'anonymous';
      if (pId !== filters.selectedPlayerId) return false;
    }

    // Search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      const pMatch = (event.player_id || 'anonymous').toLowerCase().includes(query);
      const eMatch = event.event_type.toLowerCase().includes(query);
      if (!pMatch && !eMatch) return false;
    }

    return true;
  });
}

export function aggregateEventTypes(events: TelemetryEvent[]): EventTypeStat[] {
  if (events.length === 0) return [];

  const map = new Map<string, { count: number; players: Set<string>; firstSeen: string; lastSeen: string }>();

  for (const ev of events) {
    const type = ev.event_type || 'unspecified';
    const player = ev.player_id || 'anonymous';
    const current = map.get(type);

    if (!current) {
      map.set(type, {
        count: 1,
        players: new Set([player]),
        firstSeen: ev.timestamp,
        lastSeen: ev.timestamp,
      });
    } else {
      current.count += 1;
      current.players.add(player);
      if (new Date(ev.timestamp) < new Date(current.firstSeen)) {
        current.firstSeen = ev.timestamp;
      }
      if (new Date(ev.timestamp) > new Date(current.lastSeen)) {
        current.lastSeen = ev.timestamp;
      }
    }
  }

  const total = events.length;
  const result: EventTypeStat[] = [];

  for (const [eventType, data] of map.entries()) {
    result.push({
      eventType,
      count: data.count,
      percentage: total > 0 ? data.count / total : 0,
      uniquePlayers: data.players.size,
      firstSeen: data.firstSeen,
      lastSeen: data.lastSeen,
    });
  }

  return result.sort((a, b) => b.count - a.count);
}

export function generateTimelineData(
  events: TelemetryEvent[],
  topEventTypes: string[] = [],
  groupBy: 'day' | 'hour' = 'day'
): TimelineDataPoint[] {
  if (events.length === 0) return [];

  const timeBuckets = new Map<string, {
    dateKey: string;
    formattedDate: string;
    total: number;
    players: Set<string>;
    typeCounts: Record<string, number>;
  }>();

  for (const ev of events) {
    const d = new Date(ev.timestamp);
    if (isNaN(d.getTime())) continue;

    let key: string;
    let formatted: string;

    if (groupBy === 'hour') {
      key = d.toISOString().slice(0, 13) + ':00:00Z';
      formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.getHours().toString().padStart(2, '0') + ':00';
    } else {
      key = d.toISOString().slice(0, 10);
      formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    const cur = timeBuckets.get(key) || {
      dateKey: key,
      formattedDate: formatted,
      total: 0,
      players: new Set(),
      typeCounts: {},
    };

    cur.total += 1;
    cur.players.add(ev.player_id || 'anonymous');
    cur.typeCounts[ev.event_type] = (cur.typeCounts[ev.event_type] || 0) + 1;

    timeBuckets.set(key, cur);
  }

  const sortedKeys = Array.from(timeBuckets.keys()).sort();

  return sortedKeys.map(k => {
    const b = timeBuckets.get(k)!;
    const point: TimelineDataPoint = {
      date: b.dateKey,
      formattedDate: b.formattedDate,
      totalEvents: b.total,
      uniquePlayers: b.players.size,
    };

    for (const t of topEventTypes) {
      point[t] = b.typeCounts[t] || 0;
    }

    return point;
  });
}

/**
 * Extracts available Vox Populi days (supports in-game Day 1, Day 2, etc. or calendar dates)
 */
export function getAvailableVoxPopuliDays(events: TelemetryEvent[]): VoxPopuliDayOption[] {
  const hasInGameDays = events.some(e => e.day !== undefined && e.day !== null);

  if (hasInGameDays) {
    // Group by in-game day
    const dayMap = new Map<string, { displayLabel: string; dayNumber?: number; count: number }>();

    for (const ev of events) {
      if (ev.day === undefined || ev.day === null) continue;
      const key = `day-${ev.day}`;
      const num = typeof ev.day === 'number' ? ev.day : parseInt(String(ev.day).replace(/\D/g, ''), 10);
      const label = typeof ev.day === 'number' || !isNaN(num) ? `Day ${num}` : `Day ${ev.day}`;
      
      const cur = dayMap.get(key) || {
        displayLabel: label,
        dayNumber: isNaN(num) ? undefined : num,
        count: 0,
      };
      cur.count += 1;
      dayMap.set(key, cur);
    }

    return Array.from(dayMap.entries())
      .map(([key, val]) => ({
        key,
        displayLabel: val.displayLabel,
        isGameDay: true,
        dayNumber: val.dayNumber,
        count: val.count,
      }))
      .sort((a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0));
  }

  // Fallback: Group by timestamp calendar date
  const dateMap = new Map<string, { displayLabel: string; count: number }>();
  for (const ev of events) {
    const d = new Date(ev.timestamp);
    if (isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    const cur = dateMap.get(key) || {
      displayLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      count: 0,
    };
    cur.count += 1;
    dateMap.set(key, cur);
  }

  return Array.from(dateMap.entries())
    .map(([key, val]) => ({
      key,
      displayLabel: val.displayLabel,
      isGameDay: false,
      count: val.count,
    }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

/**
 * Calculates the Persona-style Vox Populi activity split for a selected in-game day or calendar date
 */
export function getDailyVoxPopuli(events: TelemetryEvent[], targetDayKey?: string): DailyActivitySplit | null {
  if (events.length === 0) return null;

  const dayOptions = getAvailableVoxPopuliDays(events);
  if (dayOptions.length === 0) return null;

  const selectedOption = (targetDayKey && dayOptions.find(d => d.key === targetDayKey))
    ? dayOptions.find(d => d.key === targetDayKey)!
    : dayOptions[0];

  const filteredEvents = events.filter(e => {
    if (selectedOption.isGameDay) {
      return e.day !== undefined && `day-${e.day}` === selectedOption.key;
    }
    const d = new Date(e.timestamp);
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === selectedOption.key;
  });

  if (filteredEvents.length === 0) return null;

  const typeMap = new Map<string, { count: number; players: Set<string> }>();
  const totalPlayers = new Set<string>();

  for (const ev of filteredEvents) {
    const pId = ev.player_id || 'anonymous';
    totalPlayers.add(pId);
    const cur = typeMap.get(ev.event_type) || { count: 0, players: new Set() };
    cur.count += 1;
    cur.players.add(pId);
    typeMap.set(ev.event_type, cur);
  }

  const totalActions = filteredEvents.length;
  const activities = Array.from(typeMap.entries()).map(([eventType, data]) => ({
    eventType,
    count: data.count,
    percentage: totalActions > 0 ? data.count / totalActions : 0,
    uniquePlayers: data.players.size,
  })).sort((a, b) => b.count - a.count);

  let displayTitle = selectedOption.displayLabel;
  if (selectedOption.isGameDay) {
    displayTitle = `In-Game ${selectedOption.displayLabel}`;
  } else {
    const d = new Date(selectedOption.key + 'T12:00:00Z');
    if (!isNaN(d.getTime())) {
      displayTitle = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  }

  return {
    dayKey: selectedOption.key,
    displayTitle,
    isGameDay: selectedOption.isGameDay,
    totalActions,
    uniquePlayers: totalPlayers.size,
    activities,
  };
}

export function aggregatePlayerEvents(events: TelemetryEvent[]): PlayerEventSummary[] {
  const playerMap = new Map<string, {
    totalEvents: number;
    firstSeen: string;
    lastSeen: string;
    eventCounts: Record<string, number>;
  }>();

  for (const ev of events) {
    const rawId = ev.player_id || '';
    const key = rawId || 'anonymous';
    const cur = playerMap.get(key) || {
      totalEvents: 0,
      firstSeen: ev.timestamp,
      lastSeen: ev.timestamp,
      eventCounts: {},
    };

    cur.totalEvents += 1;
    cur.eventCounts[ev.event_type] = (cur.eventCounts[ev.event_type] || 0) + 1;

    if (new Date(ev.timestamp) < new Date(cur.firstSeen)) cur.firstSeen = ev.timestamp;
    if (new Date(ev.timestamp) > new Date(cur.lastSeen)) cur.lastSeen = ev.timestamp;

    playerMap.set(key, cur);
  }

  const summaries: PlayerEventSummary[] = [];

  for (const [playerId, d] of playerMap.entries()) {
    let topEv = 'none';
    let topCount = 0;
    for (const [evName, c] of Object.entries(d.eventCounts)) {
      if (c > topCount) {
        topCount = c;
        topEv = evName;
      }
    }

    summaries.push({
      playerId,
      displayId: playerId === 'anonymous' ? 'Anonymous / Unset' : playerId,
      totalEvents: d.totalEvents,
      firstSeen: d.firstSeen,
      lastSeen: d.lastSeen,
      topEventType: topEv,
      topEventCount: topCount,
    });
  }

  return summaries.sort((a, b) => b.totalEvents - a.totalEvents);
}

/* =========================================================================
   MAP ATTEMPTS TELEMETRY (GET /map-attempts)
   ========================================================================= */

export function filterMapAttempts(attempts: MapAttempt[], filters: MapFilterState): MapAttempt[] {
  return attempts.filter(attempt => {
    if (filters.startDate) {
      if (new Date(attempt.timestamp) < new Date(filters.startDate)) return false;
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(attempt.timestamp) > end) return false;
    }
    if (filters.selectedMap) {
      if (attempt.map_name !== filters.selectedMap) return false;
    }
    if (filters.selectedPlayerId) {
      const pId = attempt.player_id || 'anonymous';
      if (pId !== filters.selectedPlayerId) return false;
    }
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      const pMatch = (attempt.player_id || 'anonymous').toLowerCase().includes(query);
      const mMap = attempt.map_name.toLowerCase().includes(query);
      const tMap = (attempt.towers || []).some(t => t.tower.toLowerCase().includes(query));
      if (!pMatch && !mMap && !tMap) return false;
    }
    return true;
  });
}

export function aggregateTowers(attempts: MapAttempt[]): TowerStat[] {
  if (attempts.length === 0) return [];

  const towerMap = new Map<string, {
    totalDeployedCount: number;
    runsPickedCount: number;
    totalLevelSum: number;
    winCount: number;
    lossCount: number;
  }>();

  for (const att of attempts) {
    if (!att.towers || !Array.isArray(att.towers)) continue;

    for (const t of att.towers) {
      if (!t || !t.tower) continue;
      const key = t.tower.trim();
      const current = towerMap.get(key) || {
        totalDeployedCount: 0,
        runsPickedCount: 0,
        totalLevelSum: 0,
        winCount: 0,
        lossCount: 0,
      };

      current.totalDeployedCount += t.count || 1;
      current.runsPickedCount += 1;
      current.totalLevelSum += (t.level || 1) * (t.count || 1);
      if (att.passed) {
        current.winCount += 1;
      } else {
        current.lossCount += 1;
      }

      towerMap.set(key, current);
    }
  }

  const totalRuns = attempts.length;
  const result: TowerStat[] = [];

  for (const [tower, data] of towerMap.entries()) {
    result.push({
      tower,
      totalDeployedCount: data.totalDeployedCount,
      runsPickedCount: data.runsPickedCount,
      pickRate: totalRuns > 0 ? data.runsPickedCount / totalRuns : 0,
      avgCountPerRun: data.runsPickedCount > 0 ? data.totalDeployedCount / data.runsPickedCount : 0,
      avgLevel: data.totalDeployedCount > 0 ? data.totalLevelSum / data.totalDeployedCount : 1,
      winCount: data.winCount,
      lossCount: data.lossCount,
      winRate: data.runsPickedCount > 0 ? data.winCount / data.runsPickedCount : 0,
    });
  }

  return result.sort((a, b) => b.totalDeployedCount - a.totalDeployedCount);
}

export function aggregateMaps(attempts: MapAttempt[]): MapStat[] {
  if (attempts.length === 0) return [];

  const mapMap = new Map<string, {
    total: number;
    passed: number;
    failed: number;
    totalAttemptsFieldSum: number;
    totalRoundsSum: number;
    totalDurationNsSum: number;
    totalRamSum: number;
    totalCpuSum: number;
    firstTimeTotal: number;
    firstTimePassed: number;
    repeatTotal: number;
    repeatPassed: number;
  }>();

  for (const att of attempts) {
    const key = att.map_name || 'unnamed_map';
    const cur = mapMap.get(key) || {
      total: 0,
      passed: 0,
      failed: 0,
      totalAttemptsFieldSum: 0,
      totalRoundsSum: 0,
      totalDurationNsSum: 0,
      totalRamSum: 0,
      totalCpuSum: 0,
      firstTimeTotal: 0,
      firstTimePassed: 0,
      repeatTotal: 0,
      repeatPassed: 0,
    };

    cur.total += 1;
    if (att.passed) {
      cur.passed += 1;
    } else {
      cur.failed += 1;
    }

    cur.totalAttemptsFieldSum += att.attempts || 1;
    cur.totalRoundsSum += att.rounds || 0;
    cur.totalDurationNsSum += att.duration || 0;
    cur.totalRamSum += att.ram_used || 0;
    cur.totalCpuSum += att.cpu_used || 0;

    if (att.first_time) {
      cur.firstTimeTotal += 1;
      if (att.passed) cur.firstTimePassed += 1;
    } else {
      cur.repeatTotal += 1;
      if (att.passed) cur.repeatPassed += 1;
    }

    mapMap.set(key, cur);
  }

  const result: MapStat[] = [];

  for (const [mapName, d] of mapMap.entries()) {
    result.push({
      mapName,
      totalAttempts: d.total,
      passedCount: d.passed,
      failedCount: d.failed,
      passRate: d.total > 0 ? d.passed / d.total : 0,
      avgAttemptsToComplete: d.total > 0 ? d.totalAttemptsFieldSum / d.total : 0,
      avgRounds: d.total > 0 ? d.totalRoundsSum / d.total : 0,
      avgDurationSec: d.total > 0 ? (d.totalDurationNsSum / d.total) / 1_000_000_000 : 0,
      avgRamUsed: d.total > 0 ? d.totalRamSum / d.total : 0,
      avgCpuUsed: d.total > 0 ? d.totalCpuSum / d.total : 0,
      firstTimeTotal: d.firstTimeTotal,
      firstTimePassed: d.firstTimePassed,
      firstTimePassRate: d.firstTimeTotal > 0 ? d.firstTimePassed / d.firstTimeTotal : 0,
      repeatTotal: d.repeatTotal,
      repeatPassed: d.repeatPassed,
      repeatPassRate: d.repeatTotal > 0 ? d.repeatPassed / d.repeatTotal : 0,
    });
  }

  return result.sort((a, b) => b.totalAttempts - a.totalAttempts);
}
