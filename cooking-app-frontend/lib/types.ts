import { CamelCasedPropertiesDeep } from "./case-types";

export interface PaginationVariablesApiResponse {
    currentPage : number;
    perPage : number;
    totalPages : number;
}

export type PaginationVariables =
  CamelCasedPropertiesDeep<PaginationVariablesApiResponse>;


export interface CloudinaryUploadResultApiResponse {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
}

export type CloudinaryUploadResult =
  CamelCasedPropertiesDeep<CloudinaryUploadResultApiResponse>;

