'use client';

import dynamic from 'next/dynamic';
import React from 'react';

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

export interface MapCircle {
  lat: number;
  lng: number;
  radius: number;
  color?: string;
  label?: string;
}

export interface LocationMapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  circles?: MapCircle[];
  height?: string;
  onClick?: (lat: number, lng: number) => void;
}

// Inner component that will only be loaded on the client
const LocationMapInner = dynamic(
  () => import('./LocationMapClient'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted rounded-lg flex items-center justify-center" style={{ height: '300px' }}>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
);

export default function LocationMap(props: LocationMapProps) {
  return <LocationMapInner {...props} />;
}
