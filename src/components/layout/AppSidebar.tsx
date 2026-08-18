import React from 'react';
import { 
  BarChart2, 
  PieChart as PieIcon,
  TrendingUp, 
  Users, 
  Table, 
  ShieldCheck, 
  Layers, 
  Settings,
  ListFilter
} from 'lucide-react';
import type { NavView } from '../../types/telemetry';

export interface MenuItem {
  id: NavView;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface AppSidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  counts: {
    eventTypesCount: number;
    eventPlayersCount: number;
    rawEventsCount: number;
    mapAttemptsCount: number;
  };
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentView,
  onSelectView,
  counts,
}) => {
  const sections: MenuSection[] = [
    {
      title: 'Events Telemetry (/stats)',
      items: [
        {
          id: 'events-frequency',
          label: 'Event Frequency',
          icon: <BarChart2 size={16} />,
          count: counts.eventTypesCount,
        },
        {
          id: 'events-vox-populi',
          label: 'Vox Populi (Daily Split)',
          icon: <PieIcon size={16} />,
        },
        {
          id: 'events-timeline',
          label: 'Timeline Trends',
          icon: <TrendingUp size={16} />,
        },
        {
          id: 'events-players',
          label: 'Player Activity',
          icon: <Users size={16} />,
          count: counts.eventPlayersCount,
        },
        {
          id: 'events-raw',
          label: 'Raw Events Log',
          icon: <Table size={16} />,
          count: counts.rawEventsCount,
        },
      ],
    },
    {
      title: 'Map Telemetry (/map-attempts)',
      items: [
        {
          id: 'maps-overview',
          label: 'Pass / Fail Rates',
          icon: <ShieldCheck size={16} />,
        },
        {
          id: 'maps-towers',
          label: 'Tower Popularity',
          icon: <Layers size={16} />,
        },
        {
          id: 'maps-raw',
          label: 'Map Runs Log',
          icon: <ListFilter size={16} />,
          count: counts.mapAttemptsCount,
        },
      ],
    },
    {
      title: 'System & Config',
      items: [
        {
          id: 'settings',
          label: 'API & Environment',
          icon: <Settings size={16} />,
        },
      ],
    },
  ];

  return (
    <aside className="app-sidebar">
      {sections.map((section, sIdx) => (
        <div key={sIdx} className="sidebar-section">
          <div className="sidebar-heading">{section.title}</div>
          {section.items.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectView(item.id)}
              >
                <div className="sidebar-item-label">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className="sidebar-count">{item.count}</span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
};
