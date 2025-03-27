import { Note } from "./types.js";

import { ActionHash, AgentPubKey, EntryHash, NewEntryAction, Record } from "@holochain/client";
import {
  allRevisionsOfEntrySignal,
  AsyncComputed,
  collectionSignal,
  deletedLinksSignal,
  deletesForEntrySignal,
  immutableEntrySignal,
  latestVersionOfEntrySignal,
  liveLinksSignal,
  pipe,
} from "@tnesh-stack/signals";
import { EntryRecord, HashType, MemoHoloHashMap, retype, slice } from "@tnesh-stack/utils";

import { NotesClient } from "./notes-client.js";

export class NotesStore {
  constructor(public client: NotesClient) {}
  /** Note */

  notes = new MemoHoloHashMap((noteHash: ActionHash) => ({
    latestVersion: latestVersionOfEntrySignal(this.client, () => this.client.getLatestNote(noteHash)),
    original: immutableEntrySignal(() => this.client.getOriginalNote(noteHash)),
    allRevisions: allRevisionsOfEntrySignal(this.client, () => this.client.getAllRevisionsForNote(noteHash)),
    deletes: deletesForEntrySignal(this.client, noteHash, () => this.client.getAllDeletesForNote(noteHash)),
  }));
}
