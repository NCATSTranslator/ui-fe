export interface HelpSubArticle {
  title: string;
  link?: string;
  slug?: string;
}

export interface HelpArticle {
  title: string;
  link?: string;
  slug?: string;
  subArticles?: HelpSubArticle[];
}
