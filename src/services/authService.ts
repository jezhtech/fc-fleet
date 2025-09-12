import { apiClient, API_ENDPOINTS } from "@/lib/api";
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UserProfile,
} from "@/types";

// Auth Service Class
class AuthService {
  /**
   * User login
   */
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        data
      );

      if (response.success && response.data?.token) {
        // Store tokens in localStorage
        this.storeTokens(response.data.token, response.data.refreshToken);
        // Store user data
        this.storeUserData(response.data.user);
      }

      return response;
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Login failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * User registration
   */
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        data
      );

      if (response.success && response.data?.token) {
        // Store tokens in localStorage
        this.storeTokens(response.data.token, response.data.refreshToken);
        // Store user data
        this.storeUserData(response.data.user);
      }

      return response;
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: "Registration failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * User logout
   */
  async logout(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<{ message: string }>(
        API_ENDPOINTS.AUTH.LOGOUT
      );

      // Clear stored data regardless of response
      this.clearStoredData();

      return response;
    } catch (error) {
      console.error("Logout error:", error);
      // Clear stored data even if logout fails
      this.clearStoredData();

      return {
        success: false,
        message: "Logout failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<
    ApiResponse<{ token: string; refreshToken: string }>
  > {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await apiClient.post<{
        token: string;
        refreshToken: string;
      }>(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });

      if (response.success && response.data) {
        // Update stored tokens
        this.storeTokens(response.data.token, response.data.refreshToken);
      }

      return response;
    } catch (error) {
      console.error("Token refresh error:", error);
      // Clear stored data if refresh fails
      this.clearStoredData();

      return {
        success: false,
        message: "Token refresh failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(
    data: VerifyEmailRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(API_ENDPOINTS.AUTH.VERIFY, data);
  }

  /**
   * Forgot password
   */
  async forgotPassword(
    data: ForgotPasswordRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>("/auth/forgot-password", data);
  }

  /**
   * Reset password
   */
  async resetPassword(
    data: ResetPasswordRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>("/auth/reset-password", data);
  }

  /**
   * Change password
   */
  async changePassword(
    data: ChangePasswordRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>("/auth/change-password", data);
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>(API_ENDPOINTS.USERS.PROFILE);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    data: Partial<UserProfile>
  ): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.put<UserProfile>(
      API_ENDPOINTS.USERS.UPDATE,
      data
    );

    if (response.success && response.data) {
      // Update stored user data
      this.storeUserData(response.data);
    }

    return response;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token;
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("authToken") ||
        localStorage.getItem("firebaseToken")
      );
    }
    return null;
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refreshToken");
    }
    return null;
  }

  /**
   * Get stored user data
   */
  getUserData(): UserProfile | null {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("authToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Update API client token
      apiClient.setAuthToken(accessToken);
    }
  }

  /**
   * Store user data in localStorage
   */
  private storeUserData(user: UserProfile): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("userData", JSON.stringify(user));
    }
  }

  /**
   * Clear all stored authentication data
   */
  private clearStoredData(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("firebaseToken");

      // Clear API client token
      apiClient.setAuthToken(null);
    }
  }

  /**
   * Check if user exists by phone number
   */
  async checkUserExists(phone: string): Promise<ApiResponse<{ exists: boolean }>> {
    try {
      const response = await apiClient.post<{ exists: boolean }>(
        "/auth/check",
        { phone }
      );
      return response;
    } catch (error) {
      console.error("Check user exists error:", error);
      return {
        success: false,
        message: "Failed to check user",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(phone: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<{ message: string }>(
        "/auth/send-otp",
        { phone }
      );
      return response;
    } catch (error) {
      console.error("Send OTP error:", error);
      return {
        success: false,
        message: "Failed to send OTP",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Verify OTP for login
   */
  async verifyOTP(phone: string, otp: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/verify-otp",
        { phone, otp }
      );

      if (response.success && response.data?.token) {
        // Store tokens in localStorage
        this.storeTokens(response.data.token, response.data.refreshToken);
        // Store user data
        this.storeUserData(response.data.user);
      }

      return response;
    } catch (error) {
      console.error("Verify OTP error:", error);
      return {
        success: false,
        message: "Failed to verify OTP",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Register with OTP
   */
  async registerWithOTP(data: {
    phone: string;
    otp: string;
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/register-otp",
        data
      );

      if (response.success && response.data?.token) {
        // Store tokens in localStorage
        this.storeTokens(response.data.token, response.data.refreshToken);
        // Store user data
        this.storeUserData(response.data.user);
      }

      return response;
    } catch (error) {
      console.error("Register with OTP error:", error);
      return {
        success: false,
        message: "Registration failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Initialize authentication state
   */
  initializeAuth(): void {
    const token = this.getAccessToken();
    if (token) {
      apiClient.setAuthToken(token);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export types
export type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UserProfile,
};
