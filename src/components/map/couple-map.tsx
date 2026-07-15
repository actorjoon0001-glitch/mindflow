'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, LocateFixed } from 'lucide-react';
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

// 검색/핀 위치(pending)가 정해지면 그 위치로 지도 이동.
function FlyToPending({ pending }: { pending: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (pending) map.setView([pending.lat, pending.lng], 16, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending?.lat, pending?.lng]);
  return null;
}

// 모바일에서 편하게: 지도 중앙에 조준점을 두고 "여기에 기록" 버튼으로 추가.
function MapControls({ onAddCenter }: { onAddCenter: (lat: number, lng: number) => void }) {
  const map = useMap();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);

  const locate = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert('이 브라우저에서는 위치를 사용할 수 없어요.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => map.setView([p.coords.latitude, p.coords.longitude], 16, { animate: true }),
      () => alert('위치를 가져올 수 없어요. 위치 권한을 확인해주세요.'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const addHere = () => {
    const c = map.getCenter();
    onAddCenter(c.lat, c.lng);
  };

  return (
    <div ref={ref} className="absolute right-3 bottom-3 z-[500] flex flex-col gap-2 items-end">
      <button
        onClick={locate}
        className="w-11 h-11 rounded-full bg-white text-gray-700 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        title="내 위치로"
      >
        <LocateFixed size={20} />
      </button>
      <button
        onClick={addHere}
        className="h-11 px-4 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white font-medium shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform"
      >
        <Plus size={18} /> 여기에 기록
      </button>
    </div>
  );
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
    <div className="relative h-full w-full">
    <MapContainer
      center={center}
      zoom={13}
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
      <FlyToPending pending={pending} />
      <MapControls onAddCenter={onPick} />

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

    {/* 중앙 조준점 — "여기에 기록" 버튼이 이 위치를 저장 */}
    <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-rose-500 bg-rose-500/15" />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-rose-600" />
      </div>
    </div>
    </div>
  );
}
