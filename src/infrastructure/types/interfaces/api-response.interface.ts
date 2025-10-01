export interface ApiResponse<T = undefined> {
    ok: boolean;
    data?: T;
    message?: string;
}