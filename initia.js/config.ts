import { LCDClient, Wallet, MnemonicKey } from '@initia/initia.js';

// TODO: Set your node url and chain id
export const NODE_URL = 'https://next-stone-rest.initia.tech/';
export const CHAIN_ID = 'stone-8';

// TODO: Set your mnemonic
export const TEST_MNEMONIC = 'initial love edge cliff phone bundle dice parade image demand excess bless obey round awesome replace firm often law purpose letter border genius slot';
// bech32 addr - init10s4f3kdlf5f7jmsxlf95hh6tntzu0stm4js6v2
// hex addr - 0x7c2a98d9bf4d13e96e06fa4b4bdf4b9ac5c7c17b


// Create a new instance of the LCDClient class, passing in the URL of the LCD server and the gas prices and adjustment
export const lcd = new LCDClient(
    NODE_URL, // lcd url
    {
        gasPrices: '0.15uinit', // gas price (init price per gas)
        gasAdjustment: '2.0', // gas adjustment, multiple of the simulated gas amount for a safe margin
        chainId: CHAIN_ID
    }
);

// Create a new MnemonicKey object with your mnemonic phrase
export const key = new MnemonicKey({mnemonic: TEST_MNEMONIC});

// Create a new Wallet object with the LCD client and key
export const wallet = new Wallet(lcd, key);
