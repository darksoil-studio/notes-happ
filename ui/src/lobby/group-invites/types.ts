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
			type: 'CreateGroup';
			members: AgentPubKey[];
			network_seed: string;
	  }
	| {
			type: 'GroupInvite';
			members: AgentPubKey[];
			network_seed: string;
	  }
	| {
			type: 'LeaveGroup';
			network_seed: string;
	  };
