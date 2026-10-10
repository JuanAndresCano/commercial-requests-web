/**
 * Who the request goes to, as the wizard collects it. The product leader is mandatory and decides where the
 * request goes; the node is an optional, independent extra. Picking one never changes the other.
 */

export interface DirectoryLeader {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface DirectoryNode {
  id: string;
  name: string;
}

export interface LeaderOption {
  /** Empty when the option comes from the offline fallback list (it cannot be sent to the API). */
  id: string;
  name: string;
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function leaderFullName(leader: DirectoryLeader): string {
  return `${leader.firstName ?? ""} ${leader.lastName ?? ""}`.trim();
}

/** The leaders the KAM can pick: the directory's, or the fallback names when the directory is empty or missing. */
export function toLeaderOptions(leaders: DirectoryLeader[] | undefined, fallbackNames: string[]): LeaderOption[] {
  if (leaders && leaders.length > 0) {
    return leaders.map((leader) => ({ id: leader.id, name: leaderFullName(leader) || leader.email }));
  }
  return fallbackNames.map((name) => ({ id: "", name }));
}

/** The directory id of the chosen leader (matched by id, full name or e-mail), if the directory knows them. */
export function resolveProductLeaderId(chosen: string, leaders: DirectoryLeader[] | undefined): string | undefined {
  if (!chosen.trim()) return undefined;
  return leaders?.find(
    (leader) => leader.id === chosen || same(leaderFullName(leader), chosen) || same(leader.email, chosen),
  )?.id;
}

/** The catalogue id of the chosen node (matched by id or name), if there is a chosen node the catalogue knows. */
export function resolveNodeId(chosen: string, nodes: DirectoryNode[] | undefined): string | undefined {
  if (!chosen.trim()) return undefined;
  return nodes?.find((node) => node.id === chosen || same(node.name, chosen))?.id;
}

/** The leader's name for the summary: the directory name, the e-mail, or what was stored if it is not listed. */
export function leaderDisplayName(chosen: string, leaders: DirectoryLeader[] | undefined): string {
  const found = leaders?.find((leader) => leader.id === chosen);
  return found ? leaderFullName(found) || found.email : chosen;
}
