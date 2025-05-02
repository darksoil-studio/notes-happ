import {
	EntryRecord,
	ZomeClient,
	isSignalFromCellWithRole,
} from '@darksoil-studio/holochain-utils';
import { PrivateEventSourcingClient } from '@darksoil-studio/private-event-sourcing-zome';
import {
	ActionHash,
	AgentPubKey,
	AppClient,
	CreateLink,
	Delete,
	DeleteLink,
	EntryHash,
	EntryHashB64,
	Link,
	Record,
	SignedActionHashed,
} from '@holochain/client';

import { NotesEvent, NotesSignal } from './types.js';

export class NotesClient extends PrivateEventSourcingClient<NotesEvent> {
	constructor(
		public client: AppClient,
		public roleName: string,
		public zomeName = 'notes',
	) {
		super(client, roleName, zomeName);
	}

	createNote(title: string, content: string) {
		return this.callZome('create_note', {
			title,
			content,
		});
	}

	updateNote(createNoteHash: EntryHashB64, title: string, content: string) {
		return this.callZome('create_note', {
			create_note_hash: createNoteHash,
			title,
			content,
		});
	}
}
