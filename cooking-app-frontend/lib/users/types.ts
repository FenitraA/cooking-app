
export type AppUser = {
  id: string;
  username: string;
};

export type AppUserUsernameChange = {
  id: string;
  new_username: string;
};

export type AppUserPasswordChange = {
  id: string;
  old_password: string;
  new_password: string;
};
