'use client';

import React from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import type { LocationMapProps } from './LocationMap';

// Fix default marker icon path issue in Leaflet + webpack
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationMapClient({
  center,
  zoom = 13,
  markers = [],
  circles = [],
  height = '300px',
  onClick,
}: LocationMapProps) {
  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onClick && <ClickHandler onClick={onClick} />}
        {markers.map((m, i) => (
          <Marker key={i} position={[m.lat, m.lng]} icon={defaultIcon}>
            {m.label && <Popup>{m.label}</Popup>}
          </Marker>
        ))}
        {circles.map((c, i) => (
          <Circle
            key={i}
            center={[c.lat, c.lng]}
            radius={c.radius}
            pathOptions={{ color: c.color || '#3B82F6', fillColor: c.color || '#3B82F6', fillOpacity: 0.15 }}
          >
            {c.label && <Popup>{c.label}</Popup>}
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
}
