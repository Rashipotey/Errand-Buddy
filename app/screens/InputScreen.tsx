import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {Alert,FlatList,Keyboard,KeyboardAvoidingView,Platform,StyleSheet,Text,TextInput,TouchableOpacity,View,} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { RootStackParamList } from '../types/Navigation';

type InputScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Input'>;

export default function InputScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [locations, setLocations] = useState<{ latitude: number; longitude: number; display_name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<InputScreenNavigationProp>();

  const searchPlaces = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json`, {
        headers: { 'User-Agent': 'ErrandBuddy/1.0 (youremail@example.com)' },
      });
      const data = await res.json();
      setResults(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to search locations. Please try again.');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLocation = (place: any) => {
    const coord = {
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
      display_name: place.display_name,
    };
    if (locations.some(loc => loc.display_name === coord.display_name)) {
      Alert.alert('Duplicate', 'This location is already added.');
      return;
    }
    setLocations(prev => [...prev, coord]);
    setQuery('');
    setResults([]);
    Keyboard.dismiss();
  };

  const removeLocation = (index: number) => {
    setLocations(prev => prev.filter((_, i) => i !== index));
  };

  const goToMap = () => {
    if (locations.length < 2) {
      Alert.alert('Add locations', 'Please add at least two locations to get the route.');
      return;
    }
    navigation.navigate('Map', { locations });
  };

  const renderLocationItem = ({ item, drag, isActive, getIndex }: RenderItemParams<{ latitude: number; longitude: number; display_name: string }>) => {
    return (
      <TouchableOpacity
        style={[
          styles.locationRow,
          { backgroundColor: isActive ? '#dbeafe' : 'transparent' },
        ]}
        onLongPress={drag}
      >
        <Text style={styles.locationItem}>{item.display_name}</Text>
        <TouchableOpacity onPress={() => {
          const index = getIndex();
          if (typeof index === 'number') {
            removeLocation(index);
          }
        }} style={styles.removeBtn}>
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search for a location"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={searchPlaces}
          style={styles.input}
          returnKeyType="search"
          editable={!loading}
        />
        <TouchableOpacity style={[styles.searchButton, loading && { opacity: 0.6 }]} onPress={searchPlaces} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Searching...' : 'Search'}</Text>
        </TouchableOpacity>
      </View>

      {results.length > 0 && (
        <View style={styles.listContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.place_id.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => addLocation(item)}>
                <Text style={styles.result}>{item.display_name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <Text style={styles.heading}>Selected Locations</Text>
      <View style={styles.listContainer}>
        <DraggableFlatList
          data={locations}
          keyExtractor={(item) => item.display_name}
          renderItem={renderLocationItem}
          onDragEnd={({ data }) => setLocations(data)}
        />
      </View>

      {locations.length >= 2 && (
        <TouchableOpacity style={styles.routeButton} onPress={goToMap}>
          <Text style={styles.buttonText}>Get Shortest Route</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 20,
    paddingTop: 30,
    width: 400,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  searchButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  routeButton: {
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 24,
    elevation: 7,
    shadowColor: '#1E40AF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 17,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  listContainer: {
    maxHeight: 180,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  result: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
    color: '#374151',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: 10,
  },
  locationItem: {
    flex: 1,
    color: '#1E40AF',
    fontWeight: '600',
  },
  removeBtn: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F87171',
    borderRadius: 8,
  },
  removeText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
