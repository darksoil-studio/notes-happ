import { PrivateEventSourcingStore } from '@darksoil-studio/private-event-sourcing-zome';
import {
	ActionHash,
	AgentPubKey,
	EntryHash,
	NewEntryAction,
	Record,
} from '@holochain/client';
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
} from '@tnesh-stack/signals';
import {
	EntryRecord,
	HashType,
	MemoHoloHashMap,
	retype,
	slice,
} from '@tnesh-stack/utils';

import { GroupInvitesClient } from './group-invites-client.js';
import { GroupInvitesEvent } from './types.js';

export class GroupInvitesStore extends PrivateEventSourcingStore<GroupInvitesEvent> {
	constructor(public client: GroupInvitesClient) {
		super(client);
	}
}
