import '@darksoil-studio/profiles-provider/dist/elements/profile-list-item.js';
import {
	AgentPubKey,
	AppClient,
	AppInfo,
	AppWebsocket,
	CellProvisioningStrategy,
	CellType,
	ClonedCell,
	decodeHashFromBase64,
	encodeHashToBase64,
} from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import {
	mdiCog,
	mdiInformationOutline,
	mdiPlus,
	mdiSettingsHelper,
} from '@mdi/js';
import { Routes, appClientContext, wrapPathInSvg } from '@tnesh-stack/elements';
import { SignalWatcher } from '@tnesh-stack/signals';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { appStyles } from './app-styles';
import './group/notes/elements/all-notes.js';
import './group/notes/elements/create-note.js';
import { NotesContext } from './group/notes/elements/notes-context';
import { groupInvitesStoreContext } from './lobby/group-invites/context';
import { GroupInvitesStore } from './lobby/group-invites/group-invites-store';

@localized()
@customElement('group-members')
export class GroupMembers extends SignalWatcher(LitElement) {
	@property()
	networkSeed!: string;

	@consume({ context: groupInvitesStoreContext })
	groupInvitesStore!: GroupInvitesStore;

	renderList(hashes: Array<AgentPubKey>) {
		if (hashes.length === 0) {
			return html` <div
				class="column placeholder center-content"
				style="gap: 8px; flex: 1"
			>
				<sl-icon
					.src=${wrapPathInSvg(mdiInformationOutline)}
					style="font-size: 64px;"
				></sl-icon>
				<span style="text-align: center"
					>${msg('This group has no members.')}</span
				>
			</div>`;
		}

		return html`
			<div class="column" style="gap: 8px; flex: 1">
				${hashes.map(
					hash =>
						html`<profile-list-item .agentPubKey=${hash}></profile-list-item>`,
				)}
			</div>
		`;
	}

	render() {
		const members = this.groupInvitesStore.groupMembers
			.get(this.networkSeed)
			.get();

		switch (members.status) {
			case 'pending':
				return html`<div
					style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
				>
					<sl-spinner style="font-size: 2rem;"></sl-spinner>
				</div>`;
			case 'error':
				return html`<display-error
					.headline=${msg('Error fetching the notes')}
					.error=${members.error}
				></display-error>`;
			case 'completed':
				return this.renderList(members.value);
		}
	}

	static styles = [
		css`
			:host {
				display: flex;
			}
		`,
		appStyles,
	];
}
