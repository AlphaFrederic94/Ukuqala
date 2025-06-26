import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Navigation, Phone, Clock, Star, Filter,
  Building2, Stethoscope, Heart, Activity, Search,
  Route, Car, Footprints, Bus, Loader2, AlertCircle,
  ExternalLink, Bookmark, Share2, Info, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { config } from '../lib/config';

interface MedicalFacility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'emergency' | 'specialist';
  address: string;
  phone?: string;
  rating?: number;
  distance?: number;
  isOpen?: boolean;
  openingHours?: string;
  lat: number;
  lng: number;
  placeId?: string;
}

interface UserLocation {
  lat: number;
  lng: number;
}

const MedicalFacilitiesPage: React.FC = () => {
  const [facilities, setFacilities] = useState<MedicalFacility[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<MedicalFacility | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'transit'>('driving');

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const facilityTypes = [
    { value: 'all', label: 'All Facilities', icon: MapPin, color: 'blue' },
    { value: 'hospital', label: 'Hospitals', icon: Building2, color: 'red' },
    { value: 'clinic', label: 'Clinics', icon: Stethoscope, color: 'green' },
    { value: 'pharmacy', label: 'Pharmacies', icon: Heart, color: 'purple' },
    { value: 'emergency', label: 'Emergency', icon: Activity, color: 'orange' },
  ];

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        // Load Google Maps API
        if (!window.google) {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMaps.apiKey}&libraries=places`;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);

          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }

        // Get user location with high accuracy
        if (navigator.geolocation) {
          // Request high accuracy location
          const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000 // Cache for 1 minute
          };

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };

              console.log('High accuracy location obtained:', {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date(position.timestamp)
              });

              setUserLocation(location);
              initMap(location);
              toast.success(`Location found with ${Math.round(position.coords.accuracy)}m accuracy`);
            },
            (error) => {
              console.error('Error getting high accuracy location:', error);

              // Fallback to lower accuracy if high accuracy fails
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                  };
                  setUserLocation(location);
                  initMap(location);
                  toast.warning('Using approximate location. Enable precise location for better results.');
                },
                (fallbackError) => {
                  console.error('Fallback location also failed:', fallbackError);
                  // Default to a central location (you can change this)
                  const defaultLocation = { lat: -1.2921, lng: 36.8219 }; // Nairobi, Kenya
                  setUserLocation(defaultLocation);
                  initMap(defaultLocation);
                  toast.error('Could not get your location. Using default location.');
                },
                { enableHighAccuracy: false, timeout: 5000 }
              );
            },
            options
          );
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        toast.error('Failed to load map');
      }
    };

    initializeMap();
  }, []);

  // Initialize the map
  const initMap = (center: UserLocation) => {
    if (!mapRef.current || !window.google) return;

    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      styles: [
        {
          featureType: 'poi.medical',
          elementType: 'geometry',
          stylers: [{ color: '#ff6b6b' }]
        }
      ]
    });

    googleMapRef.current = map;
    directionsServiceRef.current = new google.maps.DirectionsService();
    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#3b82f6',
        strokeWeight: 4
      }
    });
    directionsRendererRef.current.setMap(map);

    // Add user location marker
    new google.maps.Marker({
      position: center,
      map,
      title: 'Your Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(24, 24)
      }
    });

    // Search for nearby medical facilities
    searchNearbyFacilities(center);
  };

  // Search for nearby medical facilities
  const searchNearbyFacilities = async (location: UserLocation) => {
    if (!window.google || !googleMapRef.current) return;

    setIsLoading(true);
    const service = new google.maps.places.PlacesService(googleMapRef.current);

    const searchTypes = selectedType === 'all'
      ? ['hospital', 'doctor', 'pharmacy', 'physiotherapist', 'dentist']
      : [selectedType === 'clinic' ? 'doctor' : selectedType];

    const allFacilities: MedicalFacility[] = [];

    try {
      for (const type of searchTypes) {
        await new Promise<void>((resolve) => {
          service.nearbySearch(
            {
              location,
              radius: 10000, // 10km radius
              type: type as any,
              keyword: 'medical health clinic hospital'
            },
            (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const facilities = results.slice(0, 10).map((place): MedicalFacility => ({
                  id: place.place_id || Math.random().toString(),
                  name: place.name || 'Unknown',
                  type: mapPlaceTypeToFacilityType(type),
                  address: place.vicinity || 'Address not available',
                  phone: place.formatted_phone_number,
                  rating: place.rating,
                  isOpen: place.opening_hours?.open_now,
                  lat: place.geometry?.location?.lat() || 0,
                  lng: place.geometry?.location?.lng() || 0,
                  placeId: place.place_id
                }));

                allFacilities.push(...facilities);

                // Add markers to map
                facilities.forEach(facility => addMarkerToMap(facility));
              }
              resolve();
            }
          );
        });
      }

      // Calculate distances and sort
      const facilitiesWithDistance = allFacilities.map(facility => ({
        ...facility,
        distance: calculateDistance(location, { lat: facility.lat, lng: facility.lng })
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setFacilities(facilitiesWithDistance);
    } catch (error) {
      console.error('Error searching facilities:', error);
      toast.error('Failed to search medical facilities');
    } finally {
      setIsLoading(false);
    }
  };

  // Map Google Places types to our facility types
  const mapPlaceTypeToFacilityType = (placeType: string): MedicalFacility['type'] => {
    switch (placeType) {
      case 'hospital': return 'hospital';
      case 'doctor': return 'clinic';
      case 'pharmacy': return 'pharmacy';
      case 'physiotherapist':
      case 'dentist': return 'specialist';
      default: return 'clinic';
    }
  };

  // Add marker to map
  const addMarkerToMap = (facility: MedicalFacility) => {
    if (!googleMapRef.current) return;

    const iconColors = {
      hospital: '#ef4444',
      clinic: '#10b981',
      pharmacy: '#8b5cf6',
      emergency: '#f97316',
      specialist: '#06b6d4'
    };

    const marker = new google.maps.Marker({
      position: { lat: facility.lat, lng: facility.lng },
      map: googleMapRef.current,
      title: facility.name,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2C10.48 2 6 6.48 6 12C6 20 16 30 16 30S26 20 26 12C26 6.48 21.52 2 16 2Z" fill="${iconColors[facility.type]}" stroke="#ffffff" stroke-width="2"/>
            <circle cx="16" cy="12" r="4" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32)
      }
    });

    marker.addListener('click', () => {
      setSelectedFacility(facility);
    });
  };

  // Calculate distance between two points
  const calculateDistance = (point1: UserLocation, point2: UserLocation): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get directions to facility with multiple route options
  const getDirections = (facility: MedicalFacility) => {
    if (!userLocation || !directionsServiceRef.current || !directionsRendererRef.current) {
      toast.error('Unable to get directions');
      return;
    }

    const travelModes = {
      driving: google.maps.TravelMode.DRIVING,
      walking: google.maps.TravelMode.WALKING,
      transit: google.maps.TravelMode.TRANSIT
    };

    // Request multiple route alternatives
    directionsServiceRef.current.route(
      {
        origin: userLocation,
        destination: { lat: facility.lat, lng: facility.lng },
        travelMode: travelModes[travelMode],
        provideRouteAlternatives: true, // Request alternative routes
        avoidHighways: false,
        avoidTolls: false,
        optimizeWaypoints: true
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRendererRef.current?.setDirections(result);
          setShowDirections(true);

          // Show route information
          const route = result.routes[0];
          const leg = route.legs[0];
          const distance = leg.distance?.text || 'Unknown distance';
          const duration = leg.duration?.text || 'Unknown duration';
          const alternativeCount = result.routes.length - 1;

          toast.success(
            `Route to ${facility.name}: ${distance}, ${duration}${
              alternativeCount > 0 ? ` (+${alternativeCount} alternative${alternativeCount > 1 ? 's' : ''})` : ''
            }`
          );
        } else {
          toast.error('Could not get directions');
        }
      }
    );
  };

  // Open directions in external maps app
  const openInMaps = (facility: MedicalFacility) => {
    if (!userLocation) {
      toast.error('Location not available');
      return;
    }

    const origin = `${userLocation.lat},${userLocation.lng}`;
    const destination = `${facility.lat},${facility.lng}`;

    // Detect platform and open appropriate maps app
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    let mapsUrl = '';

    if (isIOS) {
      // Apple Maps
      mapsUrl = `maps://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=d`;
    } else if (isAndroid) {
      // Google Maps Android
      mapsUrl = `google.navigation:q=${destination}&mode=d`;
    } else {
      // Web Google Maps
      mapsUrl = `https://www.google.com/maps/dir/${origin}/${destination}`;
    }

    window.open(mapsUrl, '_blank');
    toast.info('Opening directions in maps app...');
  };

  // Share location
  const shareLocation = (facility: MedicalFacility) => {
    const shareData = {
      title: facility.name,
      text: `${facility.name} - ${facility.address}`,
      url: `https://www.google.com/maps/search/?api=1&query=${facility.lat},${facility.lng}`
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareData.url).then(() => {
        toast.success('Location link copied to clipboard');
      }).catch(() => {
        toast.error('Could not share location');
      });
    }
  };

  // Clear directions
  const clearDirections = () => {
    directionsRendererRef.current?.setDirections({ routes: [] } as any);
    setShowDirections(false);
  };

  // Filter facilities
  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         facility.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || facility.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Medical Facilities Locator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Find nearby hospitals, clinics, pharmacies, and other medical facilities.
            Get directions and contact information instantly.
          </p>
        </motion.div>

        {/* Search and Filter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search facilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Facility Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                {facilityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Travel Mode */}
            <div className="flex space-x-2">
              {[
                { mode: 'driving', icon: Car, label: 'Drive' },
                { mode: 'walking', icon: Footprints, label: 'Walk' },
                { mode: 'transit', icon: Bus, label: 'Transit' }
              ].map(({ mode, icon: Icon, label }) => (
                <motion.button
                  key={mode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTravelMode(mode as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
                    travelMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Facilities List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  Nearby Facilities ({filteredFacilities.length})
                </h2>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-6 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Searching for medical facilities...</p>
                  </div>
                ) : filteredFacilities.length === 0 ? (
                  <div className="p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No facilities found</p>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {filteredFacilities.map((facility) => (
                      <FacilityCard
                        key={facility.id}
                        facility={facility}
                        isSelected={selectedFacility?.id === facility.id}
                        onSelect={() => setSelectedFacility(facility)}
                        onGetDirections={() => getDirections(facility)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Navigation className="h-5 w-5 mr-2 text-blue-600" />
                  Map View
                </h2>

                {showDirections && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearDirections}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <Route className="h-4 w-4" />
                    <span>Clear Directions</span>
                  </motion.button>
                )}
              </div>

              <div
                ref={mapRef}
                className="w-full h-96 lg:h-[600px]"
                style={{ minHeight: '400px' }}
              />
            </div>
          </motion.div>
        </div>

        {/* Selected Facility Details */}
        <AnimatePresence>
          {selectedFacility && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 shadow-2xl z-50"
            >
              <FacilityDetails
                facility={selectedFacility}
                onClose={() => setSelectedFacility(null)}
                onGetDirections={() => getDirections(selectedFacility)}
                onOpenInMaps={() => openInMaps(selectedFacility)}
                onShare={() => shareLocation(selectedFacility)}
                travelMode={travelMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Facility Card Component
interface FacilityCardProps {
  facility: MedicalFacility;
  isSelected: boolean;
  onSelect: () => void;
  onGetDirections: () => void;
}

const FacilityCard: React.FC<FacilityCardProps> = ({
  facility,
  isSelected,
  onSelect,
  onGetDirections
}) => {
  const getTypeIcon = (type: MedicalFacility['type']) => {
    switch (type) {
      case 'hospital': return Building2;
      case 'clinic': return Stethoscope;
      case 'pharmacy': return Heart;
      case 'emergency': return Activity;
      case 'specialist': return Activity;
      default: return MapPin;
    }
  };

  const getTypeColor = (type: MedicalFacility['type']) => {
    switch (type) {
      case 'hospital': return 'text-red-600 bg-red-100';
      case 'clinic': return 'text-green-600 bg-green-100';
      case 'pharmacy': return 'text-purple-600 bg-purple-100';
      case 'emergency': return 'text-orange-600 bg-orange-100';
      case 'specialist': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const TypeIcon = getTypeIcon(facility.type);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`p-1.5 rounded-full ${getTypeColor(facility.type)}`}>
              <TypeIcon className="h-3 w-3" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {facility.name}
            </h3>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {facility.address}
          </p>

          <div className="flex items-center space-x-4 text-xs">
            {facility.distance && (
              <span className="text-blue-600 dark:text-blue-400">
                {facility.distance.toFixed(1)} km
              </span>
            )}

            {facility.rating && (
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span className="text-gray-600 dark:text-gray-400">
                  {facility.rating.toFixed(1)}
                </span>
              </div>
            )}

            {facility.isOpen !== undefined && (
              <span className={`px-2 py-1 rounded-full text-xs ${
                facility.isOpen
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {facility.isOpen ? 'Open' : 'Closed'}
              </span>
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onGetDirections();
          }}
          className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          title="Get directions"
        >
          <Navigation className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

// Facility Details Component
interface FacilityDetailsProps {
  facility: MedicalFacility;
  onClose: () => void;
  onGetDirections: () => void;
  travelMode: 'driving' | 'walking' | 'transit';
}

const FacilityDetails: React.FC<FacilityDetailsProps & {
  onOpenInMaps?: () => void;
  onShare?: () => void;
}> = ({
  facility,
  onClose,
  onGetDirections,
  travelMode,
  onOpenInMaps,
  onShare
}) => {
  const getTypeIcon = (type: MedicalFacility['type']) => {
    switch (type) {
      case 'hospital': return Building2;
      case 'clinic': return Stethoscope;
      case 'pharmacy': return Heart;
      case 'emergency': return Activity;
      case 'specialist': return Activity;
      default: return MapPin;
    }
  };

  const getTypeColor = (type: MedicalFacility['type']) => {
    switch (type) {
      case 'hospital': return 'text-red-600 bg-red-100';
      case 'clinic': return 'text-green-600 bg-green-100';
      case 'pharmacy': return 'text-purple-600 bg-purple-100';
      case 'emergency': return 'text-orange-600 bg-orange-100';
      case 'specialist': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const TypeIcon = getTypeIcon(facility.type);

  const handleCall = () => {
    if (facility.phone) {
      window.open(`tel:${facility.phone}`, '_self');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: facility.name,
          text: `Check out ${facility.name} - ${facility.address}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${facility.name} - ${facility.address}`);
      toast.success('Facility details copied to clipboard');
    }
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.name + ' ' + facility.address)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full ${getTypeColor(facility.type)}`}>
            <TypeIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {facility.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {facility.address}
            </p>
            <div className="flex items-center space-x-4 text-sm">
              {facility.distance && (
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {facility.distance.toFixed(1)} km away
                </span>
              )}

              {facility.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {facility.rating.toFixed(1)} rating
                  </span>
                </div>
              )}

              {facility.isOpen !== undefined && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  facility.isOpen
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {facility.isOpen ? 'Open Now' : 'Closed'}
                </span>
              )}
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="h-6 w-6" />
        </motion.button>
      </div>

      {/* Enhanced Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Primary Directions Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onGetDirections}
          className="flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <Route className="h-5 w-5" />
          <span className="font-medium">Directions</span>
        </motion.button>

        {/* Open in External Maps */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenInMaps || openInGoogleMaps}
          className="flex items-center justify-center space-x-2 py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
        >
          <ExternalLink className="h-5 w-5" />
          <span className="font-medium">Open Maps</span>
        </motion.button>

        {/* Call Button */}
        {facility.phone && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCall}
            className="flex items-center justify-center space-x-2 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <Phone className="h-5 w-5" />
            <span className="font-medium">Call</span>
          </motion.button>
        )}

        {/* Share Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShare || handleShare}
          className="flex items-center justify-center space-x-2 py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
        >
          <Share2 className="h-5 w-5" />
          <span className="font-medium">Share</span>
        </motion.button>
      </div>

      {/* Travel Mode Selector */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Travel Mode</h4>
        <div className="flex space-x-2">
          {[
            { mode: 'driving', icon: '🚗', label: 'Drive' },
            { mode: 'walking', icon: '🚶', label: 'Walk' },
            { mode: 'transit', icon: '🚌', label: 'Transit' }
          ].map(({ mode, icon, label }) => (
            <button
              key={mode}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                travelMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {facility.openingHours && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Opening Hours</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{facility.openingHours}</p>
        </div>
      )}
    </div>
  );
};

export default MedicalFacilitiesPage;