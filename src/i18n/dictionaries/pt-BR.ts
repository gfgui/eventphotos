export const ptBR = {
  metadata: {
    title: "Fotos do evento",
    description: "Envie, curta e veja as fotos do evento.",
  },
  home: {
    title: "Fotos do evento",
    scanQrCode: "Escaneie o QR Code do evento para entrar.",
  },
  languageSwitcher: {
    label: "Idioma",
  },
};

/** pt-BR is the reference dictionary: every other language must have the same keys. */
export type Dictionary = typeof ptBR;
