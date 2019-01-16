# Kubernetes Utility

> Easier Access on Kubernetes

### Introduction

This tool is aim to provide easier access on Kubernetes funtionalities like:

- Context switch
- Namespace preference
- Pods access like `kubectl logs -f` and `kubectl exec -it`
- `kubetail` that provides combination of pods' log
- Recent history of commands

### Installation

We provide easy intallation with [`brew`](https://brew.sh/) + [`brew cask`](https://caskroom.io)

```bash
brew cask install plutux-labs/cask/kubernetes-utility
```

### Usage

- The application will take `~/.kube/config` by default
- The application will not take `KUBECONFIG` environment

#### Build Setup

``` bash
# install dependencies
yarn install

# serve with hot reload at localhost:9080
yarn dev

# build electron application for production
yarn build

# build electron application fro production with also .dmg installer
yarn build:darwin-full

# environments other than Mac OS is not tested

```

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[8fae476](https://github.com/SimulatedGREG/electron-vue/tree/8fae4763e9d225d3691b627e83b9e09b56f6c935) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
