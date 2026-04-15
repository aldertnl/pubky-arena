export interface TMusicLibraryAlbumCoverParams {
  artist: string;
  album?: string;
}

export interface TMusicLibraryAlbumCoverResult {
  imageUrl: string | null;
}
