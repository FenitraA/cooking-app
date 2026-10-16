import { CamelCasedPropertiesDeep } from "../case-types";

// API response
export type AppUserApiResponse = {
  id: string;
  username: string;
};

export type AppUser = CamelCasedPropertiesDeep<AppUserApiResponse>;

// API request: change username
export type AppUserUsernameChangeApiRequest = {
  id: string;
  new_username: string;
};

export type AppUserUsernameChange =
  CamelCasedPropertiesDeep<AppUserUsernameChangeApiRequest>;

// API request: change password
export type AppUserPasswordChangeApiRequest = {
  id: string;
  old_password: string;
  new_password: string;
};

export type AppUserPasswordChange =
  CamelCasedPropertiesDeep<AppUserPasswordChangeApiRequest>;
