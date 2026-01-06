
export interface SearchResult {
  title: string;
  url: string;
  description: string;
  source: string;
}

export const searchWebResources = async (query: string, limit: number = 5): Promise<SearchResult[]> => {
  // In a real environment, this would call a search API.
  // Returning empty array as no search API key is configured.
  console.warn("Web search requested but no search provider is configured.");
  return [];
};

export const fetchLatestResources = async (topic: string, type: string): Promise<SearchResult[]> => {
  return searchWebResources(`${topic} ${type}`, 5);
};
