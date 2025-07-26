export interface User {
  id: string;
  name: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (name: string, password: string) => Promise<void>;
  signUp: (name: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (data: { name?: string; email?: string }) => Promise<User>;
  getToken: () => Promise<string | null>;
}

export interface SignInRequest {
  name: string;
  password: string;
}

export interface SignUpRequest {
  name: string;
  password: string;
}

export interface SignInResponse {
  user: User;
  token: string;
  isNewUser: boolean;
}

export interface SignUpResponse {
  user: User;
  token: string;
}