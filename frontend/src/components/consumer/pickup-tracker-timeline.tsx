"use client";

import React from 'react';
import { Check, Clock, Truck, Scale, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { TrackerStage } from '@/types/booking';

interface PickupTrackerTimelineProps {
  currentStatus: TrackerStage;
  onAdvanceStage?: (stage: TrackerStage) => void;
}

interface StageConfig {
  key: TrackerStage;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const STAGES: StageConfig[] = [
  {
    key: 'REQUESTED',
    title: 'Pickup Requested',
    subtitle: 'Looking for nearby collector partners',
    icon: Clock,
  },
  {
    key: 'ASSIGNED',
    title: 'Collector Assigned',
    subtitle: 'Partner accepted & en route',
    icon: Truck,
  },
  {
    key: 'COLLECTOR_ARRIVED',
    title: 'Collector Arrived',
    subtitle: 'Doorstep weigh-in in progress',
    icon: Scale,
  },
  {
    key: 'COLLECTED',
    title: 'Material Weighed & Verified',
    subtitle: 'Calibrated weight locked digitally',
    icon: ShieldCheck,
  },
  {
    key: 'COMPLETED',
    title: 'Completed & Paid',
    subtitle: 'Instant payout credited to UPI',
    icon: CheckCircle2,
  },
];

const STAGE_ORDER: TrackerStage[] = [
  'REQUESTED',
  'ASSIGNED',
  'COLLECTOR_ARRIVED',
  'COLLECTED',
  'COMPLETED',
];

export const PickupTrackerTimeline: React.FC<PickupTrackerTimelineProps> = ({
  currentStatus,
  onAdvanceStage,
}) => {
  const currentIndex = STAGE_ORDER.indexOf(currentStatus);

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Live Collection Progress</h2>
        <span className="status-pill status-info animate-pulse-dot">Live Tracker</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;

          const IconComponent = stage.icon;

          return (
            <div key={stage.key} style={{ display: 'flex', alignItems: 'flex-start', minHeight: 64 }}>
              {/* Stepper Node & Line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 14 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isCompleted
                      ? 'var(--color-success)'
                      : isCurrent
                      ? 'var(--color-primary)'
                      : 'var(--color-canvas)',
                    border: isPending ? '2px solid var(--color-border)' : 'none',
                    color: isPending ? 'var(--color-text-muted)' : 'white',
                    transition: 'all 0.3s ease',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(5,150,105,0.2)' : 'none',
                  }}
                >
                  {isCompleted ? <Check size={16} /> : <IconComponent size={16} />}
                </div>

                {idx < STAGES.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      height: 36,
                      background: isCompleted ? 'var(--color-success)' : 'var(--color-border)',
                      margin: '4px 0',
                    }}
                  />
                )}
              </div>

              {/* Step Info */}
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: isCurrent ? 700 : isCompleted ? 600 : 500,
                      color: isCurrent
                        ? 'var(--color-primary)'
                        : isCompleted
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-muted)',
                    }}
                  >
                    {stage.title}
                  </div>
                  {isCurrent && (
                    <span
                      style={{
                        fontSize: 11,
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        padding: '1px 6px',
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      Current
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {stage.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulator bar for interactive demonstration */}
      {onAdvanceStage && (
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px dashed var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Demo Simulation:</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {STAGE_ORDER.map((stageKey) => (
              <button
                key={stageKey}
                type="button"
                onClick={() => onAdvanceStage(stageKey)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: currentStatus === stageKey ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: currentStatus === stageKey ? 'var(--color-primary-light)' : 'white',
                  color: currentStatus === stageKey ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                }}
              >
                {stageKey.split('_')[0]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
