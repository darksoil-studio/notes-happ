{ inputs, ... }:

{
  perSystem = { inputs', system, ... }: {
    packages.group_invites_integrity =
      inputs.holochain-nix-builders.outputs.builders.${system}.rustZome {
        workspacePath = inputs.self.outPath;
        crateCargoToml = ./Cargo.toml;
      };
  };
}

