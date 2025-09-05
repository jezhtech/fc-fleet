import { apiClient, API_ENDPOINTS } from "@/lib/api";
import type { ApiResponse } from "@/types";
import type { Zone } from "@/types";

class ZonesService {
  async list(): Promise<ApiResponse<Zone[]>> {
    return apiClient.get(API_ENDPOINTS.ZONES.BASE);
  }

  async get(id: string): Promise<ApiResponse<Zone>> {
    return apiClient.get(`${API_ENDPOINTS.ZONES.BASE}/${id}`);
  }

  async create(data: Partial<Zone>): Promise<ApiResponse<Zone>> {
    return apiClient.post(API_ENDPOINTS.ZONES.BASE, data);
  }

  async update(id: string, data: Partial<Zone>): Promise<ApiResponse<Zone>> {
    return apiClient.put(`${API_ENDPOINTS.ZONES.BASE}/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`${API_ENDPOINTS.ZONES.BASE}/${id}`);
  }
}

export const zonesService = new ZonesService();
