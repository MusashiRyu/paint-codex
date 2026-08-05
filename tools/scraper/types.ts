// Intentional local copy of data shape for scraper tooling.
// The contract between scraper and app is the JSON file schema, not imports.

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