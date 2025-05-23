import { StorageType } from "@/contexts/storage-context";

export interface User {
  username: string;
  uid: string;
  email: string;
  image: string;
  hasPremium: boolean;
}

export interface ProfileTabProps {
  user: User;
  updateProfile: (field: keyof User, value: string | boolean) => void;
  handleGoogleLogin: () => void;
  togglePremium: () => void;
  usernameError: string | null;
  setUsernameError: (error: string | null) => void;
}

export interface DataStorageTabProps {
  storageType: string;
  openResetDialog: () => void;
  getCookieExpirationText: () => string;
}

export interface ResetDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: () => void;
}
