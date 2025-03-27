import { createContext } from "@lit/context";
import { GroupInvitesStore } from "./group-invites-store.js";

export const groupInvitesStoreContext = createContext<GroupInvitesStore>(
  "group_invites/store",
);
