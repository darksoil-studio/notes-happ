import {
	Router,
	Routes,
	appClientContext,
	notifyError,
	sharedStyles,
	wrapPathInSvg,
} from '@darksoil-studio/holochain-elements';
import '@darksoil-studio/holochain-elements/dist/elements/display-error.js';
import { AsyncResult, SignalWatcher } from '@darksoil-studio/holochain-signals';
import { EntryRecord } from '@darksoil-studio/holochain-utils';
import { NotesClient } from '@darksoil-studio/notes-zome';
import '@darksoil-studio/notes-zome/dist/elements/notes-context.js';
import '@darksoil-studio/profiles-provider/dist/elements/agent-avatar.js';
import {
	AppClient,
	decodeHashFromBase64,
	encodeHashToBase64,
} from '@holochain/client';
import { consume } from '@lit/context';
import { msg } from '@lit/localize';
import { mdiInformationOutline, mdiPlus } from '@mdi/js';
import { SlButton } from '@shoelace-style/shoelace';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { appStyles } from './app-styles.js';
import './lobby/notes/elements/all-notes.js';
import './lobby/notes/elements/note-detail-for-role.js';
import './my-contacts.js';

@customElement('home-page')
export class HomePage extends SignalWatcher(LitElement) {
	@consume({ context: appClientContext })
	client!: AppClient;

	routes = new Routes(this, [
		{
			path: '',
			render: () => html`
				<div style="position: relative; flex: 1">
					<all-notes
						style="margin: 16px"
						@note-role-selected=${(e: CustomEvent) => {
							this.routes.goto(`note/${e.detail.role}`);
						}}
					>
					</all-notes>
					<sl-button
						variant="primary"
						pill
						size="large"
						style="position: absolute; right: 16px; bottom: 16px"
						@click=${async (e: CustomEvent) => {
							const button = e.target as SlButton;
							button.loading = true;
							try {
								const clone = await this.client.createCloneCell({
									modifiers: {
										properties: {
											progenitors: [encodeHashToBase64(this.client.myPubKey)],
										},
										network_seed: `${Math.random()}`,
									},
									role_name: 'note',
								});
								const notesClient = new NotesClient(
									this.client,
									clone.clone_id,
								);
								await notesClient.createNote({
									title: '',
									body: '',
									images_hashes: [],
								});

								this.routes.goto(`note/${clone.clone_id}`);
							} catch (e) {
								notifyError(msg('Failed to create note.'));
								console.error(e);
							}
							button.loading = false;
						}}
					>
						<sl-icon slot="prefix" .src=${wrapPathInSvg(mdiPlus)}></sl-icon>

						${msg('Create Note')}
					</sl-button>
				</div>
			`,
		},
		{
			path: 'contacts',
			render: params => html` <my-contacts style="flex: 1"> </my-contacts> `,
		},
		{
			path: 'note/:roleName',
			render: params => html`
				<overlay-page
					.title=${msg('')}
					icon="back"
					@close-requested=${() => this.routes.goto('')}
				>
					<collaborative-sessions-context role="${params.roleName}">
						<notes-context role="${params.roleName}">
							<note-detail-for-role style="flex: 1"> </note-detail-for-role>
						</notes-context>
					</collaborative-sessions-context>
				</overlay-page>
			`,
		},
	]);

	render() {
		return html`
			<div class="column" style="flex: 1">
				<div class="row top-bar">
					<span class="title" style="flex: 1">${msg('Notes')}</span>

					<div class="row" style="gap: 16px">
						<agent-avatar
							@click=${() =>
								this.dispatchEvent(
									new CustomEvent('profile-clicked', {
										detail: true,
										composed: true,
									}),
								)}
							.agentPubKey=${this.client.myPubKey}
						></agent-avatar>
					</div>
				</div>
				${this.routes.outlet()}
			</div>
		`;
	}

	static styles = [
		css`
			:host {
				display: flex;
				flex: 1;
			}
		`,
		...appStyles,
		sharedStyles,
	];
}
