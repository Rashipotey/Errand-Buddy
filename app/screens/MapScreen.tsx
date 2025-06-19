import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/Navigation';

const MAP_WIDTH = Dimensions.get('window').width;
const ORS_API_KEY = '5b3ce3597851110001cf6248315d0a46716a42d08f18a28274e41bdc'; 

export default function MapScreen({ route, navigation }: any) {
  type MapScreenRouteProp = RouteProp<RootStackParamList, 'Map'>;
  const { locations } = route.params;

  const mapRef = useRef<MapView | null>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [optimizedLocations, setOptimizedLocations] = useState<any[]>([]);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [markerColors, setMarkerColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Enable location services');
          return;
        }

        const userLocation = await Location.getCurrentPositionAsync({});
        const current = {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        };
        setCurrentLocation(current);
      } catch (error) {
        Alert.alert('Location error', 'Failed to get user location');
      }
    })();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      optimizeRoute();
    }
  }, [currentLocation]);

  const optimizeRoute = async () => {
    try {
      const response = await fetch("https://your-serverless-api.vercel.app/api/optimizeRoute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: currentLocation,
          locations,
        }),
      });

      const data = await response.json();
      if (!data.optimizedRoute) {
        Alert.alert('Error', 'Optimization failed');
        return;
      }

      setOptimizedLocations(data.optimizedRoute);
      generateMarkerColors(data.optimizedRoute);
      getRouteFromORS(data.optimizedRoute);
    } catch (err) {
      Alert.alert("Error", "Failed to optimize route");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRouteFromORS = async (orderedLocations: any[]) => {
    const coordinates = orderedLocations.map((loc: any) => [loc.longitude, loc.latitude]);

    try {
      const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
        method: 'POST',
        headers: {
          Authorization: ORS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coordinates }),
      });

      const data = await res.json();
      const polylineCoords = data.features[0].geometry.coordinates.map((p: any) => ({
        latitude: p[1],
        longitude: p[0],
      }));

      setRouteCoords(polylineCoords);
    } catch (error) {
      Alert.alert('Routing error', 'Failed to get path from ORS');
      console.error(error);
    }
  };

  const getRandomColor = (): string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const generateMarkerColors = (locs: any[]) => {
    const colors = locs.map(() => getRandomColor());
    setMarkerColors(colors);
  };

  if (loading || !currentLocation) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
        <Text>Optimizing route...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, marginTop: 20 }}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {optimizedLocations.map((coord: any, idx: number) => (
          <Marker
            key={idx}
            coordinate={coord}
            title={`Stop ${idx + 1}`}
            description={coord.display_name || ""}
            pinColor={markerColors[idx]}
          />
        ))}

        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeColor="blue" strokeWidth={4} />
        )}
      </MapView>

      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Modify Route</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: MAP_WIDTH,
    height: 500,
    marginTop: 10,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#129990',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
