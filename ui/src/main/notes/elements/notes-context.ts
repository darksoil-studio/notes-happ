import { appClientContext } from "@darksoil-studio/holochain-elements";
import { AppClient } from "@holochain/client";
import { consume, provide } from "@lit/context";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { notesStoreContext } from "../context.js";
import { NotesClient } from "../notes-client.js";
import { NotesStore } from "../notes-store.js";

/**
 * @element notes-context
 */
@customElement("notes-context")
export class NotesContext extends LitElement {
  @consume({ context: appClientContext })
  private client!: AppClient;

  @provide({ context: notesStoreContext })
  @property({ type: Object })
  store!: NotesStore;

  @property()
  role!: string;

  @property()
  zome = "notes";

  connectedCallback() {
    super.connectedCallback();
    if (this.store) return;
    if (!this.role) {
      throw new Error(`<notes-context> must have a role="YOUR_DNA_ROLE" property, eg: <notes-context role="role1">`);
    }
    if (!this.client) {
      throw new Error(`<notes-context> must either:
        a) be placed inside <app-client-context>
          or 
        b) receive an AppClient property (eg. <notes-context .client=\${client}>) 
          or 
        c) receive a store property (eg. <notes-context .store=\${store}>)
      `);
    }

    this.store = new NotesStore(new NotesClient(this.client, this.role, this.zome));
  }

  render() {
    return html`<slot></slot>`;
  }

  static styles = css`
    :host {
      display: contents;
    }
  `;
}
