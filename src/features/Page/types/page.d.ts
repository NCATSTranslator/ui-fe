export interface FAQSubArticle {
  title: string;
  link?: string;
  slug?: string;
}

export interface FAQArticle {
  title: string;
  link?: string;
  slug?: string;
  subArticles?: FAQSubArticle[];
}
