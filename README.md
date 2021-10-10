# Ada Ikan

## Table of Contents

- [About](#about)
- [Features](#features)
- [Requirements](#requirements)
- [Project Usage](#project-usage)
  - [Installation](#installation)
  - [Configuration](#configuration)
    - [npm scripts](#npm-scripts)
    - [cli](#cli)
  - [Run](#run)
  - [Test](#test)
- [License](#license)

## About

Ada Fish is here to solve the difficult problem of finding the fish that fish connoisseurs want. By looking directly for the fish they want, it will give customers satisfaction in finding the fish they want to consume every day.

## Features

    - [x] Fish catalog
    - [x] Cart
    - [x] Buy fish
    - [x] Map for address
    - [x] Chat (text)
    - [x] Rating Order
    - [x] Email verification
    - [x] Seller Dashboard
    - [x] Courier Dashboard
    - [x] Admin Dashboard
    - [x] PWA

## Requirements

- OS
  - Windows 8 or greater
  - Ubuntu 20 or greater
- Database
  - PostgreSQL 13
- Tools
  - git (if windows)
  - nvm
  - nodejs 14.18 or greater

## Project Usage

Usage will consist of several parts.

### Instalation

1.  Clone the repository.

        git clone https://github.com/adaikan/adaikan.git

2.  Install dependencies.

        npm install

### Configuration

You can configure application by npm scripts or cli.

For development purposes, you can skip build step.

#### npm scripts

1.  Set environment

    Development

         npm run env

    Production

         npm run env -- --production

2.  Generate Authentication Key

        npm run key-pair

3.  Buid views

    Client

         npm run build:client

    Admin

         npm run build:admin

4.  Build

        npm run build

#### cli

    npm run console

### Run

To run applications for development purposes.

    npm run dev

For deployment environment

    npm start

Without log

    npm start -- --log=false

With pm2

    npx pm2 start build/server.js


### Test

    npm run test

## License

Code and Contributions have [MIT License](https://github.com/adaikan/adaikan/blob/main/LICENSE).

---

**Copyright © 2021 Ada Ikan | Arwana, All Right Reserved.**
