import { apiClient, API_ENDPOINTS } from "@/lib/api";
import type {
  ApiResponse,
  Vehicle,
  VehicleWithTransport,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleFilters,
} from "@/types";

// Vehicle Service Class
class VehicleService {
  /**
   * Get all vehicles with optional filtering
   */
  async getAllVehicles(
    filters?: VehicleFilters
  ): Promise<ApiResponse<VehicleWithTransport[]>> {
    return apiClient.get<VehicleWithTransport[]>(
      `${API_ENDPOINTS.VEHICLES.BASE}/all`,
      filters
    );
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(id: string): Promise<ApiResponse<VehicleWithTransport>> {
    return apiClient.get<VehicleWithTransport>(
      `${API_ENDPOINTS.VEHICLES.BASE}/${id}`
    );
  }

  /**
   * Create a new vehicle
   */
  async createVehicle(
    data: CreateVehicleRequest
  ): Promise<ApiResponse<Vehicle>> {
    return apiClient.post<Vehicle>(API_ENDPOINTS.VEHICLES.BASE, data);
  }

  /**
   * Update vehicle
   */
  async updateVehicle(
    id: string,
    data: UpdateVehicleRequest
  ): Promise<ApiResponse<Vehicle>> {
    return apiClient.put<Vehicle>(`${API_ENDPOINTS.VEHICLES.BASE}/${id}`, data);
  }

  /**
   * Delete vehicle
   */
  async deleteVehicle(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(
      `${API_ENDPOINTS.VEHICLES.BASE}/${id}`
    );
  }

  /**
   * Get vehicles by transport ID
   */
  async getVehiclesByTransport(
    transportId: string
  ): Promise<ApiResponse<Vehicle[]>> {
    return apiClient.get<Vehicle[]>(
      `${API_ENDPOINTS.VEHICLES.BY_TRANSPORT}/${transportId}`
    );
  }

  /**
   * Get available vehicles
   */
  async getAvailableVehicles(
    filters?: VehicleFilters
  ): Promise<ApiResponse<Vehicle[]>> {
    return apiClient.get<Vehicle[]>(API_ENDPOINTS.VEHICLES.AVAILABLE, filters);
  }

  /**
   * Get vehicle statistics
   */
  async getVehicleStats(): Promise<
    ApiResponse<{
      total: number;
      byTransport: Record<string, number>;
      averagePrice: number;
      totalCapacity: number;
    }>
  > {
    return apiClient.get(API_ENDPOINTS.VEHICLES.STATS);
  }

  /**
   * Calculate fare for a vehicle
   */
  calculateFare(
    vehicle: Vehicle,
    distanceKm: number,
    durationMinutes: number
  ): number {
    const baseFare = vehicle.basePrice;
    const distanceFare = vehicle.perKmPrice * distanceKm;
    const timeFare = vehicle.perMinPrice * durationMinutes;

    return baseFare + distanceFare + timeFare;
  }

  /**
   * Search vehicles by name or description
   */
  async searchVehicles(
    query: string,
    filters?: VehicleFilters
  ): Promise<ApiResponse<VehicleWithTransport[]>> {
    const searchFilters = { ...filters, search: query };
    return apiClient.get<VehicleWithTransport[]>(
      API_ENDPOINTS.VEHICLES.BASE,
      searchFilters
    );
  }

  /**
   * Get vehicles within price range
   */
  async getVehiclesByPriceRange(
    minPrice: number,
    maxPrice: number,
    filters?: VehicleFilters
  ): Promise<ApiResponse<VehicleWithTransport[]>> {
    const priceFilters = { ...filters, minPrice, maxPrice };
    return apiClient.get<VehicleWithTransport[]>(
      API_ENDPOINTS.VEHICLES.BASE,
      priceFilters
    );
  }

  /**
   * Get vehicles by capacity range
   */
  async getVehiclesByCapacity(
    minCapacity: number,
    maxCapacity: number,
    filters?: VehicleFilters
  ): Promise<ApiResponse<VehicleWithTransport[]>> {
    const capacityFilters = { ...filters, minCapacity, maxCapacity };
    return apiClient.get<VehicleWithTransport[]>(
      API_ENDPOINTS.VEHICLES.BASE,
      capacityFilters
    );
  }
}

// Export singleton instance
export const vehicleService = new VehicleService();
