import api from "./api";

export const searchAPI = {
  /**
   * Global search across all entities
   */
  search: async (query: string, entityTypes?: string[], page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({
        query,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (entityTypes && entityTypes.length > 0) {
        params.append("entityTypes", entityTypes.join(","));
      }

      const response = await api.get(`/api/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get search suggestions for autocomplete
   */
  getSuggestions: async (query: string, limit = 5) => {
    try {
      const response = await api.get("/api/search/suggestions", {
        params: { query, limit },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Search by specific entity type
   */
  searchByType: async (
    entityType: string,
    query: string,
    filters?: Record<string, any>,
    page = 1,
    limit = 20
  ) => {
    try {
      const params = new URLSearchParams({
        entityType,
        query,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters) {
        params.append("filters", JSON.stringify(filters));
      }

      const response = await api.get(`/api/search/type?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all searchable entity types
   */
  getEntityTypes: async () => {
    try {
      const response = await api.get("/api/search/entity-types");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
