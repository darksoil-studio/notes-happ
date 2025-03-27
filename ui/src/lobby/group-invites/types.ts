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
} from '@holochain/client';
import { ActionCommittedSignal } from '@tnesh-stack/utils';

export type GroupInvitesSignal = ActionCommittedSignal<EntryTypes, LinkTypes>;

export type EntryTypes = never;

export type LinkTypes = string;

export type GroupInvitesEvent =
	| {
			type: 'GroupInvite';
			agents: AgentPubKey[];
			network_seed: String;
	  }
	| {
			type: 'AcceptedGroupInvite';
			group_invite_hash: EntryHash;
	  }
	| {
			type: 'RejectedGroupInvite';
			group_invite_hash: EntryHash;
	  };
