import { PrivateEventSourcingStore } from '@darksoil-studio/private-event-sourcing-zome';
import {
	ActionHash,
	AgentPubKey,
	CellInfo,
	ClonedCell,
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
	mapCompleted,
	pipe,
} from '@tnesh-stack/signals';
import {
	EntryRecord,
	HashType,
	MemoHoloHashMap,
	retype,
	slice,
} from '@tnesh-stack/utils';

import { lazyLoadAndPoll } from '../../utils.js';
import { GroupInvitesClient } from './group-invites-client.js';
import { GroupInvitesEvent } from './types.js';

export class GroupInvitesStore extends PrivateEventSourcingStore<GroupInvitesEvent> {
	constructor(public client: GroupInvitesClient) {
		super(client);
	}

	allGroups = mapCompleted(
		lazyLoadAndPoll(() => this.client.client.appInfo(), 1000),
		appInfo => {
			const cellInfo = appInfo?.cell_info['group'];
			if (!cellInfo) return [];

			return Object.values(cellInfo)
				.filter(cellInfo => !('provisioned' in cellInfo))
				.map(cellInfo => {
					const cloned: ClonedCell = (cellInfo as any).cloned;
					return cloned.dna_modifiers.network_seed;
				});
		},
	);
}
