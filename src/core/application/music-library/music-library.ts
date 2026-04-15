import * as Core from '@/core';
import { AppError, HttpMethod, HttpStatusCode } from '@/libs';

export class MusicLibraryApplication {
  private constructor() {}

  static async getOrFetchMusicLibrary(pubky: Core.Pubky): Promise<Core.MusicLibraryDocument | null> {
    const cachedDocument = Core.LocalMusicLibraryCacheService.read(pubky);
    if (cachedDocument) {
      return cachedDocument;
    }

    return await this.fetchFromHomeserver(pubky);
  }

  static async fetchFromHomeserver(pubky: Core.Pubky): Promise<Core.MusicLibraryDocument | null> {
    const url = Core.MusicLibraryNormalizer.buildUrl(pubky);

    try {
      const documentJson = await Core.HomeserverService.request<Core.MusicLibraryDocumentInput>({
        method: HttpMethod.GET,
        url,
      });

      if (!documentJson) {
        return null;
      }

      const document = Core.MusicLibraryNormalizer.fromDocument(documentJson);
      Core.LocalMusicLibraryCacheService.write({ pubky, document });
      return document;
    } catch (error) {
      if (error instanceof AppError && error.context?.statusCode === HttpStatusCode.NOT_FOUND) {
        return null;
      }

      throw error;
    }
  }

  static async commitUpdateMusicLibrary({
    pubky,
    document,
  }: {
    pubky: Core.Pubky;
    document: Core.MusicLibraryDocument;
  }): Promise<Core.MusicLibraryDocument> {
    const normalized = Core.MusicLibraryNormalizer.to(document, pubky);

    await Core.HomeserverService.request({
      method: HttpMethod.PUT,
      url: normalized.meta.url,
      bodyJson: normalized.document as unknown as Record<string, unknown>,
    });

    Core.LocalMusicLibraryCacheService.write({ pubky, document: normalized.document });

    return normalized.document;
  }

  static getMusicLibraryDraft(pubky: Core.Pubky): Core.MusicLibraryDraft | null {
    return Core.LocalMusicLibraryCacheService.readDraft(pubky);
  }

  static saveDraft({ pubky, draft }: { pubky: Core.Pubky; draft: Core.MusicLibraryDraft }): Core.MusicLibraryDraft {
    const sanitizedDraft = Core.MusicLibraryNormalizer.sanitizeDraft(draft);
    Core.LocalMusicLibraryCacheService.writeDraft({ pubky, draft: sanitizedDraft });
    return sanitizedDraft;
  }

  static clearDraft(pubky: Core.Pubky): void {
    Core.LocalMusicLibraryCacheService.clearDraft(pubky);
  }
}
