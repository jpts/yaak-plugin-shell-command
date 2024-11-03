with import <nixpkgs> { };

stdenv.mkDerivation {
  name = "node";
  buildInputs = [
    nodejs_20
    esbuild
    biome
  ];
  shellHook = ''
    export PATH="$PWD/node_modules/.bin/:$PATH"
  '';
}
