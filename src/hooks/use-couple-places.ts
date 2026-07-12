'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { CouplePlace } from '@/types';

export function useCouplePlaces() {
  const [places, setPlaces] = useState<CouplePlace[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const couple = useAuthStore((s) => s.couple);

  const fetchPlaces = useCallback(async () => {
    if (!couple) {
      setPlaces([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('couple_places')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false });
    setPlaces(data || []);
    setLoading(false);
  }, [couple]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const createPlace = async (data: {
    name: string; lat: number; lng: number;
    address?: string; memo?: string; category?: CouplePlace['category'];
    rating?: number | null; visited_date?: string | null; photo_url?: string | null;
  }) => {
    if (!couple || !user) return null;
    const supabase = createClient();
    const { data: place } = await supabase
      .from('couple_places')
      .insert({ couple_id: couple.id, created_by: user.id, ...data })
      .select()
      .single();
    if (place) setPlaces((prev) => [place, ...prev]);
    return place;
  };

  const deletePlace = async (id: string) => {
    const supabase = createClient();
    await supabase.from('couple_places').delete().eq('id', id);
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  };

  return { places, loading, fetchPlaces, createPlace, deletePlace };
}
