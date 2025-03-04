interface RevealStatic {
  configure: (options: {
    pdf?: {
      format?: string;
      landscape?: boolean;
      margin?: number;
    }
  }) => void;
}

interface Window {
  Reveal?: RevealStatic;
} 