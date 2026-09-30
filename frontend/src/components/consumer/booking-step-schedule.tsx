"use client";

import React, { useState } from 'react';
import { MapPin, Clock, Calendar, PlusCircle, CheckCircle } from 'lucide-react';
import { SavedAddress } from '@/types/booking';

interface BookingStepScheduleProps {
  addresses: SavedAddress[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
  onAddNewAddress: (address: SavedAddress) => void;
  scheduledDate: string;
  onDateChange: (date: string) => void;
  scheduledSlot: string;
  onSlotChange: (slot: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  timeSlots: string[];
}

export const BookingStepSchedule: React.FC<BookingStepScheduleProps> = ({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddNewAddress,
  scheduledDate,
  onDateChange,
  scheduledSlot,
  onSlotChange,
  notes,
  onNotesChange,
  timeSlots,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('Other');
  const [newLine, setNewLine] = useState('');
  const [newCity, setNewCity] = useState('Gurugram');
  const [newState, setNewState] = useState('Haryana');
  const [newPin, setNewPin] = useState('122002');
  const [newLat, setNewLat] = useState('28.4595');
  const [newLng, setNewLng] = useState('77.0266');

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLine || !newPin) return;

    const newAddr: SavedAddress = {
      id: `addr-custom-${Date.now()}`,
      label: newLabel,
      addressLine: newLine,
      city: newCity,
      state: newState,
      postalCode: newPin,
      latitude: parseFloat(newLat) || 28.4595,
      longitude: parseFloat(newLng) || 77.0266,
    };

    onAddNewAddress(newAddr);
    onSelectAddress(newAddr.id);
    setShowAddModal(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Address Selection */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Pickup Address</h2>
          <button
            type="button"
            onClick={() => setShowAddModal(!showAddModal)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <PlusCircle size={16} /> {showAddModal ? 'Cancel' : 'New Address'}
          </button>
        </div>

        {showAddModal && (
          <form onSubmit={handleSaveNewAddress} className="card" style={{ marginBottom: 16, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Add Pickup Location</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="Address Line (Flat / Building / Street)"
                className="input-field"
                value={newLine}
                onChange={(e) => setNewLine(e.target.value)}
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input
                  type="text"
                  placeholder="City"
                  className="input-field"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="PIN Code (6 digits)"
                  className="input-field"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Latitude (e.g. 28.4595)"
                  className="input-field"
                  value={newLat}
                  onChange={(e) => setNewLat(e.target.value)}
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Longitude (e.g. 77.0266)"
                  className="input-field"
                  value={newLng}
                  onChange={(e) => setNewLng(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>
                Save & Select Address
              </button>
            </div>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {addresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;
            return (
              <button
                type="button"
                key={addr.id}
                onClick={() => onSelectAddress(addr.id)}
                style={{
                  padding: 14,
                  borderRadius: 'var(--radius-lg)',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: isSelected ? 'var(--color-primary-light)' : 'var(--color-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  transition: 'all 0.2s ease',
                }}
              >
                <MapPin
                  size={18}
                  color={isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{addr.label}</span>
                    {isSelected && <CheckCircle size={16} color="var(--color-primary)" />}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {addr.addressLine}, {addr.city}, {addr.state} - {addr.postalCode}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    GPS: {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date & Time Slot Selection */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Schedule Date & Slot</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Calendar size={18} color="var(--color-primary)" />
          <input
            type="date"
            className="input-field"
            value={scheduledDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => onDateChange(e.target.value)}
            style={{ maxWidth: 220 }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {timeSlots.map((slot) => {
            const isSelected = scheduledSlot === slot;
            return (
              <button
                type="button"
                key={slot}
                onClick={() => onSlotChange(slot)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: isSelected ? 'var(--color-primary-light)' : 'var(--color-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <Clock size={16} color={isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                <span style={{ flex: 1 }}>{slot}</span>
                {isSelected && <CheckCircle size={14} color="var(--color-primary)" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Special instructions */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
          Special Instructions for Collector (Optional)
        </label>
        <textarea
          rows={2}
          className="input-field"
          style={{ height: 'auto', padding: '10px 14px' }}
          placeholder="e.g., Ring doorbell 402, large items in corridor"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </div>
    </div>
  );
};
