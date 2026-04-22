"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"

const categories = [
  { id: 0, name: "Tất cả", icon: "🗺️" },
  { id: 1, name: "Lương thực", icon: "🌾" },
  { id: 2, name: "Thực phẩm", icon: "🍜" },
  { id: 3, name: "Dược liệu", icon: "🌿" },
  { id: 4, name: "Thủ công mỹ nghệ", icon: "🏺" },
  { id: 5, name: "Hàng tiêu dùng", icon: "🛍️" },
  { id: 6, name: "Đồ uống", icon: "🍵" },
]

const categoryColors: Record<number, string> = {
  1: '#f59e0b', 2: '#ef4444', 3: '#10b981',
  4: '#8b5cf6', 5: '#3b82f6', 6: '#06b6d4',
}

interface MapLocation {
  id: number
  name: string
  img?: string
  origin?: string
  contact_address?: string
  category_id?: number
  phone?: string
  lat: number
  lng: number
}

interface Village {
  key: string
  name: string
  specialty: string
  lat: number
  lng: number
  productCount: number
}

declare global {
  interface Window { L: any }
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersLayer = useRef<any>(null)
  const [locations, setLocations] = useState<MapLocation[]>([])
  const [villages, setVillages] = useState<Village[]>([])
  const [activeCategory, setActiveCategory] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [nearbyCount, setNearbyCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<MapLocation | null>(null)
  const [nearestLocations, setNearestLocations] = useState<{loc: MapLocation, dist: number}[]>([])
  const [leafletReady, setLeafletReady] = useState(false)
  const [searchRadius, setSearchRadius] = useState(5)
  const circleRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)

  // Load Leaflet from CDN
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.L) {
      const cssLink = document.createElement('link')
      cssLink.rel = 'stylesheet'
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(cssLink)

      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => setLeafletReady(true)
      document.head.appendChild(script)
    } else if (window.L) {
      setLeafletReady(true)
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstance.current) return

    const L = window.L
    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([21.12, 106.08], 11)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)

    markersLayer.current = L.layerGroup().addTo(map)
    mapInstance.current = map
  }, [leafletReady])

  // Fetch data
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const params = activeCategory ? `?category=${activeCategory}` : ''
        const res = await fetch(`/api/map/locations${params}`)
        const data = await res.json()
        setLocations(data.locations || [])
        setVillages(data.villages || [])
      } catch {
        setLocations([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeCategory])

  // Update markers
  useEffect(() => {
    if (!leafletReady || !mapInstance.current || !markersLayer.current) return
    const L = window.L
    markersLayer.current.clearLayers()

    locations.forEach(loc => {
      const color = categoryColors[loc.category_id || 1] || '#166534'
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:white;font-weight:bold;">🏪</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      const marker = L.marker([loc.lat, loc.lng], { icon })
      marker.on('click', () => setSelectedProduct(loc))
      marker.bindTooltip(loc.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -14],
        className: 'custom-tooltip',
      })
      markersLayer.current.addLayer(marker)
    })

    // Count nearby if user location available
    if (userLocation) {
      const nearby = locations.filter(loc => {
        const dist = getDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng)
        return dist <= 20
      })
      setNearbyCount(nearby.length)
    }
  }, [locations, leafletReady, userLocation])

  const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const updateRadiusAndFilter = useCallback((radius: number, location: {lat: number, lng: number} | null = userLocation) => {
    setSearchRadius(radius);
    if (!location || !mapInstance.current || !window.L) return;

    if (circleRef.current) {
       mapInstance.current.removeLayer(circleRef.current);
    }
    if (userMarkerRef.current) {
       mapInstance.current.removeLayer(userMarkerRef.current);
    }

    const L = window.L;
    const userIcon = L.divIcon({
      className: 'user-marker',
      html: `<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 8px rgba(59,130,246,0.2),0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
    userMarkerRef.current = L.marker([location.lat, location.lng], { icon: userIcon })
      .addTo(mapInstance.current)
      .bindPopup('<b>📍 Vị trí của bạn</b>')

    const dists = locations.map(loc => ({
      loc,
      dist: getDistance(location.lat, location.lng, loc.lat, loc.lng)
    })).sort((a, b) => a.dist - b.dist);

    const withinRadius = dists.filter(item => item.dist <= radius);
    setNearestLocations(withinRadius);
    
    if (withinRadius.length > 0) {
      setSelectedProduct(withinRadius[0].loc);
    }

    circleRef.current = L.circle([location.lat, location.lng], {
      radius: radius * 1000,
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '5, 5'
    }).addTo(mapInstance.current);

    mapInstance.current.fitBounds(circleRef.current.getBounds(), { padding: [20, 20] });
  }, [locations, userLocation]);

  const findMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ định vị')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setUserLocation({ lat: latitude, lng: longitude })
        updateRadiusAndFilter(searchRadius, { lat: latitude, lng: longitude })
      },
      () => alert('Không thể xác định vị trí'),
      { enableHighAccuracy: true }
    )
  }, [searchRadius, updateRadiusAndFilter])

  const flyTo = (lat: number, lng: number) => {
    if (mapInstance.current) {
      mapInstance.current.setView([lat, lng], 14, { animate: true })
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-slate-50 relative">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-4 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors lg:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div>
            <h1 className="font-heading font-bold text-slate-900 text-lg">🗺️ Bản đồ Làng nghề OCOP</h1>
            <p className="text-xs text-slate-500 hidden sm:block">Khám phá cơ sở sản xuất OCOP Bắc Ninh</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {nearbyCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full hidden sm:block animate-pulse">
              📍 {nearbyCount} cơ sở trong 20km
            </div>
          )}
          <button
            onClick={findMyLocation}
            className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm py-2 px-4 rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span className="hidden sm:inline">Tìm gần tôi</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} absolute lg:relative z-30 w-80 h-full bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 shadow-xl lg:shadow-none`}>
          {/* Category Filter */}
          <div className="p-4 border-b border-slate-100 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Lọc danh mục</h3>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeCategory === c.id
                      ? 'bg-brand-green text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Radius Filter */}
          {userLocation && (
            <div className="p-4 border-b border-slate-100 shrink-0 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Phạm vi tìm kiếm Rada</h3>
                <span className="text-sm font-bold text-brand-green">{searchRadius} km</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={searchRadius} 
                onChange={(e) => updateRadiusAndFilter(Number(e.target.value))}
                className="w-full accent-brand-green"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                <span>1km</span>
                <span>100km</span>
              </div>
            </div>
          )}

          {/* Điểm bán gần nhất (nếu có) */}
          {userLocation && (
            nearestLocations.length > 0 ? (
              <div className="p-4 border-b border-brand-green/20 bg-brand-green/5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-green mb-3 flex items-center gap-1">
                  📍 {nearestLocations.length} Điểm gần bạn nhất
                </h3>
                <div className="space-y-2">
                  {nearestLocations.map((item, idx) => (
                    <button
                      key={item.loc.id}
                      onClick={() => { flyTo(item.loc.lat, item.loc.lng); setSelectedProduct(item.loc); setSidebarOpen(false) }}
                      className="w-full text-left p-3 bg-white hover:bg-brand-green/5 rounded-xl border border-brand-green/30 shadow-sm transition-all group relative overflow-hidden"
                    >
                      {idx === 0 && (
                         <div className="absolute top-0 right-0 bg-brand-gold text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10">GẦN NHẤT</div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-heading font-bold text-slate-800 text-sm group-hover:text-brand-green transition-colors line-clamp-2 pr-10">
                          {item.loc.name}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-slate-500 truncate max-w-[150px]">{item.loc.origin || 'Bắc Ninh'}</p>
                        <span className="bg-brand-green text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                          {item.dist < 1 ? Math.round(item.dist * 1000) + ' m' : item.dist.toFixed(1) + ' km'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 border-b border-slate-100 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">📡</div>
                <p className="text-sm text-slate-500 font-medium">Trong phạm vi <span className="font-bold text-slate-700">{searchRadius} km</span> không có cơ sở nào.</p>
                <p className="text-xs text-slate-400 mt-1">Vui lòng kéo thanh trượt để mở rộng phạm vi tìm kiếm.</p>
              </div>
            )
          )}

          {/* Villages List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Làng nghề ({villages.filter(v => v.productCount > 0).length})
              </h3>
              <div className="space-y-2">
                {villages.filter(v => v.productCount > 0).map(v => (
                  <button
                    key={v.key}
                    onClick={() => { flyTo(v.lat, v.lng); setSidebarOpen(false) }}
                    className="w-full text-left p-3 bg-slate-50 hover:bg-brand-green/5 rounded-xl border border-slate-100 hover:border-brand-green/20 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-semibold text-slate-800 text-sm group-hover:text-brand-green transition-colors">
                        {v.name}
                      </h4>
                      <span className="bg-brand-green/10 text-brand-green text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {v.productCount} SP
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">🎨 {v.specialty}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 border-t border-slate-100">
              <div className="bg-gradient-to-br from-brand-green/5 to-emerald-50 p-4 rounded-xl border border-brand-green/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green text-lg">🏭</div>
                  <div>
                    <p className="font-heading font-bold text-slate-800 text-lg">{locations.length}</p>
                    <p className="text-xs text-slate-500">Cơ sở OCOP trên bản đồ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />

          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-3">
                <svg className="w-8 h-8 text-brand-green animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-slate-600 font-medium text-sm">Đang tải bản đồ...</span>
              </div>
            </div>
          )}

          {/* Product Detail Panel */}
          {selectedProduct && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-20 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex">
                {selectedProduct.img ? (
                  <img src={selectedProduct.img} alt={selectedProduct.name} className="w-28 h-28 object-cover shrink-0" />
                ) : (
                  <div className="w-28 h-28 bg-slate-100 flex items-center justify-center text-3xl shrink-0">🌾</div>
                )}
                <div className="p-4 flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-slate-900 text-sm line-clamp-2">{selectedProduct.name}</h3>
                  {selectedProduct.origin && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">📍 {selectedProduct.origin}</p>
                  )}
                  {selectedProduct.contact_address && (
                    <p className="text-xs text-slate-400 mt-0.5">🏢 {selectedProduct.contact_address}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Link href={`/products/${selectedProduct.id}`} className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                      Xem chi tiết
                    </Link>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-tooltip {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px !important;
          padding: 4px 10px !important;
          font-family: 'Be Vietnam Pro', sans-serif !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          color: #1e293b !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        }
        .custom-tooltip::before {
          border-top-color: #e2e8f0 !important;
        }
        .leaflet-control-zoom a {
          border-radius: 8px !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 16px !important;
        }
      `}</style>
    </div>
  )
}
