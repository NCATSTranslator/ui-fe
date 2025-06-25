
export type CustomFile = {
  file: File;
  thumbnailURL: string;
}

export type FeedbackForm = {
  category: string;
  comments: string;
  steps: string;
  screenshots: CustomFile[];
  base64Screenshots: string[];
}

export type FormErrors = {
  category: boolean;
  comments: boolean;
  steps: boolean;
}
