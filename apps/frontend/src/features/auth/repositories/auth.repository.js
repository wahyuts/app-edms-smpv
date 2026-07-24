import {
  UserCredentialRepository,
  UserMetadataRepository,
  UserPersistenceRepository,
  UserRepository,
} from "@/features/user-management";

export { UserCredentialRepository, UserRepository };

export const AuthPersistenceRepository = {
  getMetadata: UserMetadataRepository.getById,
  runSeed: UserPersistenceRepository.runSeedMerge,
};

