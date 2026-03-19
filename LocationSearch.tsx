import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { Search, MapPin, Navigation, X, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface LocationResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
    town?: string;
    village?: string;
    county?: string;
  };
}

interface LocationSearchProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: { title: string; subtitle: string; lat: number; lng: number }) => void;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ visible, onClose, onSelectLocation }) => {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 2) {
        searchLocations(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const searchLocations = async (searchText: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&addressdetails=1&limit=10`
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return true; // iOS permission handled by info.plist
    }
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  };

  const handleGetCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required to get your current location.');
      return;
    }

    setUseCurrentLocation(true);
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Reverse geocode to get a nice name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          handleSelect(data);
        } catch (e) {
          // Fallback if API fails
          onSelectLocation({
            title: 'Current Location',
            subtitle: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            lat: latitude,
            lng: longitude,
          });
          onClose();
        }
      },
      (error) => {
        console.error(error);
        Alert.alert('Location Error', 'Unable to retrieve your location');
        setUseCurrentLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleSelect = (item: LocationResult) => {
    const addr = item.address || {};

    // Construct a nice title (City/Town/Village)
    const title = addr.city || addr.town || addr.village || addr.suburb || addr.county || item.display_name.split(',')[0];

    // Construct subtitle (Street, State, Country)
    const parts = [];
    if (addr.road) parts.push(addr.road);
    if (addr.state) parts.push(addr.state);
    if (addr.country) parts.push(addr.country);
    const subtitle = parts.join(', ') || item.display_name;

    onSelectLocation({
      title: title || item.display_name.split(',')[0],
      subtitle,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    });
    onClose();
  };

  const renderItem = ({ item }: { item: LocationResult }) => {
    const addr = item.address || {};
    const title = addr.city || addr.town || addr.village || addr.suburb || item.display_name.split(',')[0];
    const subtitle = item.display_name;

    return (
      <TouchableOpacity
        style={[styles.resultItem, { borderBottomColor: theme.border }]}
        onPress={() => handleSelect(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(128,128,128,0.1)' }]}>
          <MapPin size={20} color={theme.secondaryText} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.navBg }]}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Tag location</Text>
          <TouchableOpacity onPress={onClose} style={styles.doneButton}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, query ? styles.searchBarActive : null]}>
            <Search size={20} color="#6b7280" />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search locations"
              placeholderTextColor="#6b7280"
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={18} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results List */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id.toString()}
          renderItem={renderItem}
          ListHeaderComponent={
            <TouchableOpacity
              style={[styles.currentLocationItem, { borderBottomColor: theme.border }]}
              onPress={handleGetCurrentLocation}
              disabled={useCurrentLocation}
            >
              <View style={styles.currentLocationIcon}>
                {useCurrentLocation ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Navigation size={20} color="#3b82f6" />
                )}
              </View>
              <View style={styles.currentLocationText}>
                <Text style={styles.currentLocationTitle}>Use current location</Text>
              </View>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            ) : query.length > 2 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No places found</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: 4,
  },
  cancelText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneButton: {
    padding: 4,
  },
  doneText: {
    color: '#3b82f6',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchSection: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#374151',
    paddingBottom: 8,
    gap: 8,
  },
  searchBarActive: {
    borderBottomColor: '#3b82f6',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingBottom: 16,
  },
  currentLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59,130,246,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currentLocationText: {
    flex: 1,
  },
  currentLocationTitle: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

export default LocationSearch;