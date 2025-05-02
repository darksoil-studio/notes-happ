import {
	AsyncComputed,
	AsyncResult,
	allRevisionsOfEntrySignal,
	collectionSignal,
	deletedLinksSignal,
	deletesForEntrySignal,
	immutableEntrySignal,
	joinAsyncMap,
	latestVersionOfEntrySignal,
	liveLinksSignal,
	pipe,
} from '@darksoil-studio/holochain-signals';
import {
	EntryRecord,
	HashType,
	MemoHoloHashMap,
	mapValues,
	retype,
	slice,
} from '@darksoil-studio/holochain-utils';
import {
	PrivateEventSourcingStore,
	SignedEvent,
} from '@darksoil-studio/private-event-sourcing-zome';
import {
	ActionHash,
	AgentPubKey,
	EntryHash,
	EntryHashB64,
	NewEntryAction,
	decodeHashFromBase64,
	encodeHashToBase64,
} from '@holochain/client';

import { NotesClient } from './notes-client.js';
import { Note, NotesEvent } from './types.js';

export class NotesStore extends PrivateEventSourcingStore<NotesEvent> {
	constructor(public client: NotesClient) {
		super(client);
	}

	createNotesHashes = new AsyncComputed(() => {
		const events = this.privateEvents.get();
		if (events.status !== 'completed') return events;

		const result: EntryHashB64[] = Object.entries(events.value)
			.filter(([eventHash, event]) => event.event.content.type === 'CreateNote')
			.map(([eventHash, _]) => eventHash);

		return {
			status: 'completed',
			value: result,
		};
	});

	eventsForNote = new MemoHoloHashMap(
		(createNoteHash: EntryHash) =>
			new AsyncComputed(() => {
				const events = this.privateEvents.get();
				if (events.status !== 'completed') return events;

				const result: Record<EntryHashB64, SignedEvent<NotesEvent>> = {};

				for (const [eventHash, event] of Object.entries(events.value)) {
					if (event.event.content.type === 'CreateNote') continue;
					const thisCreateNoteHash = event.event.content.create_note_hash;

					if (encodeHashToBase64(createNoteHash) === thisCreateNoteHash) {
						result[eventHash] = event;
					}
				}

				return {
					status: 'completed',
					value: result,
				};
			}),
	);

	currentNote = new MemoHoloHashMap(
		(createNoteHash: EntryHash) =>
			new AsyncComputed(() => {
				const events = this.eventsForNote.get(createNoteHash).get();
				if (events.status !== 'completed') return events;

				const createEvent = events.value[encodeHashToBase64(createNoteHash)];

				if (createEvent.event.content.type !== 'CreateNote') {
					return {
						status: 'error',
						error: 'Requested createNoteHash was not for a CreateNote event',
					};
				}

				let note: Note = {
					title: createEvent.event.content.title,
					content: createEvent.event.content.content,
					collaborators: [createEvent.author],
					archived: false,
					lastModified: createEvent.event.timestamp,
				};
				const sortedEvents = Object.entries(events.value).sort(
					(e1, e2) => e1[1].event.timestamp - e2[1].event.timestamp,
				);

				for (const [eventHash, event] of sortedEvents) {
					note = apply(note, event);
				}

				return {
					status: 'completed' as const,
					value: note,
				};
			}),
	);

	allCurrentNotes = new AsyncComputed(() => {
		const notesHashes = this.createNotesHashes.get();
		if (notesHashes.status !== 'completed') return notesHashes;

		return joinAsyncMap(
			mapValues(
				slice(this.currentNote, notesHashes.value.map(decodeHashFromBase64)),
				v => v.get(),
			),
		);
	});
}

function apply(note: Note, event: SignedEvent<NotesEvent>): Note {
	switch (event.event.content.type) {
		case 'CreateNote':
			return note;
		case 'UpdateNote':
			note.title = event.event.content.title;
			note.content = event.event.content.content;
			note.lastModified = event.event.timestamp;
			return note;
		case 'ArchiveNote':
			note.archived = true;
			return note;
		case 'UnarchiveNote':
			note.archived = false;
			return note;
		case 'ShareNote':
			note.collaborators = note.collaborators.concat(
				event.event.content.agents,
			);
			return note;
		case 'RemoveAgents':
			const removedAgents = event.event.content.agents;
			note.collaborators = note.collaborators.filter(
				agent =>
					!removedAgents.find(
						a => encodeHashToBase64(a) === encodeHashToBase64(agent),
					),
			);
			return note;
	}
}
