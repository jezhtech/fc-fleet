import { Loader } from '@googlemaps/js-api-loader';

// UAE bounds for initial view
const UAE_BOUNDS = {
  north: 26.5,
  south: 22.0,
  west: 51.0,
  east: 56.5,
};

// Default center coordinates (Dubai)
const DEFAULT_CENTER = {
  longitude: 55.2708,
  latitude: 25.2048,
  zoom: 10
};

interface GoogleMapsServiceOptions {
  apiKey: string;
  libraries?: string[];
}

class GoogleMapsService {
  private static instance: GoogleMapsService;
  private loader: Loader | null = null;
  private google: typeof google | null = null;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private autocompleteService: google.maps.places.AutocompleteService | null = null;
  private apiKey: string = '';

  private constructor() {}

  public static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  public async initialize(options: GoogleMapsServiceOptions): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.apiKey = options.apiKey;
    this.initializationPromise = this.performInitialization(options);
    return this.initializationPromise;
  }

  private async performInitialization(options: GoogleMapsServiceOptions): Promise<void> {
    try {
      this.loader = new Loader({
        apiKey: options.apiKey,
        version: 'weekly',
        libraries: options.libraries || ['places', 'geometry'] as any,
        language: 'en',
        region: 'AE' // UAE region
      });

      this.google = await this.loader.load();
      
      // Initialize services
      this.autocompleteService = new this.google.maps.places.AutocompleteService();
      this.placesService = new this.google.maps.places.PlacesService(
        document.createElement('div')
      );
      
      console.log('✓ Google Maps initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('Google Maps initialization error:', error);
      throw error;
    }
  }

  public async createMap(
    container: HTMLElement, 
    options: Partial<google.maps.MapOptions> = {}
  ): Promise<google.maps.Map> {
    if (!this.google) {
      throw new Error('Google Maps not initialized');
    }

    const defaultOptions: google.maps.MapOptions = {
      center: { lat: DEFAULT_CENTER.latitude, lng: DEFAULT_CENTER.longitude },
      zoom: DEFAULT_CENTER.zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      gestureHandling: 'cooperative',
      styles: this.getMapStyles(),
      restriction: {
        latLngBounds: {
          north: UAE_BOUNDS.north,
          south: UAE_BOUNDS.south,
          west: UAE_BOUNDS.west,
          east: UAE_BOUNDS.east,
        },
        strictBounds: false
      }
    };

    return new this.google.maps.Map(container, {
      ...defaultOptions,
      ...options,
    });
  }

  public async searchPlaces(
    query: string,
    options: {
      location?: google.maps.LatLng;
      radius?: number;
      types?: string[];
      limit?: number;
    } = {}
  ): Promise<google.maps.places.PlaceResult[]> {
    if (!this.google) {
      throw new Error('Google Maps not initialized');
    }

    // For now, use the legacy API which is more reliable and well-documented
    // The new Places API (New) has different authentication and format requirements
    return this.fallbackSearchPlaces(query, options);
  }

  private async fallbackSearchPlaces(
    query: string,
    options: {
      location?: google.maps.LatLng;
      radius?: number;
      types?: string[];
      limit?: number;
    } = {}
  ): Promise<google.maps.places.PlaceResult[]> {
    if (!this.google || !this.autocompleteService) {
      return [];
    }

    return new Promise((resolve) => {
      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        componentRestrictions: { country: 'ae' },
        types: options.types || ['establishment', 'geocode'],
        language: 'en'
      };

      if (options.location) {
        request.location = options.location;
        request.radius = options.radius || 50000;
      }

      console.log('Searching with request:', request);
      this.autocompleteService!.getPlacePredictions(request, (predictions, status) => {
        console.log('Autocomplete response:', { predictions: predictions?.length, status });
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          this.getPlaceDetails(predictions.slice(0, options.limit || 10))
            .then(resolve)
            .catch((error) => {
              console.error('Error getting place details:', error);
              resolve([]);
            });
        } else {
          console.log('No predictions found for query:', query, 'Status:', status);
          resolve([]);
        }
      });
    });
  }

  private async getPlaceDetails(
    predictions: google.maps.places.AutocompletePrediction[]
  ): Promise<google.maps.places.PlaceResult[]> {
    if (!this.google || !this.placesService) {
      throw new Error('Google Maps not initialized');
    }

    const promises = predictions.map(prediction => {
      return new Promise<google.maps.places.PlaceResult>((resolve) => {
        const request: google.maps.places.PlaceDetailsRequest = {
          placeId: prediction.place_id,
          fields: ['name', 'formatted_address', 'geometry', 'place_id', 'types', 'business_status']
        };

        this.placesService!.getDetails(request, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            // Fallback to prediction data if details fail
            resolve({
              place_id: prediction.place_id,
              name: prediction.description,
              formatted_address: prediction.description,
              geometry: undefined
            } as google.maps.places.PlaceResult);
          }
        });
      });
    });

    return Promise.all(promises);
  }

  public createMarker(
    position: google.maps.LatLngLiteral,
    options: Partial<google.maps.MarkerOptions> = {}
  ): google.maps.Marker {
    if (!this.google) {
      throw new Error('Google Maps not initialized');
    }

    const defaultOptions: google.maps.MarkerOptions = {
      position,
      animation: google.maps.Animation.DROP,
      optimized: true
    };

    return new this.google.maps.Marker({
      ...defaultOptions,
      ...options,
    });
  }

  public async getDirections(
    origin: google.maps.LatLngLiteral,
    destination: google.maps.LatLngLiteral,
    options: {
      mode?: google.maps.TravelMode;
      avoid?: google.maps.TravelMode[];
    } = {}
  ): Promise<google.maps.DirectionsResult | null> {
    if (!this.google) {
      throw new Error('Google Maps not initialized');
    }

    const directionsService = new this.google.maps.DirectionsService();

    return new Promise((resolve, reject) => {
      const request: google.maps.DirectionsRequest = {
        origin,
        destination,
        travelMode: options.mode || google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        region: 'ae'
      };

      if (options.avoid) {
        request.avoidHighways = options.avoid.includes(google.maps.TravelMode.DRIVING);
        request.avoidTolls = options.avoid.includes(google.maps.TravelMode.DRIVING);
      }

      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          resolve(result);
        } else {
          resolve(null);
        }
      });
    });
  }

  private getMapStyles(): google.maps.MapTypeStyle[] {
    return [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ];
  }

  public isReady(): boolean {
    return this.isInitialized && this.google !== null;
  }

  public getGoogle(): typeof google | null {
    return this.google;
  }
}

export const googleMapsService = GoogleMapsService.getInstance(); 