import '@darksoil-studio/file-storage-zome/dist/elements/upload-files.js';
import {
	appClientContext,
	hashProperty,
	hashState,
	notifyError,
	onSubmit,
	wrapPathInSvg,
} from '@darksoil-studio/holochain-elements';
import '@darksoil-studio/holochain-elements/dist/elements/display-error.js';
import { SignalWatcher } from '@darksoil-studio/holochain-signals';
import { EntryRecord } from '@darksoil-studio/holochain-utils';
import '@darksoil-studio/profiles-provider/dist/elements/search-users.js';
import {
	ActionHash,
	AgentPubKey,
	AppClient,
	AppWebsocket,
	DnaHash,
	EntryHash,
	Record,
} from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { appStyles } from '../../../app-styles.js';
import { groupInvitesStoreContext } from '../../../lobby/group-invites/context.js';
import { GroupInvitesStore } from '../../../lobby/group-invites/group-invites-store.js';
import { groupProfileStoreContext } from '../context.js';
import { GroupProfileClient } from '../group-profile-client.js';
import { GroupProfileStore } from '../group-profile-store.js';
import { GroupProfile } from '../types.js';

/**
 * @element create-group-profile
 * @fires group-profile-created: detail will contain { groupProfileHash }
 */
@localized()
@customElement('create-group-profile')
export class CreateGroupProfile extends SignalWatcher(LitElement) {
	/**
	 * @internal
	 */
	@consume({ context: appClientContext, subscribe: true })
	appClient!: AppClient;

	@consume({ context: groupInvitesStoreContext })
	@property()
	groupInvitesStore!: GroupInvitesStore;

	/**
	 * @internal
	 */
	@state()
	committing = false;

	/**
	 * @internal
	 */
	@query('#create-form')
	form!: HTMLFormElement;

	async createGroupProfile(
		fields: Partial<GroupProfile>,
		members: AgentPubKey | Array<AgentPubKey>,
	) {
		const groupProfile: GroupProfile = {
			name: fields.name!,
			avatar_hash: fields.avatar_hash!,
		};

		try {
			this.committing = true;
			const info = await this.appClient.createCloneCell({
				modifiers: {
					network_seed: fields.name,
				},
				role_name: 'group',
			});

			const membersArray = Array.isArray(members)
				? members
				: members
					? [members]
					: [];

			await this.groupInvitesStore.client.createGroup(
				fields.name!,
				membersArray,
			);

			const groupProfileClient = new GroupProfileClient(
				this.appClient,
				info.clone_id,
			);

			// const record: EntryRecord<GroupProfile> =
			// 	await groupProfileClient.createGroupProfile(groupProfile);

			this.dispatchEvent(
				new CustomEvent('group-created', {
					composed: true,
					bubbles: true,
					detail: {
						// groupProfileHash: record.actionHash,
						networkSeed: fields.name,
					},
				}),
			);

			this.form.reset();
		} catch (e: unknown) {
			console.error(e);
			notifyError(msg('Error creating the group profile'));
		}
		this.committing = false;
	}

	render() {
		return html` <sl-card style="flex: 1;">
			<form
				id="create-form"
				class="column"
				style="flex: 1; gap: 16px;"
				${onSubmit(fields =>
					this.createGroupProfile(fields, fields['members']),
				)}
			>
				<span class="title">${msg('Create Group Profile')}</span>
				<sl-input name="name" .label=${msg('Name')} required></sl-input>
				<upload-files
					name="avatar_hash"
					one-file
					accepted-files="image/jpeg,image/png,image/gif"
					style="display: none"
				></upload-files>
				<search-users name="members" style="height: 300px"></search-users>

				<sl-button variant="primary" type="submit" .loading=${this.committing}
					>${msg('Create Group Profile')}</sl-button
				>
			</form>
		</sl-card>`;
	}

	static styles = appStyles;
}
