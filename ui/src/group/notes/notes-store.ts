import {
	AsyncComputed,
	allRevisionsOfEntrySignal,
	collectionSignal,
	deletedLinksSignal,
	deletesForEntrySignal,
	immutableEntrySignal,
	latestVersionOfEntrySignal,
	liveLinksSignal,
	pipe,
} from '@darksoil-studio/holochain-signals';
import {
	EntryRecord,
	HashType,
	MemoHoloHashMap,
	retype,
	slice,
} from '@darksoil-studio/holochain-utils';
import {
	ActionHash,
	AgentPubKey,
	EntryHash,
	NewEntryAction,
	Record,
} from '@holochain/client';

import { NotesClient } from './notes-client.js';
import { Note } from './types.js';

export class NotesStore {
	constructor(public client: NotesClient) {}
	/** Note */

	notes = new MemoHoloHashMap((noteHash: ActionHash) => ({
		latestVersion: latestVersionOfEntrySignal(
			this.client,
			() => this.client.getLatestNote(noteHash),
			1000,
		),
		original: immutableEntrySignal(() => this.client.getOriginalNote(noteHash)),
		allRevisions: allRevisionsOfEntrySignal(this.client, () =>
			this.client.getAllRevisionsForNote(noteHash),
		),
		deletes: deletesForEntrySignal(this.client, noteHash, () =>
			this.client.getAllDeletesForNote(noteHash),
		),
	}));

	/** All Notes */

	allNotes = pipe(
		collectionSignal(
			this.client,
			() => this.client.getAllNotes(),
			'AllNotes',
			2000,
		),
		allNotes =>
			slice(
				this.notes,
				allNotes.map(l => l.target),
			),
	);
}
