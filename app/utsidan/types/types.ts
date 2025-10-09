export interface HeaderProps {
  isLoading: boolean;
  onGetStarted: () => void;
}

export interface HuvudsektionProps {
  isLoading: boolean;
  onGetStarted: () => void;
}

export interface FunktionsKortProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  borderColor: string;
  animationDirection: "left" | "right";
}

export interface PrisKortProps {
  title: string;
  price: number;
  description: string;
  features: string[];
  recommended?: boolean;
  highlightColor: string;
  checkmarkColor: string;
}

export interface FordelarSektionProps {
  isLoading: boolean;
  onGetStarted: () => void;
}
