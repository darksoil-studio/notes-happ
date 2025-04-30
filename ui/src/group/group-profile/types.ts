import {
  ActionHash,
  AgentPubKey,
  Create,
  CreateLink,
  Delete,
  DeleteLink,
  DnaHash,
  EntryHash,
  Record,
  SignedActionHashed,
  Update,
} from "@holochain/client";
import { ActionCommittedSignal } from "@darksoil-studio/holochain-utils";

export type GroupProfileSignal = ActionCommittedSignal<EntryTypes, LinkTypes>;

export type EntryTypes = { type: "GroupProfile" } & GroupProfile;

export type LinkTypes = string;

export interface GroupProfile {
  name: string;

  avatar_hash: EntryHash;
}
