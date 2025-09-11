import { apiClient, API_ENDPOINTS } from "@/lib/api";
import type {
  ApiResponse,
  Transport,
  TransportWithVehicles,
  TransportStats,
  CreateTransportRequest,
  UpdateTransportRequest,
  TransportFilters,
} from "@/types";

// Transport Service Class
class TransportService {
  /**
   * Get all transports with optional filtering
   */
  async getAllTransports(
    filters?: TransportFilters,
  ): Promise<ApiResponse<TransportWithVehicles[]>> {
    return apiClient.get<TransportWithVehicles[]>(
      `${API_ENDPOINTS.TRANSPORTS.BASE}/all`,
      filters,
    );
  }

  /**
   * Get transport by ID
   */
  async getTransportById(id: string): Promise<ApiResponse<Transport>> {
    return apiClient.get<Transport>(`${API_ENDPOINTS.TRANSPORTS.BASE}/${id}`);
  }

  /**
   * Create a new transport
   */
  async createTransport(
    data: CreateTransportRequest,
  ): Promise<ApiResponse<Transport>> {
    return apiClient.post<Transport>(API_ENDPOINTS.TRANSPORTS.BASE, data);
  }

  /**
   * Update transport
   */
  async updateTransport(
    id: string,
    data: UpdateTransportRequest,
  ): Promise<ApiResponse<Transport>> {
    return apiClient.put<Transport>(
      `${API_ENDPOINTS.TRANSPORTS.BASE}/${id}`,
      data,
    );
  }

  /**
   * Delete transport
   */
  async deleteTransport(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(
      `${API_ENDPOINTS.TRANSPORTS.BASE}/${id}`,
    );
  }

  /**
   * Get transport with vehicles
   */
  async getTransportWithVehicles(
    id: string,
  ): Promise<ApiResponse<TransportWithVehicles>> {
    return apiClient.get<TransportWithVehicles>(
      `${API_ENDPOINTS.TRANSPORTS.WITH_VEHICLES}/${id}`,
    );
  }

  /**
   * Get transport statistics
   */
  async getTransportStats(): Promise<ApiResponse<TransportStats>> {
    return apiClient.get<TransportStats>(API_ENDPOINTS.TRANSPORTS.STATS);
  }

  /**
   * Search transports by name or description
   */
  async searchTransports(
    query: string,
    filters?: TransportFilters,
  ): Promise<ApiResponse<Transport[]>> {
    const searchFilters = { ...filters, search: query };
    return apiClient.get<Transport[]>(
      API_ENDPOINTS.TRANSPORTS.BASE,
      searchFilters,
    );
  }

  /**
   * Get transports with minimum vehicle count
   */
  async getTransportsWithMinVehicles(
    minCount: number,
  ): Promise<ApiResponse<Transport[]>> {
    return apiClient.get<Transport[]>(API_ENDPOINTS.TRANSPORTS.BASE, {
      minVehicleCount: minCount,
    });
  }

  /**
   * Get active transports only
   */
  async getActiveTransports(): Promise<ApiResponse<Transport[]>> {
    return apiClient.get<Transport[]>(API_ENDPOINTS.TRANSPORTS.BASE, {
      isActive: true,
    });
  }

  /**
   * Update transport order
   */
  async updateTransportOrder(
    transports: Array<{ id: string; order: number }>,
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put<{ message: string }>(
      `${API_ENDPOINTS.TRANSPORTS.BASE}/order`,
      { transports },
    );
  }

  /**
   * Toggle transport active status
   */
  async toggleTransportStatus(
    id: string,
    isActive: boolean,
  ): Promise<ApiResponse<Transport>> {
    return apiClient.patch<Transport>(
      `${API_ENDPOINTS.TRANSPORTS.BASE}/${id}/status`,
      { isActive },
    );
  }

  /**
   * Get transports by popularity (based on vehicle count)
   */
  async getTransportsByPopularity(
    limit?: number,
  ): Promise<ApiResponse<Transport[]>> {
    const params = limit
      ? { limit, sortBy: "vehicleCount", sortOrder: "desc" }
      : { sortBy: "vehicleCount", sortOrder: "desc" };
    return apiClient.get<Transport[]>(API_ENDPOINTS.TRANSPORTS.BASE, params);
  }
}

// Export singleton instance
export const transportService = new TransportService();
