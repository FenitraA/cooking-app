export interface PaginationVariables {
    currentPage : number;
    perPage : number;
    totalPages : number;
}
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
}