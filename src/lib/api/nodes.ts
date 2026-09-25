import { apiRequest } from "./client";

export interface Node {
  id: string;
  name: string;
  description: string | null;
}

export const nodesApi = {
  list: () => apiRequest<Node[]>("/nodes"),
};
