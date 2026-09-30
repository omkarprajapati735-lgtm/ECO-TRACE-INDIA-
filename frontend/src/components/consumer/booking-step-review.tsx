"use client";

import React from 'react';
import { Package, MapPin, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { CategoryItem, SavedAddress } from '@/types/booking';

interface BookingStepReviewProps {
  categories: CategoryItem[];
  selectedCategories: string[];
  weight: number;
  selectedAddress?: SavedAddress;
  scheduledDate: string;
  scheduledSlot: string;
  notes?: string;
  estimatedMin: number;
  estimatedMax: number;
  estimatedBase: number;
  validationError?: string | null;
}

export const BookingStepReview: React.FC<BookingStepReviewProps> = ({
  categories,
  selectedCategories,
  weight,
  selectedAddress,
  scheduledDate,
  scheduledSlot,
  notes,
  estimatedMin,
  estimatedMax,
  estimatedBase,
  validationError,
}) => {
  const chosenCategories = categories.filter((c) => selectedCategories.includes(c.id));

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Review Your Booking</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Please verify your collection details before confirming.
        </p>
      </div>

      {validationError && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--color-error-tint)',
            border: '1px solid #FECACA',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-error-text)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={16} />
          <span>{validationError}</span>
        </div>
      )}

      {/* Selected Items Card */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
            Recycling Items ({chosenCategories.length})
          </h3>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Est. Total: {weight.toFixed(1)} kg
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {chosenCategories.map((cat) => (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={16} color="var(--color-primary)" />
                <span style={{ fontSize: 14, fontWeight: 500 }}>{cat.name}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
                  ₹{cat.baseRate}/kg
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  (₹{cat.minRate} - ₹{cat.maxRate})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pickup Details Card */}
      <div className="card" style={{ padding: 18 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>
          Logistics & Schedule
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selectedAddress && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <MapPin size={16} color="var(--color-primary)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedAddress.label}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {selectedAddress.addressLine}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postalCode}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Coordinates: {selectedAddress.latitude.toFixed(4)}, {selectedAddress.longitude.toFixed(4)}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={16} color="var(--color-primary)" />
            <span style={{ fontSize: 13 }}>
              <strong>Date:</strong> {scheduledDate}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={16} color="var(--color-primary)" />
            <span style={{ fontSize: 13 }}>
              <strong>Slot:</strong> {scheduledSlot}
            </span>
          </div>

          {notes && (
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'var(--color-canvas)', padding: 8, borderRadius: 'var(--radius-sm)' }}>
              <strong>Note:</strong> {notes}
            </div>
          )}
        </div>
      </div>

      {/* Payout Range Card */}
      <div
        style={{
          padding: 20,
          background: 'var(--color-primary-light)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #A7F3D0',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary-dark)', marginBottom: 2 }}>
          GUARANTEED ESTIMATED PAYOUT RANGE
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-primary)' }}>
          ₹{estimatedMin.toLocaleString('en-IN')} – ₹{estimatedMax.toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          Expected amount: ~ ₹{estimatedBase.toLocaleString('en-IN')} (instant UPI payout after doorstep digital weighing)
        </div>
      </div>
    </div>
  );
};
