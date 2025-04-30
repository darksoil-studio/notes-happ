import { GroupProfile } from "./types.js";

import {
  ActionHash,
  AgentPubKey,
  AppClient,
  decodeHashFromBase64,
  Delete,
  EntryHash,
  fakeActionHash,
  fakeAgentPubKey,
  fakeDnaHash,
  fakeEntryHash,
  Link,
  NewEntryAction,
  Record,
  SignedActionHashed,
} from "@holochain/client";
import {
  AgentPubKeyMap,
  decodeEntry,
  entryState,
  fakeCreateAction,
  fakeDeleteEntry,
  fakeEntry,
  fakeRecord,
  fakeUpdateEntry,
  hash,
  HashType,
  HoloHashMap,
  pickBy,
  ZomeMock,
} from "@darksoil-studio/holochain-utils";
import { GroupProfileClient } from "./group-profile-client.js";

export class GroupProfileZomeMock extends ZomeMock implements AppClient {
  constructor(
    myPubKey?: AgentPubKey,
  ) {
    super("group_profile_test", "group_profile", "test-app", myPubKey);
  }
  /** Group Profile */
  groupProfiles = new HoloHashMap<ActionHash, {
    deletes: Array<SignedActionHashed<Delete>>;
    revisions: Array<Record>;
  }>();

  async create_group_profile(groupProfile: GroupProfile): Promise<Record> {
    const entryHash = hash(groupProfile, HashType.ENTRY);
    const record = await fakeRecord(await fakeCreateAction(entryHash), fakeEntry(groupProfile));

    this.groupProfiles.set(record.signed_action.hashed.hash, {
      deletes: [],
      revisions: [record],
    });

    return record;
  }

  async get_latest_group_profile(groupProfileHash: ActionHash): Promise<Record | undefined> {
    const groupProfile = this.groupProfiles.get(groupProfileHash);
    return groupProfile ? groupProfile.revisions[groupProfile.revisions.length - 1] : undefined;
  }

  async get_all_revisions_for_group_profile(groupProfileHash: ActionHash): Promise<Record[] | undefined> {
    const groupProfile = this.groupProfiles.get(groupProfileHash);
    return groupProfile ? groupProfile.revisions : undefined;
  }

  async get_original_group_profile(groupProfileHash: ActionHash): Promise<Record | undefined> {
    const groupProfile = this.groupProfiles.get(groupProfileHash);
    return groupProfile ? groupProfile.revisions[0] : undefined;
  }

  async get_all_deletes_for_group_profile(
    groupProfileHash: ActionHash,
  ): Promise<Array<SignedActionHashed<Delete>> | undefined> {
    const groupProfile = this.groupProfiles.get(groupProfileHash);
    return groupProfile ? groupProfile.deletes : undefined;
  }

  async get_oldest_delete_for_group_profile(
    groupProfileHash: ActionHash,
  ): Promise<SignedActionHashed<Delete> | undefined> {
    const groupProfile = this.groupProfiles.get(groupProfileHash);
    return groupProfile ? groupProfile.deletes[0] : undefined;
  }
  async delete_group_profile(original_group_profile_hash: ActionHash): Promise<ActionHash> {
    const record = await fakeRecord(await fakeDeleteEntry(original_group_profile_hash));

    this.groupProfiles.get(original_group_profile_hash).deletes.push(
      record.signed_action as SignedActionHashed<Delete>,
    );

    return record.signed_action.hashed.hash;
  }

  async update_group_profile(
    input: {
      original_group_profile_hash: ActionHash;
      previous_group_profile_hash: ActionHash;
      updated_group_profile: GroupProfile;
    },
  ): Promise<Record> {
    const record = await fakeRecord(
      await fakeUpdateEntry(
        input.previous_group_profile_hash,
        undefined,
        undefined,
        fakeEntry(input.updated_group_profile),
      ),
      fakeEntry(input.updated_group_profile),
    );

    this.groupProfiles.get(input.original_group_profile_hash).revisions.push(record);

    const groupProfile = input.updated_group_profile;

    return record;
  }

  async get_group_profiles(): Promise<Array<Link>> {
    const records: Record[] = Array.from(this.groupProfiles.values()).map(r => r.revisions[r.revisions.length - 1]);
    const base = await fakeEntryHash();
    return Promise.all(records.map(async record => ({
      base,
      target: record.signed_action.hashed.hash,
      author: record.signed_action.hashed.content.author,
      timestamp: record.signed_action.hashed.content.timestamp,
      zome_index: 0,
      link_type: 0,
      tag: new Uint8Array(),
      create_link_hash: await fakeActionHash(),
    })));
  }
}

export async function sampleGroupProfile(
  client: GroupProfileClient,
  partialGroupProfile: Partial<GroupProfile> = {},
): Promise<GroupProfile> {
  return {
    ...{
      name: "Lorem ipsum 2",
      avatar_hash: (await fakeEntryHash()),
    },
    ...partialGroupProfile,
  };
}
