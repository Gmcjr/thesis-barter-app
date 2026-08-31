export interface CommentUser {
  id: number;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface CommentData {
  id: number;
  text: string;
  userId: number;
  createdAt: string;
  user: CommentUser;
}
