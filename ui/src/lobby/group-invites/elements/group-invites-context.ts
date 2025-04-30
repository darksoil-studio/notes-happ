import { AppClient } from "@holochain/client";
import { consume, provide } from "@lit/context";
import { appClientContext } from "@darksoil-studio/holochain-elements";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { groupInvitesStoreContext } from "../context.js";
import { GroupInvitesClient } from "../group-invites-client.js";
import { GroupInvitesStore } from "../group-invites-store.js";

/**
 * @element group-invites-context
 */
@customElement("group-invites-context")
export class GroupInvitesContext extends LitElement {
  @consume({ context: appClientContext })
  private client!: AppClient;

  @provide({ context: groupInvitesStoreContext })
  @property({ type: Object })
  store!: GroupInvitesStore;

  @property()
  role!: string;

  @property()
  zome = "group_invites";

  connectedCallback() {
    super.connectedCallback();
    if (this.store) return;
    if (!this.role) {
      throw new Error(
        `<group-invites-context> must have a role="YOUR_DNA_ROLE" property, eg: <group-invites-context role="role1">`,
      );
    }
    if (!this.client) {
      throw new Error(`<group-invites-context> must either:
        a) be placed inside <app-client-context>
          or 
        b) receive an AppClient property (eg. <group-invites-context .client=\${client}>) 
          or 
        c) receive a store property (eg. <group-invites-context .store=\${store}>)
      `);
    }

    this.store = new GroupInvitesStore(new GroupInvitesClient(this.client, this.role, this.zome));
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
