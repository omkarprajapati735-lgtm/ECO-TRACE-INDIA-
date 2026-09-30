"use client";

import React from 'react';
import { Smartphone, Laptop, Battery, Home, Cpu, Wrench, Minus, Plus, Check } from 'lucide-react';
import { CategoryItem } from '@/types/booking';

interface BookingStepItemsProps {
  categories: CategoryItem[];
  selectedCategories: string[];
  onToggleCategory: (id: string) => void;
  weight: number;
  onWeightChange: (val: number) => void;
  estimatedMin: number;
  estimatedMax: number;
  estimatedBase: number;
}

const iconMap: Record<string, React.ElementType> = {
  Smartphone,
  Laptop,
  Battery,
  Home,
  Cpu,
  Wrench,
};

export const BookingStepItems: React.FC<BookingStepItemsProps> = ({
  categories,
  selectedCategories,
  onToggleCategory,
  weight,
  onWeightChange,
  estimatedMin,
  estimatedMax,
  estimatedBase,
}) => {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>What would you like to recycle?</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Select all categories that apply to calculate your verified payout.
        </p>
      </div>

      {/* Responsive category grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategories.includes(cat.id);
          const IconComponent = iconMap[cat.iconName] || Cpu;

          return (
            <button
              type="button"
              key={cat.id}
              onClick={() => onToggleCategory(cat.id)}
              style={{
                padding: '16px 12px',
                borderRadius: 'var(--radius-lg)',
                border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: isSelected ? 'var(--color-primary-light)' : 'var(--color-card)',
                cursor: 'pointer',
                textAlign: 'center',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 0 3px rgba(5,150,105,0.15)' : 'var(--shadow-sm)',
              }}
            >
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={12} color="white" />
                </div>
              )}
              <IconComponent
                size={26}
                color={isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)'}
                style={{ marginBottom: 8 }}
              />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                {cat.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>
                ₹{cat.baseRate}/kg
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                Range: ₹{cat.minRate} - ₹{cat.maxRate}
              </div>
            </button>
          );
        })}
      </div>

      {/* Weight Adjuster & Live Payout Estimation */}
      {selectedCategories.length > 0 && (
        <div className="card" style={{ padding: 20, marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>Estimated Total Weight</label>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Calibrated at doorstep</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => onWeightChange(Math.max(0.5, Number((weight - 0.5).toFixed(1))))}
              className="btn btn-secondary"
              style={{ width: 44, height: 44, padding: 0, flexShrink: 0 }}
              aria-label="Decrease weight"
            >
              <Minus size={18} />
            </button>

            <div style={{ flex: 1, textAlign: 'center' }}>
              <input
                type="range"
                min="0.5"
                max="100"
                step="0.5"
                value={weight}
                onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0.5)}
                style={{ width: '100%', accentColor: 'var(--color-primary)', height: 6 }}
              />
              <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: 'var(--color-text-primary)' }}>
                {weight.toFixed(1)} <span style={{ fontSize: 16, fontWeight: 500 }}>kg</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onWeightChange(Math.min(100, Number((weight + 0.5).toFixed(1))))}
              className="btn btn-secondary"
              style={{ width: 44, height: 44, padding: 0, flexShrink: 0 }}
              aria-label="Increase weight"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Dynamic Scrap Rate Valuation Card */}
          <div
            style={{
              padding: 16,
              background: 'var(--color-primary-light)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #A7F3D0',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary-dark)', marginBottom: 2 }}>
              ESTIMATED SCRAP PAYOUT RANGE
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)' }}>
              ₹{estimatedMin.toLocaleString('en-IN')} – ₹{estimatedMax.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              Expected average ~ ₹{estimatedBase.toLocaleString('en-IN')} (based on live catalog index)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
