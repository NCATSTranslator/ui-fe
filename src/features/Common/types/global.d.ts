
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

export interface Blocker {
  state: 'blocked' | 'proceeding' | 'unblocked';
  reset?: () => void;
  proceed?: () => void;
}

export interface PhraseItem {
  phrase: string;
  verb: string;
}

export type Timeout = ReturnType<typeof setTimeout>;