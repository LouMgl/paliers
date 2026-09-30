export interface View {
  render(): string | Promise<string>;
  /** Appelé après l'affichage (graphiques, écouteurs particuliers…) */
  after?(): void;
  click?(act: string, el: HTMLElement, ev: Event): void | Promise<void>;
  input?(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void;
  change?(el: HTMLInputElement | HTMLSelectElement, ev: Event): void | Promise<void>;
  /** Appelé quand on quitte l'onglet */
  leave?(): void;
}
