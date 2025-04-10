import { PrivateEventSourcingClient } from '@darksoil-studio/private-event-sourcing-zome';
import {
	ActionHash,
	AgentPubKey,
	AppClient,
	CreateLink,
	Delete,
	DeleteLink,
	EntryHash,
	Link,
	Record,
	SignedActionHashed,
} from '@holochain/client';
import {
	EntryRecord,
	ZomeClient,
	isSignalFromCellWithRole,
} from '@tnesh-stack/utils';

import { GroupInvitesEvent, GroupInvitesSignal } from './types.js';

export class GroupInvitesClient extends PrivateEventSourcingClient<GroupInvitesEvent> {
	constructor(
		public client: AppClient,
		public roleName: string,
		public zomeName = 'group_invites',
	) {
		super(client, roleName, zomeName);
	}

	async createGroup(networkSeed: string, members: AgentPubKey[]) {
		await this.callZome('create_group', {
			network_seed: networkSeed,
			members,
		});
	}

	async inviteAgentsToGroup(networkSeed: string, members: AgentPubKey[]) {
		await this.callZome('invite_agents_to_group', {
			network_seed: networkSeed,
			members,
		});
	}

	async leaveGroup(groupNetworkSeed: string) {
		await this.callZome('leave_group', groupNetworkSeed);
	}
}
