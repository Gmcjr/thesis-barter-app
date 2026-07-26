import type { PostData } from '../Posts/ManagePosts';

export interface ProfileUser {
  id: number;
  name: string;
  email: string;
  bio: string | null;
  phone: string | null;
  zipCode: string | null;
  createdAt: string;
}

export interface ProfileHeaderProps {
  profile: ProfileUser;
  isOwnProfile: boolean;
  onEditClick: () => void;
}

export interface ProfileUpdateData {
  name: string;
  bio: string;
  phone: string;
  zipCode: string;
}

export interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  initialData: ProfileUpdateData;
  onSave: (data: ProfileUpdateData) => Promise<void>;
}

export interface ProfileTradesProps {
  posts: PostData[];
  isOwnProfile: boolean;
  onReport: (postId: number) => void;
}

export interface ProfileTabsProps {
  activeTab: 'current' | 'history';
  onTabChange: (tab: 'current' | 'history') => void;
  tradeCount: number;
  isOwnProfile: boolean;
}
