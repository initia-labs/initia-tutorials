import { LCDClient, Wallet, MnemonicKey } from '@initia/initia.js';

// TODO: Set your NODE_URL and CHAIN_ID
export const NODE_URL = 'https://stone-rest.initia.tech/';
export const CHAIN_ID = 'stone-8';

// TODO: Set your mnemonic and Create a new MnemonicKey object
export const TEST_MNEMONIC = 'initial love edge cliff phone bundle dice parade image demand excess bless obey round awesome replace firm often law purpose letter border genius slot';
export const TEST_KEY = new MnemonicKey({mnemonic: TEST_MNEMONIC});

// Create a LCD Client instance
export const LCD = new LCDClient(
    NODE_URL, // lcd url
    {
        gasPrices: '0.15uinit', // gas price
        gasAdjustment: '2.0', // gas adjustment
        chainId: CHAIN_ID
    }
);

// Create a new Wallet instacne
export const TEST_WALLET = new Wallet(LCD, TEST_KEY);