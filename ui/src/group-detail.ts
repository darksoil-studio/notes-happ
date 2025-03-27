import {
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
import { mdiInformationOutline } from '@mdi/js';
import { Routes, appClientContext, wrapPathInSvg } from '@tnesh-stack/elements';
import { SignalWatcher } from '@tnesh-stack/signals';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { appStyles } from './app-styles';
import './group/notes/elements/all-notes.js';
import './group/notes/elements/create-note.js';
import { NotesContext } from './group/notes/elements/notes-context';
import { groupInvitesStoreContext } from './lobby/group-invites/context';
import { GroupInvitesStore } from './lobby/group-invites/group-invites-store';

@localized()
@customElement('group-detail')
export class GroupDetail extends SignalWatcher(LitElement) {
	@property()
	networkSeed!: string;

	@consume({ context: appClientContext })
	appClient!: AppClient;

	@state()
	creatingNote = false;

	routes = new Routes(this, [
		{
			path: '',
			render: () => html`
				<div class="column" style="flex: 1; gap: 16px">
					<div class="row">
						<div style="flex: 1"></div>
						<sl-button @click=${() => this.routes.goto(`create-note`)}
							>${msg('Create Note')}</sl-button
						>
					</div>
					<all-notes
						style="flex: 1"
						@note-selected=${(e: CustomEvent) =>
							this.routes.goto(`note/${encodeHashToBase64(e.detail.noteHash)}`)}
					>
					</all-notes>
				</div>
			`,
		},
		{
			path: 'create-note',
			render: () =>
				html`<overlay-page
					.title=${msg('Create Note')}
					icon="close"
					@close-requested=${() => this.routes.goto('')}
				>
					<create-note
						@note-created=${(e: CustomEvent) =>
							this.routes.goto(`note/${encodeHashToBase64(e.detail.noteHash)}`)}
					>
					</create-note>
				</overlay-page>`,
		},
		{
			path: 'note/:noteHash',
			render: params => {
				const store =
					this.shadowRoot?.querySelector<NotesContext>('notes-context')?.store;
				const note = store?.notes
					.get(decodeHashFromBase64(params.noteHash!))
					.latestVersion.get();
				const title = msg('Note');

				return html`<overlay-page
					.title=${title}
					icon="back"
					@close-requested=${() => this.routes.goto('')}
				>
					<note-detail
						.noteHash=${decodeHashFromBase64(params.noteHash!)}
						@edit-clicked=${() =>
							this.routes.goto(`note/${params.noteHash}/edit`)}
						@note-deleted=${() => this.routes.goto(``)}
					>
					</note-detail>
				</overlay-page>`;
			},
		},
		{
			path: 'note/:noteHash/edit',
			render: params =>
				html`<overlay-page
					.title=${msg('Edit Note')}
					icon="close"
					@close-requested=${() => this.routes.goto(`note/${params.noteHash!}`)}
				>
					<edit-note
						.noteHash=${decodeHashFromBase64(params.noteHash!)}
						@note-updated=${() => this.routes.goto(`note/${params.noteHash!}`)}
					></edit-note>
				</overlay-page>`,
		},
	]);

	// renderContent() {
	// 	if (this.creatingNote)
	// 		return html`
	// 			<overlay-page
	// 				icon="close"
	// 				@close-requested=${() => (this.creatingNote = false)}
	// 			>
	// 				<create-note @note-created=${() => (this.creatingNote = false)}>
	// 				</create-note>
	// 			</overlay-page>
	// 		`;
	// 	return html`
	// 	`;
	// }

	roleName() {
		const appInfo: AppInfo = (this.appClient as AppWebsocket).cachedAppInfo!;

		const groupCell = appInfo.cell_info['group']
			.filter(cellInfo => cellInfo as { [CellType.Cloned]: ClonedCell })
			.map(
				cellInfo =>
					(cellInfo as { [CellType.Cloned]: ClonedCell })[CellType.Cloned],
			)
			.find(
				clonedCell =>
					clonedCell?.dna_modifiers.network_seed === this.networkSeed,
			);
		return groupCell!.clone_id;
	}

	render() {
		return html`
			<file-storage-context .role=${this.roleName()}>
				<notes-context .role=${this.roleName()}>
					${this.routes.outlet()}</notes-context
				>
			</file-storage-context>
		`;
	}

	static styles = appStyles;
}
