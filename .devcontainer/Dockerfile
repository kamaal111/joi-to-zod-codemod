FROM debian:bookworm-slim

RUN apt update && apt install -y zsh curl git vim httpie jq unzip bash sudo

COPY .node-version /tmp/.node-version
RUN curl -fsSL "https://deb.nodesource.com/setup_$(cat /tmp/.node-version).x" | bash - \
    && apt-get install -y nodejs

ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
COPY package.json /tmp/package.json
RUN curl -fsSL https://get.pnpm.io/install.sh \
    | env PNPM_VERSION="$(jq -r '.devEngines.packageManager.version' /tmp/package.json)" SHELL="$(which bash)" bash -

# Oh My Zsh
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
RUN git clone https://github.com/zsh-users/zsh-autosuggestions ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions
RUN git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
RUN git clone https://github.com/zsh-users/zsh-completions ~/.oh-my-zsh/custom/plugins/zsh-completions

# Install Rust up for cargo tools
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
