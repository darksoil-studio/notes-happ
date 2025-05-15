import { createContext } from "@lit/context";
import { NotesStore } from "./notes-store.js";

export const notesStoreContext = createContext<NotesStore>(
  "notes/store",
);
