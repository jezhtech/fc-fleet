import apiClient, { API_ENDPOINTS } from "@/lib/api";
import { ApiResponse, Application, NewApplication } from "@/types";

class ApplicationService {
    async createApplication(applicationData: NewApplication) {
        return apiClient.post<Application>(`${API_ENDPOINTS.APPLICATION.BASE}/new`, applicationData);
    }

    async getAllApplications(): Promise<ApiResponse<Application[]>> {
        return apiClient.get<Application[]>(`${API_ENDPOINTS.APPLICATION.BASE}/all`);
    }
}

export const applicationService = new ApplicationService();