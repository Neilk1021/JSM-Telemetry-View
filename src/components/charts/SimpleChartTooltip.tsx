import React from 'react';

interface TooltipPayloadItem {
  name: string;
  value: number | string;
  color?: string;
}

interface SimpleChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatter?: (val: number | string, name?: string) => string;
}

export const SimpleChartTooltip: React.FC<SimpleChartTooltipProps> = ({
  active,
  payload,
  label,
  formatter,
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      {label && <div className="chart-tooltip-title">{label}</div>}
      {payload.map((item, idx) => {
        const displayVal = formatter ? formatter(item.value, item.name) : item.value;
        return (
          <div key={idx} className="chart-tooltip-row">
            <span style={{ color: item.color || '#deebff' }}>
              {item.name}:
            </span>
            <strong>{displayVal}</strong>
          </div>
        );
      })}
    </div>
  );
};
