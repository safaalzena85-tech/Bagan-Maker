import React from 'react';

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  description?: string;
}

export const ColorField: React.FC<ColorFieldProps> = ({
  label,
  value,
  onChange,
  description,
}) => {
  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('#')) {
      val = '#' + val;
    }
    onChange(val);
  };

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="flex-1 min-w-0">
        <label className="text-xs font-medium text-slate-700 block truncate">
          {label}
        </label>
        {description && (
          <span className="text-[11px] text-slate-400 block truncate">
            {description}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Color picker circle */}
        <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-slate-300 shadow-2xs cursor-pointer hover:scale-105 transition-transform">
          <input
            type="color"
            value={value.startsWith('#') && value.length === 7 ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0 opacity-0"
          />
          <div
            className="w-full h-full"
            style={{ backgroundColor: value }}
          />
        </div>

        {/* Hex input */}
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={handleHexInput}
          maxLength={7}
          className="w-20 px-2 py-1 font-mono text-xs border border-slate-300 rounded-lg text-slate-700 bg-white text-center focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
      </div>
    </div>
  );
};
