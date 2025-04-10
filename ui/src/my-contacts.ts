import {
	FriendsStore,
	friendsStoreContext,
} from '@darksoil-studio/friends-zome';
import '@darksoil-studio/friends-zome/dist/elements/friend-request-qr-code.js';
import { FriendRequestQrCode } from '@darksoil-studio/friends-zome/dist/elements/friend-request-qr-code.js';
import '@darksoil-studio/friends-zome/dist/elements/friend-requests.js';
import '@darksoil-studio/friends-zome/dist/elements/manual-friend-request.js';
import '@darksoil-studio/friends-zome/dist/elements/my-friends.js';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import { SignalWatcher } from '@tnesh-stack/signals';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { appStyles } from './app-styles';

@localized()
@customElement('my-contacts')
export class MyContacts extends SignalWatcher(LitElement) {
	@consume({ context: friendsStoreContext })
	@property()
	friendsStore!: FriendsStore;

	render() {
		const pendingFriendRequests = this.friendsStore.pendingFriendRequests.get();
		const pendingFriendRequestsCount =
			pendingFriendRequests.status === 'completed'
				? Object.keys(pendingFriendRequests.value).length
				: 0;

		return html`
			<div class="column" style="align-items: center; flex: 1">
				<div class="column" style="gap: 16px; width: 600px">
					${pendingFriendRequestsCount > 0
						? html`
								<sl-card>
									<div class="column" style="gap: 16px; flex: 1">
										<span class="title">${msg('Contact Requests')}</span>
										<friend-requests> </friend-requests>
									</div>
								</sl-card>
							`
						: html``}
					<div class="row">
						<span style="flex: 1"> </span>
						<sl-button
							variant="primary"
							@click=${() =>
								this.shadowRoot!.querySelector('sl-dialog')!.show()}
							>${msg('Add Contact')}
						</sl-button>
						<sl-dialog .label=${msg('Add contact')} style="width: 700px">
							<friend-request-qr-code show-send-code-fallback>
							</friend-request-qr-code>
						</sl-dialog>
					</div>
					<sl-card>
						<div class="column" style="gap: 16px; flex: 1">
							<span class="title">${msg('Contacts')}</span>
							<my-friends> </my-friends>
						</div>
					</sl-card>
				</div>
			</div>
		`;
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
