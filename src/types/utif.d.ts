declare module "utif" {
  export interface UTIF_IFD {
    width: number;
    height: number;
    data: Uint8Array;
    [key: string]: unknown;
  }
  const UTIF: {
    decode(buffer: ArrayBuffer): UTIF_IFD[];
    decodeImage(buffer: ArrayBuffer, ifd: UTIF_IFD): void;
    toRGBA8(ifd: UTIF_IFD): Uint8Array;
  };
  export default UTIF;
}
