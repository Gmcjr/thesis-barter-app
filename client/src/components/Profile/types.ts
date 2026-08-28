import type { PostData } from '../Posts/ManagePosts';
import type { ReceivedReview } from '../Reviews/ReviewsDetailPanel';

export interface ProfileUser {
  id: number;
  name: string;
  email: string | null;
  bio: string | null;
  phone: string | null;
  zipCode: string | null;
  createdAt: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  emailVisible: boolean;
  tradeHistoryVisible: boolean;
}

export interface ProfileHeaderProps {
  profile: ProfileUser;
  isOwnProfile: boolean;
  onEditClick: () => void;
  onReport: () => void;
  onBlock: () => void;
  blocked: boolean;
  averageRating: number | null;
  totalReviews: number;
  totalTrades: number;
  onToggleReviews: () => void;
}

export interface ProfileUpdateData {
  name: string;
  bio: string;
  phone: string;
  zipCode: string;
  emailVisible: boolean;
  tradeHistoryVisible: boolean;
}

export interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  initialData: ProfileUpdateData;
  onSave: (data: ProfileUpdateData) => Promise<void>;
  avatarUrl: string | null;
  bannerUrl: string | null;
  avatarUploading: boolean;
  bannerUploading: boolean;
  onAvatarChange: (file: File) => Promise<void>;
  onAvatarRemove: () => Promise<void>;
  onBannerChange: (file: File) => Promise<void>;
  onBannerRemove: () => Promise<void>;
}

export interface ProfileTradesProps {
  posts: PostData[];
  isOwnProfile: boolean;
  onReport: (postId: number) => void;
}

export interface ProfileTabsProps {
  activeTab: 'current' | 'history' | 'offers';
  onTabChange: (tab: 'current' | 'history' | 'offers') => void;
  tradeCount: number;
  isOwnProfile: boolean;
  onDM: () => void;
  showTradeHistory: boolean;
}

export interface ReviewsSummary {
  reviews: ReceivedReview[];
  averageRating: number | null;
  totalReviews: number;
  totalTrades: number;
}

export interface TradeData {
  id: number;
  status: 'IN_PROGRESS' | 'WAITING_FOR_OTHER_USER' | 'COMPLETED' | 'CANCELLED';
  ownerId: number;
  requesterId: number;
  ownerCompl: boolean;
  reqCompl: boolean;
  createdAt: string;
  post: {
    id: number;
    title: string;
  };
  owner: {
    id: number;
    name: string | null;
  };
  requester: {
    id: number;
    name: string | null;
  };
}

export interface PendingTradeOffersProps {
  onTradeActivity: () => Promise<unknown>;
}

export interface NormalTradeOffer {
  id: number;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  requester: {
    id: number;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  post: {
    id: number;
    title: string;
    status: string;
    userId: number;
  };
}

export interface ArtTradeOfferData {
  id: number;
  message: string | null;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED';
  previewUrl?: string | null;
  fullUrl?: string | null;
  offerer: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  post: {
    id: number;
    title: string;
  };
}

export interface TradeOffersReceivedViewProps {
  onOfferAccepted: () => Promise<unknown>;
}
