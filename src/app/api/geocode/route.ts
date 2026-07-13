import { NextRequest, NextResponse } from 'next/server';

export interface GeoResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

// 장소 이름/주소 → 좌표. 한국 상호명은 카카오 로컬 검색이 정확해서 우선 사용하고,
// 카카오 키가 없으면 Nominatim(OSM)으로 폴백합니다.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json({ results: [] });

  const kakaoKey = process.env.KAKAO_REST_API_KEY;

  // 1) 카카오 키워드 검색 (한국 장소에 최적)
  if (kakaoKey) {
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?size=8&query=${encodeURIComponent(q)}`,
        { headers: { Authorization: `KakaoAK ${kakaoKey}` } },
      );
      if (res.ok) {
        const data = await res.json();
        const results: GeoResult[] = (data.documents || []).map((d: Record<string, string>) => ({
          name: d.place_name,
          address: d.road_address_name || d.address_name || '',
          lat: parseFloat(d.y),
          lng: parseFloat(d.x),
        }));
        return NextResponse.json({ results, provider: 'kakao' });
      }
    } catch {
      /* fall through to nominatim */
    }
  }

  // 2) 폴백: Nominatim (한국 상호명엔 약함)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=8&accept-language=ko&q=${encodeURIComponent(q)}`,
      { headers: { 'User-Agent': 'mindflow-couple-app/1.0' } },
    );
    const data = await res.json();
    const results: GeoResult[] = (data || []).map((d: Record<string, string>) => ({
      name: (d.display_name || q).split(',')[0],
      address: d.display_name || '',
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }));
    return NextResponse.json({ results, provider: 'nominatim' });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
