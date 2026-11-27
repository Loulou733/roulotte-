//la machine à états des commandes  toutes les transitions autorisées sont ICI et nulle part ailleurs
//pour chaque statut la liste des statuts où on peut aller depuis lui
const TRANSITIONS: Record<string, string[]> = {
  RECEIVED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: [],
  CANCELLED: [],
};
//true si on a le droit de passer de "from" à "to"
export function canMove(from: string, to: string) {
  const allowed = TRANSITIONS[from] ?? [];
  return allowed.includes(to);
}
