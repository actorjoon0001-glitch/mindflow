'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COUPLE_PLACE_CATEGORIES } from '@/lib/constants';
import type { CouplePlace } from '@/types';

function emojiIcon(emoji: string) {
  return L.divIcon({
    html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))">${emoji}</div>`,
    className: 'couple-place-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -26],
  });
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FitBounds({ places, focus }: { places: CouplePlace[]; focus: CouplePlace | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) {
      map.setView([focus.lat, focus.lng], 15, { animate: true });
    } else if (places.length > 0) {
      const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds.pad(0.3), { maxZoom: 14 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, places.length]);
  return null;
}

interface CoupleMapProps {
  places: CouplePlace[];
  focus: CouplePlace | null;
  onPick: (lat: number, lng: number) => void;
  pending: { lat: number; lng: number } | null;
}

export default function CoupleMap({ places, focus, onPick, pending }: CoupleMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (places.length) return [places[0].lat, places[0].lng];
    return [37.5665, 126.978]; // Seoul
  }, [places]);

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
      className="rounded-xl"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <FitBounds places={places} focus={focus} />

      {places.map((place) => {
        const cat = COUPLE_PLACE_CATEGORIES[place.category] || COUPLE_PLACE_CATEGORIES.etc;
        return (
          <Marker key={place.id} position={[place.lat, place.lng]} icon={emojiIcon(cat.emoji)}>
            <Popup>
              <div style={{ minWidth: 140 }}>
                <strong>{cat.emoji} {place.name}</strong>
                {place.rating ? <div>{'⭐'.repeat(place.rating)}</div> : null}
                {place.visited_date ? <div style={{ color: '#666', fontSize: 12 }}>{place.visited_date}</div> : null}
                {place.memo ? <div style={{ fontSize: 13, marginTop: 4 }}>{place.memo}</div> : null}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {pending && (
        <Marker position={[pending.lat, pending.lng]} icon={emojiIcon('📍')} />
      )}
    </MapContainer>
  );
}
