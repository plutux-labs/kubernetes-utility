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

We provide easy installation with [`brew`](https://brew.sh/) + [`brew cask`](https://caskroom.io)

```bash
brew cask install plutux-labs/cask/kubernetes-utility
```

### Usage

- The application will take `~/.kube/config` by default
- The application will not take `KUBECONFIG` environment

```bash
# Tips to merge all files in KUBECONFIG env

# Backing up existing config
mv ~/.kube/confg ~/.kube/config.back

# Write merged config to default path
kubectl config view --flatten > ~/.kube/confg
```