import { UserService } from "@/features/user-management";

const initialize = async () => {
  return UserService.initialize();
};

export const AuthSeedService = { initialize };

export default AuthSeedService;
