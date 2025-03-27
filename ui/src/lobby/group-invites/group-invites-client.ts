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

	async inviteAgentsToGroup(networkSeed: string, agents: AgentPubKey[]) {
		await this.callZome('invite_agents_to_group', {
			network_seed: networkSeed,
			agents,
		});
	}

	async acceptGroupInvite(groupInviteHash: EntryHash) {
		await this.callZome('accept_group_invite', groupInviteHash);
	}
}
