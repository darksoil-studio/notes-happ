{ inputs, ... }:

{
  perSystem =
    { inputs'
    , system
    , ...
    }: {
      packages.notes_integrity = inputs.tnesh-stack.outputs.builders.${system}.rustZome {
        workspacePath = inputs.self.outPath;
        crateCargoToml = ./Cargo.toml;
      };
    };
}

