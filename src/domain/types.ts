export interface Match {
  /**
   * Id of the paint this equivalent stands for.
   *
   * An id rather than a brand/name pair: upstream carries the same name in
   * more than one range — Citadel's "Abaddon Black" exists as both an Air and
   * a Base paint, with different color — so a name no longer identifies a
   * paint and a lookup by name would land on whichever one happened to be
   * indexed last. Resolve through `getPaintIndex`.
   */
  id: string;
  /** CIE76 ΔE between the two colors. Lower is closer. */
  delta: number;
}

export interface Paint {
  id: string;
  brand: string;
  name: string;
  hex: string;
  /** Upstream's range name — "Base", "Model Air", "Warpaints Fanatic". */
  category?: string;
  /** Manufacturer product code, where upstream carries one. */
  code?: string;
  matches: Match[];
}
