export interface Post {
  id: string;
  /** Date added to the site (YYYY-MM-DD); empty for posts from the original export. */
  added: string;
  /** Save order, higher = saved more recently. */
  order: number;
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
