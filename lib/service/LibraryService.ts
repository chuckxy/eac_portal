import { api, handleResponse, SPResponse } from './apiClient';

export type BookProvider = 'googleBooks' | 'openLibrary' | 'dBooks' | 'internetArchive' | 'libraryOfCongress';

export type SearchBy = 'title' | 'author' | 'isbn' | 'subject' | 'publisher';

export interface SearchParams {
    query: string;
    searchBy?: SearchBy;
    filterValue?: string;
    startIndex?: number;
    maxResults?: number;
    dateRange?: [Date, Date];
    mediaType?: string;
    allowDownload?: boolean;
    googleFilter?: string | null;
}

export interface LibraryCategory {
    id: number;
    categoryName: string;
    description?: string;
    createdAt?: string;
}

export interface Ebook {
    id: number;
    title: string;
    authors?: string;
    description?: string;
    isbn?: string;
    publisher?: string;
    publishedYear?: number;
    language?: string;
    pageCount?: number;
    categoryId?: number;
    categoryName?: string;
    tags?: string;
    coverUrl?: string;
    source: 'upload' | 'openlibrary' | 'archive';
    externalId?: string;
    externalUrl?: string;
    fileUrl?: string;
    filePublicId?: string;
    fileBytes?: number;
    fileFormat?: string;
    downloadCount?: number;
    isActive?: boolean;
    createdAt?: string;
}

export interface ExternalEbook {
    source: 'openlibrary' | 'archive' | 'googlebooks' | 'dbooks' | 'libraryofcongress';
    externalId: string;
    title: string;
    authors: string;
    description?: string;
    publishedYear?: number;
    publisher?: string;
    language?: string;
    pageCount?: number;
    isbn?: string;
    coverUrl?: string;
    externalUrl: string;
    fileUrl?: string;
    fileFormat?: string;
}

export interface ExternalSearchResponse {
    items: ExternalEbook[];
    total: number;
}

export interface EbookFilters {
    q?: string;
    category?: number;
    source?: string;
    author?: string;
    tag?: string;
}

export const LibraryService = {
    // Categories
    getCategories() {
        return handleResponse<LibraryCategory[]>(api.get('/library/categories'));
    },
    saveCategory(data: Partial<LibraryCategory>) {
        return handleResponse<SPResponse>(api.post('/library/categories', data));
    },
    deleteCategory(id: number) {
        return handleResponse<SPResponse>(api.delete(`/library/categories/${id}`));
    },

    // Ebooks
    getEbooks(filters: EbookFilters = {}) {
        return handleResponse<Ebook[]>(api.get('/library/ebooks', { params: filters }));
    },
    getEbook(id: number) {
        return handleResponse<Ebook>(api.get(`/library/ebooks/${id}`));
    },
    saveEbook(data: Partial<Ebook>) {
        return handleResponse<SPResponse>(api.post('/library/ebooks', data));
    },
    deleteEbook(id: number) {
        return handleResponse<SPResponse>(api.delete(`/library/ebooks/${id}`));
    },
    incrementDownload(id: number) {
        return handleResponse<SPResponse>(api.post(`/library/ebooks/${id}/download`, {}));
    },

    /**
     * Upload a new ebook with optional cover image. fileData/coverData must be
     * base64 data URIs (e.g. "data:application/pdf;base64,...").
     */
    upload(payload: Partial<Ebook> & { fileData: string; fileName: string; coverData?: string }) {
        return handleResponse<SPResponse & { fileUrl: string; coverUrl?: string }>(
            api.post('/library/upload', payload)
        );
    },

    // External
    searchExternal(provider: BookProvider, params: SearchParams) {
        const q: any = {
            provider,
            q: params.query,
            searchBy: params.searchBy,
            filterValue: params.filterValue,
            startIndex: params.startIndex ?? 0,
            maxResults: params.maxResults ?? 20,
            mediaType: params.mediaType,
            googleFilter: params.googleFilter || undefined,
            allowDownload: params.allowDownload || undefined
        };
        if (params.dateRange?.length === 2) {
            q.dateFrom = params.dateRange[0].toISOString().split('T')[0];
            q.dateTo = params.dateRange[1].toISOString().split('T')[0];
        }
        // Strip undefined
        Object.keys(q).forEach((k) => q[k] === undefined && delete q[k]);
        return handleResponse<ExternalSearchResponse>(api.get('/library/external/search', { params: q }));
    },
    importExternal(item: ExternalEbook & { categoryId?: number; tags?: string }) {
        return handleResponse<SPResponse>(api.post('/library/external/import', item));
    }
};
