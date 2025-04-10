import { SearchUsers } from '@darksoil-studio/profiles-provider/dist/elements/search-users';
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
import {
	mdiCog,
	mdiInformationOutline,
	mdiPlus,
	mdiSettingsHelper,
} from '@mdi/js';
import {
	Routes,
	appClientContext,
	notifyError,
	wrapPathInSvg,
} from '@tnesh-stack/elements';
import { SignalWatcher } from '@tnesh-stack/signals';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { appStyles } from './app-styles';
import './group-members.js';
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

	@consume({ context: groupInvitesStoreContext })
	groupInvitesStore!: GroupInvitesStore;

	@state()
	creatingNote = false;

	routes = new Routes(this, [
		{
			path: '',
			render: () => html`
				<div class="column" style="flex: 1; gap: 16px; position:relative">
					<div class="row" style="gap: 8px; align-items: center">
						<span class="title">${this.networkSeed}</span>
						<sl-button circle @click=${() => this.routes.goto(`settings`)}
							><sl-icon .src=${wrapPathInSvg(mdiCog)}></sl-icon
						></sl-button>
					</div>
					<all-notes
						style="flex: 1"
						@note-selected=${(e: CustomEvent) =>
							this.routes.goto(`note/${encodeHashToBase64(e.detail.noteHash)}`)}
					>
					</all-notes>
					<sl-button
						pill
						variant="primary"
						@click=${() => this.routes.goto(`create-note`)}
						style="position: absolute; right: 0; bottom: 0"
					>
						<sl-icon slot="prefix" .src=${wrapPathInSvg(mdiPlus)}> </sl-icon>
						${msg('Create Note')}</sl-button
					>
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
		{
			path: 'settings',
			render: params =>
				html`<overlay-page
					.title=${msg('Settings')}
					icon="back"
					@close-requested=${() => this.routes.goto(``)}
				>
					<div class="column" style="gap:16px">
						<div class="row" style="gap:16px">
							<div style="flex: 1"></div>
							<sl-button
								@click=${() => this.routes.goto('add-members')}
								variant="primary"
								>${msg('Add Members')}
							</sl-button>
						</div>

						<sl-card>
							<div class="column" style="gap:16px; flex: 1">
								<span class="title">${msg('Members')}</span>

								<group-members .networkSeed=${this.networkSeed}>
								</group-members>
							</div>
						</sl-card>
						<sl-button
							variant="danger"
							@click=${() =>
								this.shadowRoot!.querySelector('sl-dialog')!.show()}
							>${msg('Leave Group')}
						</sl-button>
						<sl-dialog .label=${msg('Leave Group')}>
							<span>${msg('Are you sure you want to leave this group?')} </span>
							<sl-button
								slot="footer"
								@click=${() =>
									this.shadowRoot!.querySelector('sl-dialog')!.hide()}
								>${msg('Cancel')}</sl-button
							>
							<sl-button
								variant="danger"
								slot="footer"
								@click=${async () => {
									try {
										await this.groupInvitesStore.client.leaveGroup(
											this.networkSeed,
										);
										this.dispatchEvent(
											new CustomEvent('leave-group', {
												bubbles: true,
												composed: true,
											}),
										);
									} catch (e) {
										notifyError(msg('Failed to add members.'));
										console.error(e);
									}
								}}
								>${msg('Leave Group')}</sl-button
							>
						</sl-dialog>
					</div>
				</overlay-page>`,
		},
		{
			path: 'add-members',
			render: params =>
				html`<overlay-page
					.title=${msg('Add Members')}
					icon="close"
					@close-requested=${() => this.routes.goto(`settings`)}
				>
					<div class="column" style="gap:16px">
						<sl-card>
							<div class="column" style="gap:16px; flex:1">
								<span class="title">Members</span>

								<search-users style="height: 300px"> </search-users>
								<sl-button
									variant="primary"
									@click=${async () => {
										try {
											const members = (
												this.shadowRoot!.querySelector(
													'search-users',
												) as SearchUsers
											).value;
											await this.groupInvitesStore.client.inviteAgentsToGroup(
												this.networkSeed,
												members.map(m => m[0]),
											);
											this.routes.goto('settings');
										} catch (e) {
											notifyError(msg('Failed to add members.'));
											console.error(e);
										}
									}}
									>${msg('Add Members')}
								</sl-button>
							</div>
						</sl-card>
					</div>
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

	static styles = [
		css`
			:host {
				display: flex;
			}
		`,
		appStyles,
	];
}
