import { GroupProfile } from "./types.js";

import {
  ActionHash,
  AgentPubKey,
  AppClient,
  CreateLink,
  Delete,
  DeleteLink,
  EntryHash,
  Link,
  Record,
  SignedActionHashed,
} from "@holochain/client";
import { EntryRecord, isSignalFromCellWithRole, ZomeClient } from "@darksoil-studio/holochain-utils";

import { GroupProfileSignal } from "./types.js";

export class GroupProfileClient extends ZomeClient<GroupProfileSignal> {
  constructor(public client: AppClient, public roleName: string, public zomeName = "group_profile") {
    super(client, roleName, zomeName);
  }
  /** Group Profile */

  async createGroupProfile(groupProfile: GroupProfile): Promise<EntryRecord<GroupProfile>> {
    const record: Record = await this.callZome("create_group_profile", groupProfile);
    return new EntryRecord(record);
  }

  async getLatestGroupProfile(groupProfileHash: ActionHash): Promise<EntryRecord<GroupProfile> | undefined> {
    const record: Record = await this.callZome("get_latest_group_profile", groupProfileHash);
    return record ? new EntryRecord(record) : undefined;
  }

  async getOriginalGroupProfile(groupProfileHash: ActionHash): Promise<EntryRecord<GroupProfile> | undefined> {
    const record: Record = await this.callZome("get_original_group_profile", groupProfileHash);
    return record ? new EntryRecord(record) : undefined;
  }

  async getAllRevisionsForGroupProfile(groupProfileHash: ActionHash): Promise<Array<EntryRecord<GroupProfile>>> {
    const records: Record[] = await this.callZome("get_all_revisions_for_group_profile", groupProfileHash);
    return records.map(r => new EntryRecord(r));
  }

  async updateGroupProfile(
    originalGroupProfileHash: ActionHash,
    previousGroupProfileHash: ActionHash,
    updatedGroupProfile: GroupProfile,
  ): Promise<EntryRecord<GroupProfile>> {
    const record: Record = await this.callZome("update_group_profile", {
      original_group_profile_hash: originalGroupProfileHash,
      previous_group_profile_hash: previousGroupProfileHash,
      updated_group_profile: updatedGroupProfile,
    });
    return new EntryRecord(record);
  }

  deleteGroupProfile(originalGroupProfileHash: ActionHash): Promise<ActionHash> {
    return this.callZome("delete_group_profile", originalGroupProfileHash);
  }

  getAllDeletesForGroupProfile(
    originalGroupProfileHash: ActionHash,
  ): Promise<Array<SignedActionHashed<Delete>> | undefined> {
    return this.callZome("get_all_deletes_for_group_profile", originalGroupProfileHash);
  }

  getOldestDeleteForGroupProfile(
    originalGroupProfileHash: ActionHash,
  ): Promise<SignedActionHashed<Delete> | undefined> {
    return this.callZome("get_oldest_delete_for_group_profile", originalGroupProfileHash);
  }

  /** Group Profiles */

  async getGroupProfiles(): Promise<Array<Link>> {
    return this.callZome("get_group_profiles", undefined);
  }
}
