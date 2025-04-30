{ inputs, ... }:

{
  perSystem = { inputs', self', system, ... }: {
    packages.notes =
      inputs.holochain-nix-builders.outputs.builders.${system}.rustZome {
        workspacePath = inputs.self.outPath;
        crateCargoToml = ./Cargo.toml;
      };

  };
}

