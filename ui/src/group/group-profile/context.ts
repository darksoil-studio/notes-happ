import { createContext } from "@lit/context";
import { GroupProfileStore } from "./group-profile-store.js";

export const groupProfileStoreContext = createContext<GroupProfileStore>(
  "group_profile/store",
);
