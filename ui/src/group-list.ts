import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiInformationOutline } from '@mdi/js';
import { wrapPathInSvg } from '@darksoil-studio/holochain-elements';
import { SignalWatcher } from '@darksoil-studio/holochain-signals';
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { appStyles } from './app-styles';
import { groupInvitesStoreContext } from './lobby/group-invites/context';
import { GroupInvitesStore } from './lobby/group-invites/group-invites-store';

@localized()
@customElement('group-list')
export class GroupList extends SignalWatcher(LitElement) {
	@consume({ context: groupInvitesStoreContext })
	groupInvitesStore!: GroupInvitesStore;

	renderGroups(allGroups: Array<string>) {
		if (allGroups.length === 0) {
			return html` <div
				class="column placeholder center-content"
				style="gap: 8px; flex: 1"
			>
				<sl-icon
					.src=${wrapPathInSvg(mdiInformationOutline)}
					style="font-size: 64px;"
				></sl-icon>
				<span style="text-align: center">${msg('No groups found.')}</span>
			</div>`;
		}
		return html`
			<div class="column" style="gap: 8px">
				${allGroups.map(
					group =>
						html`<div
							class="row"
							@click=${() =>
								this.dispatchEvent(
									new CustomEvent('group-selected', {
										bubbles: true,
										composed: true,
										detail: {
											roleName: group,
										},
									}),
								)}
						>
							${group}
						</div>`,
				)}
			</div>
		`;
	}

	render() {
		const allGroups = this.groupInvitesStore.groupsImPartOf.get();
		switch (allGroups.status) {
			case 'pending':
				return html`<div
					style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;"
				>
					<sl-spinner style="font-size: 2rem;"></sl-spinner>
				</div>`;
			case 'error':
				return html`<display-error
					.headline=${msg('Error fetching the groups')}
					.error=${allGroups.error}
				></display-error>`;
			case 'completed':
				return this.renderGroups(Array.from(allGroups.value));
		}
	}

	static styles = appStyles;
}
