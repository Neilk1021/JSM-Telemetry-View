import React from 'react';

interface TooltipPayloadItem {
  name: string;
  value: number | string;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatter?: (val: number | string, name?: string) => string;
  extraInfo?: (payload: TooltipPayloadItem[]) => React.ReactNode;
}

export const CustomChartTooltip: React.FC<CustomChartTooltipProps> = ({
  active,
  payload,
  label,
  formatter,
  extraInfo,
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="custom-tooltip">
      {label && <div className="tooltip-title">{label}</div>}
      {payload.map((item, idx) => {
        const displayVal = formatter ? formatter(item.value, item.name) : item.value;
        return (
          <div key={idx} className="tooltip-row">
            <span style={{ color: item.color || 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color || '#38bdf8' }} />
              {item.name}:
            </span>
            <span className="tooltip-row-val">{displayVal}</span>
          </div>
        );
      })}
      {extraInfo && <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>{extraInfo(payload)}</div>}
    </div>
  );
};
