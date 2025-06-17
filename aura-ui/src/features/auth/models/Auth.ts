export interface LoginRequest{
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
  }
  
  export interface RegisterRequest {
    email: string;
    password: string;
    confirmPassword: string;
    displayName?: string; 
  }
  
  export interface RegisterResponse {
    success: boolean;
    message: string;
  }

  export interface UpdateUserRequest{
    id: number;
    email: string;
    password: string;
    displayName?: string;
  }
  