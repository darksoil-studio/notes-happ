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
import { ActionCommittedSignal } from '@darksoil-studio/holochain-utils';

export type NotesSignal = ActionCommittedSignal<EntryTypes, LinkTypes>;

export type EntryTypes = { type: 'Note' } & Note;

export type LinkTypes = string;

export interface Note {
	title: string;

	content: string;

	images_hashes: EntryHash[];
}
