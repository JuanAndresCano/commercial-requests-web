/** Shown wherever a request has no node: the node is optional (C-06). */
export const NO_NODE_LABEL = "Sin nodo";

/** A Select item cannot have an empty value, so "no node" travels as this sentinel inside the selects. */
export const NO_NODE_VALUE = "__none__";

/** Text to show for the node of a request (`null` when it has none). */
export function nodeLabel(node: string | null | undefined): string {
  return node?.trim() ? node : NO_NODE_LABEL;
}

/** Value a select shows for a node id (`null`/empty = no node). */
export function selectValueForNode(nodeId: string | null | undefined): string {
  return nodeId ? nodeId : NO_NODE_VALUE;
}

/** Node id a select value stands for: the sentinel (or empty) is no node. */
export function nodeIdFromSelectValue(value: string): string | null {
  return value && value !== NO_NODE_VALUE ? value : null;
}

/**
 * Body of PATCH /requests/:id/node for what the leader picked, or `null` when nothing changed.
 * An explicit `{ nodeId: null }` removes the node.
 */
export function nodePatchFor(
  currentNodeId: string | null | undefined,
  selectedValue: string,
): { nodeId: string | null } | null {
  const next = nodeIdFromSelectValue(selectedValue);
  return next === (currentNodeId || null) ? null : { nodeId: next };
}

export interface TeamSelection {
  nodeId: string | null;
  leaderId: string;
}

/**
 * The KAM picked another node (or none): the suggested leader of that node, when there is one, is
 * preselected like in the creation wizard; otherwise the leader stays as it was.
 */
export function applyNodeChange(
  current: TeamSelection,
  selectedValue: string,
  suggestedLeaderId: string | undefined,
): TeamSelection {
  return { nodeId: nodeIdFromSelectValue(selectedValue), leaderId: suggestedLeaderId ?? current.leaderId };
}

/** The KAM picked another leader: the node is left exactly as it is (never filled in, never changed). */
export function applyLeaderChange(current: TeamSelection, leaderId: string): TeamSelection {
  return { ...current, leaderId };
}
