// Jest CJS mock for meilisearch (ESM-only package)
// Only the client surface used in lib/search.ts is mocked.
const MeiliSearch = class MeiliSearch {
  constructor() {}
  index() {
    return {
      search: async () => ({ hits: [], estimatedTotalHits: 0, limit: 20, offset: 0 }),
      addDocuments: async () => ({ taskUid: 0 }),
      updateDocuments: async () => ({ taskUid: 0 }),
      deleteDocument: async () => ({ taskUid: 0 }),
    };
  }
};

module.exports = { MeiliSearch, Meilisearch: MeiliSearch };
