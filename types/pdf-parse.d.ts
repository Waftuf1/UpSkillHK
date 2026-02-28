declare module 'pdf-parse' {
  interface PdfData {
    text: string;
    numpages: number;
    info?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }
  function pdfParse(dataBuffer: Buffer): Promise<PdfData>;
  export = pdfParse;
}
