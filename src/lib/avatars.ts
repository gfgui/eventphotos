export const avatarSets = ["casual", "discreet"] as const;
export type AvatarSet = (typeof avatarSets)[number];

const avatarsPerSet = 16;

/** Every reference of a set, in the format saved in Guest.avatar, such as "casual/12". */
export function avatarRefs(set: AvatarSet) {
  return Array.from({ length: avatarsPerSet }, (_, index) => `${set}/${index}`);
}

export function isAvatarRef(value: string) {
  return avatarSets.some((set) => avatarRefs(set).includes(value));
}
