export interface Post {
  id: string;
  url: string;
  author: string;
  authorName: string;
  categories: string[];
  subcategories: string[];
  published: string;
  mediaType: string;
  postType: string;
  likes: number;
  comments: number;
  caption: string;
  hashtags: string;
  desc: string;
  transcript: string;
  imageText: string;
  /** Instagram shortcode of our own copy at /v/<code>.mp4, when one was uploaded. */
  video?: string;
}

export interface PostsFile {
  dims: number;
  posts: Post[];
}
