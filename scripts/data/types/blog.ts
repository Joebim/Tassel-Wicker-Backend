export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: BlogAuthor;
  category: BlogCategory;
  tags: string[];
  published: boolean;
  featured: boolean;
  views: number;
  likes: number;
  comments: BlogComment[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface BlogAuthor {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export interface BlogComment {
  id: string;
  postId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  approved: boolean;
  createdAt: string;
  replies?: BlogComment[];
}

export interface BlogFilters {
  category?: string;
  tag?: string;
  author?: string;
  featured?: boolean;
  search?: string;
}
