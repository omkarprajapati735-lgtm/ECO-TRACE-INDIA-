"use client";

import React from 'react';
import { UserCheck, Star, Phone, ShieldCheck, KeyRound, Radio } from 'lucide-react';
import { PickupTrackerData } from '@/types/booking';

interface PickupTrackerCollectorProps {
  pickup: PickupTrackerData;
}

export const PickupTrackerCollector: React.FC<PickupTrackerCollectorProps> = ({ pickup }) => {
  const isAssigned = pickup.status !== 'REQUESTED';

  if (!isAssigned) {
    return (
      <div className="card" style={{ padding: 18, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Radio size={20} color="var(--color-primary)" className="animate-pulse-dot" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              Broadcasting to Nearby Collectors
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Verified field agents in your ward are receiving this pickup alert.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const collector = pickup.collector || {
    fullName: 'Ramesh Kumar',
    phone: '+91 98765 43210',
    rating: 4.9,
    totalTrips: 184,
    vehicleNumber: 'HR-26-EK-4029',
    isVerified: true,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Collector Info Card */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              RK
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{collector.fullName}</span>
                {collector.isVerified && (
                  <span
                    style={{
                      background: '#D1FAE5',
                      color: '#065F46',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <ShieldCheck size={11} /> CPCB VERIFIED
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#D97706', fontWeight: 600 }}>
                  <Star size={13} fill="#D97706" color="#D97706" /> {collector.rating}
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>•</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {collector.totalTrips} Doorstep Collections
                </span>
              </div>
            </div>
          </div>

          <a
            href={`tel:${collector.phone}`}
            className="btn btn-secondary"
            style={{ width: 38, height: 38, padding: 0, borderRadius: '50%' }}
            aria-label="Call collector"
          >
            <Phone size={16} color="var(--color-primary)" />
          </a>
        </div>

        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-canvas)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Vehicle: <strong>{collector.vehicleNumber}</strong> (Electric Loader)</span>
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>ETA: ~15 mins</span>
        </div>
      </div>

      {/* Doorstep Verification PIN */}
      <div
        style={{
          padding: 16,
          background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
          borderRadius: 'var(--radius-lg)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.9 }}>
            <KeyRound size={14} /> Doorstep Verification OTP
          </div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>
            Share with collector after calibrated weigh-in
          </div>
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: '0.15em',
            background: 'rgba(255,255,255,0.2)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {pickup.doorstepOtp}
        </div>
      </div>
    </div>
  );
};
