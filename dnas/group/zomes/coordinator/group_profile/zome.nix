{ inputs, ... }:

{
  perSystem = { inputs', self', system, ... }: {
    packages.group_profile =
      inputs.holochain-nix-builders.outputs.builders.${system}.rustZome {
        workspacePath = inputs.self.outPath;
        crateCargoToml = ./Cargo.toml;
      };

  };
}

