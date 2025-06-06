import { sharedStyles } from '@darksoil-studio/holochain-elements';
import { css } from 'lit';

export const appStyles = [
	css`
		.top-bar {
			align-items: center;
			background-color: var(--sl-color-primary-500);
			box-shadow: rgba(149, 157, 165, 1) 2px 2px 4px;
			padding: 0 16px;
			height: 60px;
			color: white;
		}
		.top-bar sl-icon-button {
			color: white;
		}
		.top-bar sl-icon-button::part(base):hover {
			color: rgb(220, 220, 220);
		}
	`,
	...sharedStyles,
];
