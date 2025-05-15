import wasmUrl from '@automerge/automerge/automerge.wasm?url';
// Note the `/slim` suffixes
import { next as Automerge } from '@automerge/automerge/slim';
import '@darksoil-studio/collaborative-sessions-zome/dist/elements/collaborative-sessions-context.js';
import '@darksoil-studio/file-storage-zome/dist/elements/file-storage-context.js';
import '@darksoil-studio/friends-zome/dist/elements/friends-context.js';
import '@darksoil-studio/friends-zome/dist/elements/profile-prompt.js';
import { Router } from '@darksoil-studio/holochain-elements';
import '@darksoil-studio/holochain-elements/dist/elements/app-client-context.js';
import '@darksoil-studio/holochain-elements/dist/elements/display-error.js';
import { SignalWatcher } from '@darksoil-studio/holochain-signals';
import '@darksoil-studio/linked-devices-zome/dist/elements/linked-devices-context.js';
import '@darksoil-studio/notes-zome/dist/elements/notes-context.js';
import '@darksoil-studio/profiles-provider/dist/elements/my-profile.js';
import {
	AppClient,
	AppWebsocket,
	CellType,
	decodeHashFromBase64,
} from '@holochain/client';
import { ResizeController } from '@lit-labs/observers/resize-controller.js';
import { provide } from '@lit/context';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { appStyles } from './app-styles.js';
import { isMobileContext } from './context.js';
import './home-page.js';
import './overlay-page.js';

await Automerge.initializeWasm(wasmUrl);

export const MOBILE_WIDTH_PX = 600;

@localized()
@customElement('holochain-app')
export class HolochainApp extends SignalWatcher(LitElement) {
	@state()
	_loading = true;
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
				<linked-devices-context role="lobby">
					<friends-context role="lobby">
						<profile-prompt style="flex: 1;">
							${this.router.outlet()}
						</profile-prompt>
					</friends-context>
				</linked-devices-context>
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
