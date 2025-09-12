import { Loader } from "@googlemaps/js-api-loader";

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
  zoom: 10,
};

interface GoogleMapsServiceOptions {
  apiKey: string;
  libraries?: string[];
}

// New Places API (New) interfaces
interface PlaceSearchRequest {
  textQuery?: string;
  locationBias?: {
    circle?: {
      center: { latitude: number; longitude: number };
      radius: number;
    };
    rectangle?: {
      low: { latitude: number; longitude: number };
      high: { latitude: number; longitude: number };
    };
  };
  locationRestriction?: {
    circle: {
      center: { latitude: number; longitude: number };
      radius: number;
    };
  };
  maxResultCount?: number;
  languageCode?: string;
  regionCode?: string;
}

interface PlaceDetailsRequest {
  placeId: string;
  fields?: string[];
  languageCode?: string;
  regionCode?: string;
}

interface PlaceResult {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  types: string[];
  businessStatus?: string;
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  openingHours?: {
    openNow: boolean;
    periods?: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
    weekdayDescriptions?: string[];
  };
}

class GoogleMapsService {
  private static instance: GoogleMapsService;
  private loader: Loader | null = null;
  private google: typeof google | null = null;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private apiKey: string = "";
  private baseUrl = "https://places.googleapis.com/v1";
  private loadedLibraries: string[] = [];
  private requestedLibraries: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  public async initialize(options: GoogleMapsServiceOptions): Promise<void> {
    const requiredLibraries = options.libraries || ["geometry"];
    
    // Add requested libraries to our set
    requiredLibraries.forEach(lib => this.requestedLibraries.add(lib));
    
    // If already initialized with the same API key, check if we have all required libraries
    if (this.isInitialized && this.apiKey === options.apiKey) {
      const hasAllLibraries = requiredLibraries.every(lib => this.loadedLibraries.includes(lib));
      if (hasAllLibraries) {
        return; // Already initialized with all required libraries
      }
      
      // If we need additional libraries, we can't reinitialize the loader
      // This is a limitation of the Google Maps Loader API
      console.warn("Google Maps already initialized. Cannot add additional libraries:", 
        requiredLibraries.filter(lib => !this.loadedLibraries.includes(lib)));
      console.warn("Please ensure all required libraries are loaded during the first initialization.");
      return;
    }

    // If we need to initialize with different API key or not initialized at all
    if (this.isInitialized && this.apiKey !== options.apiKey) {
      console.log("Reinitializing Google Maps with different API key");
      this.reset();
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.apiKey = options.apiKey;
    // Initialize with all requested libraries to avoid future conflicts
    const allLibraries = Array.from(this.requestedLibraries);
    this.initializationPromise = this.performInitialization({
      ...options,
      libraries: allLibraries
    });
    return this.initializationPromise;
  }

  private async performInitialization(
    options: GoogleMapsServiceOptions,
  ): Promise<void> {
    try {
      const libraries = options.libraries || ["geometry"];
      
      this.loader = new Loader({
        apiKey: options.apiKey,
        version: "weekly",
        libraries: libraries as any,
        language: "en",
        region: "AE", // UAE region
      });

      this.google = await this.loader.load();
      this.loadedLibraries = [...libraries];
      this.isInitialized = true;
    } catch (error) {
      console.error("Google Maps initialization error:", error);
      throw error;
    }
  }

  public async createMap(
    container: HTMLElement,
    options: Partial<google.maps.MapOptions> = {},
  ): Promise<google.maps.Map> {
    if (!this.google) {
      throw new Error("Google Maps not initialized");
    }

    const defaultOptions: google.maps.MapOptions = {
      center: { lat: DEFAULT_CENTER.latitude, lng: DEFAULT_CENTER.longitude },
      zoom: DEFAULT_CENTER.zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      gestureHandling: "cooperative",
      styles: this.getMapStyles(),
      restriction: {
        latLngBounds: {
          north: UAE_BOUNDS.north,
          south: UAE_BOUNDS.south,
          west: UAE_BOUNDS.west,
          east: UAE_BOUNDS.east,
        },
        strictBounds: false,
      },
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
    } = {},
  ): Promise<PlaceResult[]> {
    if (!this.isInitialized) {
      throw new Error("Google Maps not initialized");
    }

    try {
      const searchRequest: PlaceSearchRequest = {
        textQuery: query,
        maxResultCount: options.limit || 10,
        languageCode: "en",
        regionCode: "AE",
      };

      // Add location bias if provided
      if (options.location) {
        searchRequest.locationBias = {
          circle: {
            center: {
              latitude: options.location.lat(),
              longitude: options.location.lng(),
            },
            radius: options.radius || 50000,
          },
        };
      }

      // Note: Type filtering is not supported in the new Places API
      // The API will return all types of places based on the text query

      const response = await this.makePlacesApiRequest(
        "/places:searchText",
        searchRequest,
      );

      if (response.places) {
        return response.places.map((place) => this.transformPlaceResult(place));
      }

      return [];
    } catch (error) {
      console.error("Error searching places:", error);
      return [];
    }
  }

  public async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    if (!this.isInitialized) {
      throw new Error("Google Maps not initialized");
    }

    try {
      const fields = [
        "id",
        "displayName",
        "formattedAddress",
        "location",
        "types",
        "businessStatus",
        "photos",
        "rating",
        "userRatingCount",
        "priceLevel",
        "openingHours",
      ];

      const response = await this.makePlacesApiRequest(`/places/${placeId}`, {
        fields: fields.join(","),
        languageCode: "en",
        regionCode: "AE",
      });

      if (response) {
        return this.transformPlaceResult(response);
      }

      return null;
    } catch (error) {
      console.error("Error getting place details:", error);
      return null;
    }
  }

  public async searchNearbyPlaces(
    location: google.maps.LatLng,
    options: {
      radius?: number;
      types?: string[];
      limit?: number;
    } = {},
  ): Promise<PlaceResult[]> {
    if (!this.isInitialized) {
      throw new Error("Google Maps not initialized");
    }

    try {
      const searchRequest: PlaceSearchRequest = {
        locationRestriction: {
          circle: {
            center: {
              latitude: location.lat(),
              longitude: location.lng(),
            },
            radius: options.radius || 5000,
          },
        },
        maxResultCount: options.limit || 10,
        languageCode: "en",
        regionCode: "AE",
      };

      // Note: Type filtering is not supported in the new Places API
      // The API will return all types of places based on the location

      const response = await this.makePlacesApiRequest(
        "/places:searchNearby",
        searchRequest,
      );

      if (response.places) {
        return response.places.map((place) => this.transformPlaceResult(place));
      }

      return [];
    } catch (error) {
      console.error("Error searching nearby places:", error);
      return [];
    }
  }

  private async makePlacesApiRequest(
    endpoint: string,
    data?: any,
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": this.apiKey,
    };

    // Add field mask - required for all requests
    if (endpoint.includes("/places/")) {
      // For place details (GET request)
      headers["X-Goog-FieldMask"] = data?.fields || "*";
    } else {
      // For search requests (POST request) - specify which fields we want from the response
      // Using only the basic fields that are definitely available
      headers["X-Goog-FieldMask"] =
        "places.id,places.displayName,places.formattedAddress,places.location,places.types";
    }

    const requestOptions: RequestInit = {
      method: endpoint.includes("/places/") ? "GET" : "POST",
      headers,
    };

    // Add body for POST requests (search)
    if (requestOptions.method === "POST" && data) {
      requestOptions.body = JSON.stringify(data);
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Places API error response:", errorText);
      throw new Error(
        `Places API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return response.json();
  }

  private transformPlaceResult(place: any): PlaceResult {
    return {
      id: place.id || place.place_id,
      displayName: {
        text: place.displayName?.text || place.name || "",
        languageCode: place.displayName?.languageCode || "en",
      },
      formattedAddress: place.formattedAddress || place.formatted_address || "",
      location: place.location
        ? {
            latitude:
              place.location.latitude || place.geometry?.location?.lat(),
            longitude:
              place.location.longitude || place.geometry?.location?.lng(),
          }
        : undefined,
      types: place.types || [],
      businessStatus: place.businessStatus || place.business_status,
      photos: place.photos,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      priceLevel: place.priceLevel,
      openingHours: place.openingHours,
    };
  }

  public createMarker(
    position: google.maps.LatLngLiteral,
    options: Partial<google.maps.MarkerOptions> = {},
  ): google.maps.Marker {
    if (!this.google) {
      throw new Error("Google Maps not initialized");
    }

    const defaultOptions: google.maps.MarkerOptions = {
      position,
      animation: google.maps.Animation.DROP,
      optimized: true,
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
    } = {},
  ): Promise<google.maps.DirectionsResult | null> {
    if (!this.google) {
      throw new Error("Google Maps not initialized");
    }

    const directionsService = new this.google.maps.DirectionsService();

    return new Promise((resolve, _) => {
      const request: google.maps.DirectionsRequest = {
        origin,
        destination,
        travelMode: options.mode || google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        region: "ae",
      };

      if (options.avoid) {
        request.avoidHighways = options.avoid.includes(
          google.maps.TravelMode.DRIVING,
        );
        request.avoidTolls = options.avoid.includes(
          google.maps.TravelMode.DRIVING,
        );
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
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
      {
        featureType: "transit",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ];
  }

  public isReady(): boolean {
    return this.isInitialized && this.google !== null;
  }

  public hasLibrary(library: string): boolean {
    return this.loadedLibraries.includes(library);
  }

  public getLoadedLibraries(): string[] {
    return [...this.loadedLibraries];
  }

  public getGoogle(): typeof google | null {
    return this.google;
  }

  public reset(): void {
    this.isInitialized = false;
    this.initializationPromise = null;
    this.google = null;
    this.loader = null;
    this.loadedLibraries = [];
    this.requestedLibraries.clear();
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  }
}

export const googleMapsService = GoogleMapsService.getInstance();

// Export interfaces for use in other components
export type { PlaceResult, PlaceSearchRequest, PlaceDetailsRequest };
