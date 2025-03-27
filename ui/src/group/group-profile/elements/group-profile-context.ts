import { AppClient } from "@holochain/client";
import { consume, provide } from "@lit/context";
import { appClientContext } from "@tnesh-stack/elements";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import { groupProfileStoreContext } from "../context.js";
import { GroupProfileClient } from "../group-profile-client.js";
import { GroupProfileStore } from "../group-profile-store.js";

/**
 * @element group-profile-context
 */
@customElement("group-profile-context")
export class GroupProfileContext extends LitElement {
  @consume({ context: appClientContext })
  private client!: AppClient;

  @provide({ context: groupProfileStoreContext })
  @property({ type: Object })
  store!: GroupProfileStore;

  @property()
  role!: string;

  @property()
  zome = "group_profile";

  connectedCallback() {
    super.connectedCallback();
    if (this.store) return;
    if (!this.role) {
      throw new Error(
        `<group-profile-context> must have a role="YOUR_DNA_ROLE" property, eg: <group-profile-context role="role1">`,
      );
    }
    if (!this.client) {
      throw new Error(`<group-profile-context> must either:
        a) be placed inside <app-client-context>
          or 
        b) receive an AppClient property (eg. <group-profile-context .client=\${client}>) 
          or 
        c) receive a store property (eg. <group-profile-context .store=\${store}>)
      `);
    }

    this.store = new GroupProfileStore(new GroupProfileClient(this.client, this.role, this.zome));
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
