import {
	PrivateEventSourcingStore,
	SignedEvent,
} from '@darksoil-studio/private-event-sourcing-zome';
import {
	ActionHash,
	AgentPubKey,
	AgentPubKeyB64,
	CellInfo,
	ClonedCell,
	EntryHash,
	EntryHashB64,
	NewEntryAction,
	decodeHashFromBase64,
	encodeHashToBase64,
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
	MemoMap,
	retype,
	slice,
} from '@tnesh-stack/utils';

import { effect, lazyLoadAndPoll } from '../../utils.js';
import { GroupInvitesClient } from './group-invites-client.js';
import { GroupInvitesEvent } from './types.js';

export class GroupInvitesStore extends PrivateEventSourcingStore<GroupInvitesEvent> {
	constructor(public client: GroupInvitesClient) {
		super(client);

		effect(() => {
			const allGroups = this.allGroupsCells.get();
			const groupsImPartOf = this.groupsImPartOf.get();
			if (allGroups.status !== 'completed') return;
			if (groupsImPartOf.status !== 'completed') return;

			for (const networkSeed of groupsImPartOf.value) {
				if (
					!allGroups.value.find(
						group => group.dna_modifiers.network_seed === networkSeed,
					)
				) {
					this.client.client.createCloneCell({
						role_name: 'group',
						modifiers: {
							network_seed: networkSeed,
						},
					});
				}
			}

			console.log(allGroups.value);

			// for (const group of allGroups.value) {
			// 	if (!groupsImPartOf.value.has(group.dna_modifiers.network_seed)) {
			// 		this.client.client.disableCloneCell({
			// 			clone_cell_id: group.clone_id,
			// 		});
			// 	}
			// }
		});
	}

	groupsImPartOf = new AsyncComputed(() => {
		const events = this.privateEvents.get();
		if (events.status !== 'completed') return events;
		// const createGroupEvents = this.createGroupEvents.get();
		// const incomingGroupInvites = this.incomingGroupInvites.get();
		// const leaveGroupEvents = this.leaveGroupEvents.get();
		// if (createGroupEvents.status !== 'completed') return createGroupEvents;
		// if (incomingGroupInvites.status !== 'completed')
		// 	return incomingGroupInvites;
		// if (leaveGroupEvents.status !== 'completed') return leaveGroupEvents;

		const groupsNetworkSeeds: Set<string> = new Set();

		const sortedEvents = Object.entries(events.value).sort(
			([_, e1], [_2, e2]) => e1.event.timestamp - e2.event.timestamp,
		);

		for (const [eventHash, event] of sortedEvents) {
			switch (event.event.content.type) {
				case 'CreateGroup':
					groupsNetworkSeeds.add(event.event.content.network_seed);
					break;
				case 'GroupInvite':
					groupsNetworkSeeds.add(event.event.content.network_seed);
					break;
				case 'LeaveGroup':
					groupsNetworkSeeds.delete(event.event.content.network_seed);
					break;
			}
		}

		return {
			status: 'completed',
			value: groupsNetworkSeeds,
		};
	});

	groupMembers = new MemoMap(
		(groupNetworkSeed: string) =>
			new AsyncComputed(() => {
				const events = this.privateEvents.get();
				if (events.status !== 'completed') return events;

				const sortedEvents = Object.entries(events.value).sort(
					([_, e1], [_2, e2]) => e1.event.timestamp - e2.event.timestamp,
				);

				const members: Set<AgentPubKeyB64> = new Set();
				for (const [eventHash, event] of sortedEvents) {
					if (event.event.content.network_seed !== groupNetworkSeed) {
						continue;
					}
					switch (event.event.content.type) {
						case 'CreateGroup':
							members.add(encodeHashToBase64(event.author));
							for (const member of event.event.content.members) {
								members.add(encodeHashToBase64(member));
							}
							break;
						case 'GroupInvite':
							for (const member of event.event.content.members) {
								members.add(encodeHashToBase64(member));
							}
							break;
						case 'LeaveGroup':
							members.delete(encodeHashToBase64(event.author));
							break;
					}
				}

				return {
					status: 'completed',
					value: Array.from(members).map(decodeHashFromBase64),
				};
			}),
	);

	// incomingGroupInvites = new AsyncComputed(() => {
	// 	const events = this.privateEvents.get();
	// 	if (events.status !== 'completed') return events;

	// 	const incomingGroupInvites: Record<
	// 		EntryHashB64,
	// 		SignedEvent<GroupInvitesEvent>
	// 	> = {};

	// 	for (const [eventHash, event] of Object.entries(events.value)) {
	// 		if (
	// 			event.event.content.type === 'GroupInvite' &&
	// 			encodeHashToBase64(event.author) !==
	// 				encodeHashToBase64(this.client.client.myPubKey)
	// 		) {
	// 			incomingGroupInvites[eventHash] = event;
	// 		}
	// 	}

	// 	return {
	// 		status: 'completed',
	// 		value: incomingGroupInvites,
	// 	};
	// });

	// createGroupEvents = new AsyncComputed(() => {
	// 	const events = this.privateEvents.get();
	// 	if (events.status !== 'completed') return events;

	// 	const createGroupEvents: Record<
	// 		EntryHashB64,
	// 		SignedEvent<GroupInvitesEvent>
	// 	> = {};

	// 	for (const [eventHash, event] of Object.entries(events.value)) {
	// 		if (event.event.content.type === 'CreateGroup') {
	// 			createGroupEvents[eventHash] = event;
	// 		}
	// 	}

	// 	return {
	// 		status: 'completed',
	// 		value: createGroupEvents,
	// 	};
	// });

	// leaveGroupEvents = new AsyncComputed(() => {
	// 	const events = this.privateEvents.get();
	// 	if (events.status !== 'completed') return events;

	// 	const leaveGroupEvents: Record<
	// 		EntryHashB64,
	// 		SignedEvent<GroupInvitesEvent>
	// 	> = {};

	// 	for (const [eventHash, event] of Object.entries(events.value)) {
	// 		if (event.event.content.type === 'LeaveGroup') {
	// 			leaveGroupEvents[eventHash] = event;
	// 		}
	// 	}

	// 	return {
	// 		status: 'completed',
	// 		value: leaveGroupEvents,
	// 	};
	// });

	allGroupsCells = mapCompleted(
		lazyLoadAndPoll(() => this.client.client.appInfo(), 1000),
		appInfo => {
			const cellInfo = appInfo?.cell_info['group'];
			if (!cellInfo) return [];

			return Object.values(cellInfo)
				.filter(cellInfo => !('provisioned' in cellInfo))
				.map(cellInfo => {
					const cloned: ClonedCell = (cellInfo as any).cloned;
					return cloned;
				})
				.sort();
		},
	);

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
				})
				.sort();
		},
	);
}
