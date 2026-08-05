export interface Match {
  brand: string;
  name: string;
  hex: string;
  delta: number;
}

export interface Paint {
  id: string;
  brand: string;
  name: string;
  hex: string;
  category?: string;
  matches: Match[];
}