export interface IPost {
  id?: string;
  text: string;
  image?: string | Blob | ArrayBuffer;
  video?: unknown;
}
