import mapboxgl from 'mapbox-gl';

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

class MapService {
  private static instance: MapService;
  private styleLoaded: boolean = false;
  private mapStyle: any = null;
  private initializationPromise: Promise<void> | null = null;
  private token: string | null = null;
  private tokenSet: boolean = false;

  private constructor() {
    this.initializationPromise = Promise.resolve();
  }

  public static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  public setToken(token: string) {
    if (!token) return;
    
    this.token = token;
    mapboxgl.accessToken = token;
    this.tokenSet = true;
    
    // Initialize preloading when token is set
    if (!this.initializationPromise || this.initializationPromise === Promise.resolve()) {
      this.initializationPromise = this.preloadMapResources();
    }
    
    return this;
  }
  
  public hasToken(): boolean {
    return this.tokenSet && !!this.token;
  }

  private async preloadMapResources(): Promise<void> {
    if (!this.token) {
      return Promise.reject(new Error('Mapbox token not set'));
    }

    try {
      console.log('Preloading map resources...');
      
      // Preload map style
      const styleResponse = await fetch(
        `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${this.token}`
      );
      
      if (!styleResponse.ok) {
        throw new Error(`Failed to load map style: ${styleResponse.status} ${styleResponse.statusText}`);
      }
      
      this.mapStyle = await styleResponse.json();
      this.styleLoaded = true;

      // Preload sprites
      const sprites = [
        'https://api.mapbox.com/styles/v1/mapbox/streets-v12/sprite@2x.png',
        'https://api.mapbox.com/styles/v1/mapbox/streets-v12/sprite.png'
      ];
      
      await Promise.all(sprites.map(url => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(undefined);
          img.onerror = () => resolve(undefined); // Continue even if sprite fails
          img.src = url;
        });
      }));

      // Create temporary map to preload UAE tiles
      const tempContainer = document.createElement('div');
      tempContainer.style.width = '100px';
      tempContainer.style.height = '100px';
      tempContainer.style.position = 'absolute';
      tempContainer.style.visibility = 'hidden';
      document.body.appendChild(tempContainer);

      const map = new mapboxgl.Map({
        container: tempContainer,
        style: this.mapStyle || 'mapbox://styles/mapbox/streets-v12',
        bounds: [UAE_BOUNDS.west, UAE_BOUNDS.south, UAE_BOUNDS.east, UAE_BOUNDS.north],
        fadeDuration: 0,
        interactive: false,
        preserveDrawingBuffer: false,
      });

      // Add error handling for the preload map
      map.on('error', (e) => {
        console.error('Error in preload map:', e.error);
      });

      await new Promise<void>((resolve) => {
        map.once('load', () => {
          // Force load tiles for UAE region
          map.setZoom(8);
          setTimeout(() => {
            map.remove();
            document.body.removeChild(tempContainer);
            console.log('Preloading complete');
            resolve();
          }, 1000);
        });
        
        // Add timeout to avoid hanging
        setTimeout(() => {
          if (map) {
            try {
              map.remove();
              document.body.removeChild(tempContainer);
            } catch (e) {
              // Ignore errors during cleanup
            }
            console.log('Preloading timed out but continuing');
            resolve();
          }
        }, 5000);
      });

    } catch (error) {
      console.error('Error preloading map resources:', error);
      // Even if preloading fails, we should allow map creation
      this.styleLoaded = true;
      // Don't reject - we want the promise to resolve even on error
      return Promise.resolve();
    }
  }

  public async createMap(container: HTMLElement, options: Partial<mapboxgl.MapboxOptions> = {}): Promise<mapboxgl.Map> {
    if (!this.token) {
      throw new Error('Mapbox token not set');
    }

    try {
      // Ensure initialization is complete
      await this.waitForInitialization();
      
      const defaultOptions: mapboxgl.MapboxOptions = {
        container,
        style: this.styleLoaded ? this.mapStyle : 'mapbox://styles/mapbox/streets-v12',
        center: [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude],
        zoom: DEFAULT_CENTER.zoom,
        bounds: [UAE_BOUNDS.west, UAE_BOUNDS.south, UAE_BOUNDS.east, UAE_BOUNDS.north],
        fitBoundsOptions: { padding: 50 },
        maxZoom: 18,
        attributionControl: false,
        preserveDrawingBuffer: false,
        antialias: false,
        fadeDuration: 0,
        crossSourceCollisions: false,
      };

      return new mapboxgl.Map({
        ...defaultOptions,
        ...options,
      });
    } catch (error) {
      console.error('Error creating map:', error);
      throw error;
    }
  }

  public isStyleLoaded(): boolean {
    return this.styleLoaded;
  }

  public async waitForInitialization(): Promise<void> {
    try {
      // Start preloading if not already done and we have a token
      if ((!this.initializationPromise || this.initializationPromise === Promise.resolve()) && this.token) {
        this.initializationPromise = this.preloadMapResources();
      }
      
      return this.initializationPromise || Promise.resolve();
    } catch (e) {
      console.error('Error during initialization wait:', e);
      return Promise.resolve();
    }
  }
}

export const mapService = MapService.getInstance();
export { DEFAULT_CENTER, UAE_BOUNDS };
export default mapService; 
 