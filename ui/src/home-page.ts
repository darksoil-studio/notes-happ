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
import { notesStoreContext } from './main/notes/context.js';
import './main/notes/elements/all-notes.js';
import './main/notes/elements/note-detail.js';
import { NotesStore } from './main/notes/notes-store.js';
import './my-contacts.js';

@customElement('home-page')
export class HomePage extends SignalWatcher(LitElement) {
	@consume({ context: appClientContext })
	client!: AppClient;

	@consume({ context: notesStoreContext, subscribe: true })
	@property({ type: Object })
	notesStore!: NotesStore;

	routes = new Routes(this, [
		{
			path: '',
			render: () => html`
				<div style="position: relative; flex: 1">
					<all-notes> </all-notes>
					<sl-button
						variant="primary"
						pill
						size="large"
						style="position: absolute; right: 16px; bottom: 16px"
						@click=${async (e: CustomEvent) => {
							const button = e.target as SlButton;
							button.loading = true;
							try {
								const noteHash = await this.notesStore.client.createNote(
									'',
									'',
								);
								this.routes.goto(`note/${encodeHashToBase64(noteHash)}`);
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
			path: 'note/:createNoteHash',
			render: params => html`
				<note-detail .noteHash=${decodeHashFromBase64(params.createNoteHash!)}>
				</note-detail>
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
