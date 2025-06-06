{
  description = "Template for Holochain app development";

  inputs = {
    membrane-invitations-zome.url = "github:darksoil-studio/membrane-invitations-zome/main-0.5";
    notes-zome.url = "github:darksoil-studio/notes-zome/main-0.5";
    collaborative-sessions-zome.url =
      "github:darksoil-studio/collaborative-sessions/main-0.5";
    holonix.url = "github:holochain/holonix/main-0.5";

    nixpkgs.follows = "holonix/nixpkgs";
    flake-parts.follows = "holonix/flake-parts";

    scaffolding.url = "github:darksoil-studio/scaffolding/main-0.5";
    holochain-nix-builders.url =
      "github:darksoil-studio/holochain-nix-builders/main-0.5";
    playground.url = "github:darksoil-studio/holochain-playground/main-0.5";
    tauri-plugin-holochain.url =
      "github:darksoil-studio/tauri-plugin-holochain/main-0.5";

    file-storage.url = "github:darksoil-studio/file-storage/main-0.5";
    friends-zome.url = "github:darksoil-studio/friends-zome/main-0.5";
    private-event-sourcing-zome.url =
      "github:darksoil-studio/private-event-sourcing-zome/main-0.5";
    linked-devices-zome.url =
      "github:darksoil-studio/linked-devices-zome/main-0.5";
  };

  nixConfig = {
    extra-substituters = [
      "https://holochain-ci.cachix.org"
      "https://darksoil-studio.cachix.org"
    ];
    extra-trusted-public-keys = [
      "holochain-ci.cachix.org-1:5IUSkZc0aoRS53rfkvH9Kid40NpyjwCMCzwRTXy+QN8="
      "darksoil-studio.cachix.org-1:UEi+aujy44s41XL/pscLw37KEVpTEIn8N/kn7jO8rkc="
    ];
  };

  outputs = inputs:
    inputs.flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [ ./happ.nix ];

      systems = builtins.attrNames inputs.holonix.devShells;
      perSystem = { inputs', config, pkgs, system, ... }: {
        devShells.default = pkgs.mkShell {
          inputsFrom = [
            inputs'.scaffolding.devShells.synchronized-pnpm
            inputs'.holonix.devShells.default
          ];
          packages = [
            inputs'.holochain-nix-builders.packages.holochain
            inputs'.scaffolding.packages.hc-scaffold-happ
            inputs'.tauri-plugin-holochain.packages.hc-pilot
            inputs'.playground.packages.hc-playground
          ];
        };
      };
    };
}
