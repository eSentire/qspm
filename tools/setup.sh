#!/usr/bin/env bash
#
# This script sets up ones environment for rust development using
# Web Assembly.
#
set -e

# Utility Functions
function _info() {
    printf '\x1b[34;1mINFO: %d: %s\x1b[0m\n' ${BASH_LINENO[0]} "$*"
}

function _err() {
    printf '\x1b[31;1mERROR: %d: %s\x1b[0m\n' ${BASH_LINENO[0]} "$*"
    exit 1
}

# Banner
printf '\x1b[34;1m'
cat <<EOF
# ========================================================================
#
# Setting up for rust Web Assembly Development.
#
# ========================================================================
EOF
printf '\x1b[0m'


# Install rust if it is not already installed.
if [ ! -f $HOME/.cargo/bin/rustup ] ; then
    _info "installing rust"
    # Avoid the prompt by specifying -y.
    set -x
    time curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    { set +; } 2> /dev/null
else
    _info "rust already installed"
fi

# Setup the environment.
source $HOME/.cargo/env

# Report the rust installation.
_info "rust installation"
cargo --version
rustc --version
rustup --version

# Install the wabt tools if they are not already installed.
# Note that cmake must exist.
if ! cmake --version 2>/dev/null ; then
    _err "required tool not installed: cmake, cannot continue"
fi

# Building the tools requires cmake, make, a C compiler, etc.
if [ ! -f wabt/bin/wasm2wat ] ; then
    _info "installing wabt"
    set -x
    git clone https://github.com/WebAssembly/wabt.git
    cd wabt
    git submodule update --init
    mkdir build
    cd build
    cmake ..
    cmake --build .
    make
    cd ../..
    { set +x; } 2> /dev/null
else
    _info "wabt/bin/wasm2wat already installed"
fi

_info "verifying wabt setup"
export PATH="$PATH:$(pwd)/wabt/bin"
set -x
wasm2wat --version
{ set +x; } 2> /dev/null

# Update rust to include Web Assembly components.
_info "installing web assembly components"
set -x
time rustup update
time rustup component add rls rust-analysis rust-src
time rustup target add wasm32-unknown-unknown
time cargo install wasm-gc
time cargo install wasm-bindgen-cli
{ set +x; } 2> /dev/null

_info "done"
printf '\x1b[32;1m'
cat <<EOF
You can start to build Web Assembly into rust without npm.

Here is how you setup your environment:

   \$ source \$HOME/.cargo/env
   \$ export PATH="\$PATH:$(pwd)/wabt/bin"

Here is how you can test it:

   \$ cargo --version
   \$ wasm2wat --version

EOF
printf '\x1b[0m'

# Notes for ubuntu-18.04
#   sudo apt-get update
#   sudo apt-get install -y curl
#   sudo apt-get install -y build-essentials
#   sudo apt-get install -y libssl-dev pkg-config
#   sudo apt-get install -y cmake make
