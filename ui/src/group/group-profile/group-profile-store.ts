import { GroupProfile } from "./types.js";

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
} from "@darksoil-studio/holochain-signals";
import { EntryRecord, HashType, MemoHoloHashMap, retype, slice } from "@darksoil-studio/holochain-utils";

import { GroupProfileClient } from "./group-profile-client.js";

export class GroupProfileStore {
  constructor(public client: GroupProfileClient) {}
  /** Group Profile */

  groupProfiles = new MemoHoloHashMap((groupProfileHash: ActionHash) => ({
    latestVersion: latestVersionOfEntrySignal(this.client, () => this.client.getLatestGroupProfile(groupProfileHash)),
    original: immutableEntrySignal(() => this.client.getOriginalGroupProfile(groupProfileHash)),
    allRevisions: allRevisionsOfEntrySignal(
      this.client,
      () => this.client.getAllRevisionsForGroupProfile(groupProfileHash),
    ),
    deletes: deletesForEntrySignal(
      this.client,
      groupProfileHash,
      () => this.client.getAllDeletesForGroupProfile(groupProfileHash),
    ),
  }));

  /** Group Profiles */

  groupProfiles = pipe(
    collectionSignal(
      this.client,
      () => this.client.getGroupProfiles(),
      "GroupProfiles",
    ),
    groupProfiles => slice(this.groupProfiles, groupProfiles.map(l => l.target)),
  );
}
