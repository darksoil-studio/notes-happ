import '@darksoil-studio/file-storage-zome/dist/elements/file-storage-context.js';
import '@darksoil-studio/friends-zome/dist/elements/friends-context.js';
import '@darksoil-studio/friends-zome/dist/elements/profile-prompt.js';
import '@darksoil-studio/profiles-provider/dist/elements/my-profile.js';
import {
	ActionHash,
	AppClient,
	AppWebsocket,
	decodeHashFromBase64,
	encodeHashToBase64,
} from '@holochain/client';
import { ResizeController } from '@lit-labs/observers/resize-controller.js';
import { provide } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiArrowLeft } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { Router, hashState, wrapPathInSvg } from '@darksoil-studio/holochain-elements';
import '@darksoil-studio/holochain-elements/dist/elements/app-client-context.js';
import '@darksoil-studio/holochain-elements/dist/elements/display-error.js';
import { SignalWatcher } from '@darksoil-studio/holochain-signals';
import { EntryRecord } from '@darksoil-studio/holochain-utils';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { appStyles } from './app-styles.js';
import { isMobileContext } from './context.js';
import './group-list.js';
import './group/group-profile/elements/create-group-profile.js';
import './group/group-profile/elements/edit-group-profile.js';
import { GroupProfileContext } from './group/group-profile/elements/group-profile-context.js';
import './group/group-profile/elements/group-profile-context.js';
import './group/group-profile/elements/group-profile-detail.js';
import './group/notes/elements/create-note.js';
import './group/notes/elements/edit-note.js';
import { NotesContext } from './group/notes/elements/notes-context.js';
import './group/notes/elements/notes-context.js';
import './home-page.js';
import { GroupInvitesContext } from './lobby/group-invites/elements/group-invites-context.js';
import './lobby/group-invites/elements/group-invites-context.js';
import './overlay-page.js';

export const MOBILE_WIDTH_PX = 600;

@localized()
@customElement('holochain-app')
export class HolochainApp extends SignalWatcher(LitElement) {
	@state()
	_loading = true;
	@state()
	_view = { view: 'main' };
	@state()
	_error: unknown | undefined;

	_client!: AppClient;

	router = new Router(this, [
		{
			path: '/',
			enter: () => {
				// Redirect to "/home/"
				this.router.goto('/home/');
				return false;
			},
		},
		{
			path: '/home/*',
			render: () =>
				html`<home-page
					@create-group-clicked=${() => this.router.goto('/create-group')}
					@profile-clicked=${() => this.router.goto('/my-profile')}
				></home-page>`,
		},
		{
			path: '/my-profile',
			render: () =>
				html`<overlay-page
					.title=${msg('My Profile')}
					icon="back"
					@close-requested=${() => this.router.goto('/home/')}
				>
					<sl-card>
						<my-profile style="flex: 1"></my-profile>
					</sl-card>
				</overlay-page>`,
		},
		{
			path: '/create-group',
			render: () =>
				html`<overlay-page
					.title=${msg('Create Group')}
					icon="close"
					@close-requested=${() => this.router.goto('/home/')}
				>
					<create-group-profile
						@group-created=${(e: CustomEvent) =>
							this.router.goto(`/home/group/${e.detail.networkSeed}/`)}
					>
					</create-group-profile>
				</overlay-page>`,
		},
		// {
		// 	path: '/home/group/:groupRoleName',
		// 	render: params => {
		// 		const store = this.shadowRoot?.querySelector<GroupProfileContext>(
		// 			'group-profile-context',
		// 		)?.store;
		// 		const groupProfile = store?.groupProfiles
		// 			.get(decodeHashFromBase64(params.groupProfileHash!))
		// 			.latestVersion.get();
		// 		const title = msg('Group Profile');

		// 		return html`<overlay-page
		// 			.title=${title}
		// 			icon="back"
		// 			@close-requested=${() => this.router.goto('/home/')}
		// 		>
		// 			<group-profile-detail
		// 				.groupProfileHash=${decodeHashFromBase64(params.groupProfileHash!)}
		// 				@edit-clicked=${() =>
		// 					this.router.goto(
		// 						`/group-profile/${params.groupProfileHash}/edit`,
		// 					)}
		// 			>
		// 			</group-profile-detail>
		// 		</overlay-page>`;
		// 	},
		// },
		{
			path: '/group-profile/:groupProfileHash/edit',
			render: params =>
				html`<overlay-page
					.title=${msg('Edit Group Profile')}
					icon="close"
					@close-requested=${() =>
						this.router.goto(`/group-profile/${params.groupProfileHash!}`)}
				>
					<edit-group-profile
						.groupProfileHash=${decodeHashFromBase64(params.groupProfileHash!)}
						@group-profile-updated=${() =>
							this.router.goto(`/group-profile/${params.groupProfileHash!}`)}
					></edit-group-profile>
				</overlay-page>`,
		},
	]);

	@provide({ context: isMobileContext })
	@property()
	_isMobile: boolean = false;

	async firstUpdated() {
		new ResizeController(this, {
			callback: () => {
				this._isMobile = this.getBoundingClientRect().width < MOBILE_WIDTH_PX;
			},
		});

		try {
			this._client = await AppWebsocket.connect();
		} catch (e: unknown) {
			this._error = e;
		} finally {
			this._loading = false;
		}
	}

	render() {
		if (this._loading) {
			return html`<div
				class="row"
				style="flex: 1; height: 100%; align-items: center; justify-content: center;"
			>
				<sl-spinner style="font-size: 2rem"></sl-spinner>
			</div>`;
		}

		if (this._error) {
			return html`
				<div
					style="flex: 1; height: 100%; align-items: center; justify-content: center;"
				>
					<display-error
						.error=${this._error}
						.headline=${msg('Error connecting to holochain')}
					>
					</display-error>
				</div>
			`;
		}

		return html`
			<app-client-context .client=${this._client}>
				<friends-context role="lobby">
					<group-invites-context role="lobby">
						<profile-prompt style="flex: 1;">
							${this.router.outlet()}
						</profile-prompt>
					</group-invites-context>
				</friends-context>
			</app-client-context>
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
	];
}
