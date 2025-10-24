export interface ApiResponse<T = undefined> {
  data?: T;
  message?: string;
}
