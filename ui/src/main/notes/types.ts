import { ActionCommittedSignal } from '@darksoil-studio/holochain-utils';
import {
	ActionHash,
	AgentPubKey,
	Create,
	CreateLink,
	Delete,
	DeleteLink,
	DnaHash,
	EntryHash,
	EntryHashB64,
	Record,
	SignedActionHashed,
	Update,
} from '@holochain/client';

export type NotesSignal = ActionCommittedSignal<EntryTypes, LinkTypes>;

export type EntryTypes = never;

export type LinkTypes = string;

export type NotesEvent =
	| {
			type: 'CreateNote';
			title: string;
			content: string;
	  }
	| {
			type: 'UpdateNote';
			create_note_hash: EntryHashB64;
			title: string;
			content: string;
	  }
	| {
			type: 'ArchiveNote';
			create_note_hash: EntryHashB64;
	  }
	| { type: 'UnarchiveNote'; create_note_hash: EntryHashB64 }
	| {
			type: 'ShareNote';
			create_note_hash: EntryHashB64;
			agents: Array<AgentPubKey>;
	  }
	| {
			type: 'RemoveAgents';
			create_note_hash: EntryHashB64;
			agents: Array<AgentPubKey>;
	  };

export interface Note {
	title: string;
	content: string;
	collaborators: AgentPubKey[];
	lastModified: number;
	archived: boolean;
}
