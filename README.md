# Edge Distriubition

The followiwng is a simple edge distribution codebase for handling distribution of small amounts of testnet tokens.
This is not recommended or endorsed to be run by anyone or to be used in production enivronments.

## Installation

Run `npm install` in the root of the directory after forking/cloning.

## Deployment (Launch)

To deploy the base protocol you must do the following:

1. Add a private key without the 0x to a .env file `cp .env.example .env && vim .env`
2. Add some tokens and gas tokens to this account on the chains you are supporting

Once complete, run the following to launch the protocol in local development mode:

```shell
npm run dev
```

### Security and Liability

All contracts, code, examples, test are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

### License

See [License](./LICENSE) in License.
