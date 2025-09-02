import { apiClient, API_ENDPOINTS } from "@/lib/api";
import type { ApiResponse } from "@/types";
import type { FareRule } from "@/lib/firebaseModels";

class FareRulesService {
  async list(): Promise<ApiResponse<FareRule[]>> {
    return apiClient.get(API_ENDPOINTS.FARE_RULES.BASE);
  }

  async get(id: string): Promise<ApiResponse<FareRule>> {
    return apiClient.get(`${API_ENDPOINTS.FARE_RULES.BASE}/${id}`);
  }

  async create(data: Partial<FareRule>): Promise<ApiResponse<FareRule>> {
    return apiClient.post(API_ENDPOINTS.FARE_RULES.BASE, data);
  }

  async update(id: string, data: Partial<FareRule>): Promise<ApiResponse<FareRule>> {
    return apiClient.put(`${API_ENDPOINTS.FARE_RULES.BASE}/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`${API_ENDPOINTS.FARE_RULES.BASE}/${id}`);
  }
}

export const fareRulesService = new FareRulesService();


