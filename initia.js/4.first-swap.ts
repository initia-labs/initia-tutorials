import { AccAddress, MsgExecute, MsgPublish, BCS } from '@initia/initia.js';
import { 
    LCD,
    TEST_WALLET,
    TEST_KEY
} from './config';
import { pollingTx } from './utils';
import { MoveBuilder } from '@initia/builder.js';
import path from 'path';

  
const myAddr = TEST_KEY.accAddress;
const bcs = BCS.getInstance();

const pairCoin = `${AccAddress.toHex(myAddr)}::basic_coin::Coin`;
const LPToken =  `${AccAddress.toHex(myAddr)}::coins::LP<0x1::native_uinit::Coin, ${pairCoin}>`

async function publishCoins(){
   // Compile contract and read the compiled module bytes
   const builder = new MoveBuilder(path.resolve(__dirname, "../move/coins"), {});
   await builder.build();
   const compiledModuleBytes = await builder.get("coins");
   const base64EncodedModuleBytes = compiledModuleBytes.toString('base64');

    // Create a new message to publish the module
    const publishMsg = new MsgPublish(myAddr, [base64EncodedModuleBytes], 1);

    const signedTx = await TEST_WALLET.createAndSignTx({ msgs: [publishMsg] });
    const broadcastResult = await LCD.tx.broadcast(signedTx);

    console.log("\nTX broadcasted, waiting for the result\n");

    pollingTx(broadcastResult.txhash)
    
    // check published
    LCD.move.module(myAddr, "coins").then((res) => console.log(res));
}

async function swap() {
    await publishCoins();

    let myBalance = await LCD.bank.balance(myAddr);
    console.log("------------------Before Swap------------------");
    console.log("my balances:", myBalance[0].map((coin) => coin.toString()));

    const msgs = [];

    // Check if the account is registered on the DEX module
    const isDexRegistered = await LCD.move.viewFunction(
        "0x1",
        "dex",
        "is_account_registered",
        [],
        [bcs.serialize("address", AccAddress.toHex(myAddr))]
    );
    if (!isDexRegistered) {
        console.log("account is not registered on dex, registering...")
        const registerMsg = new MsgExecute(
            myAddr,
            "0x1",
            "dex",
            "register", 
            [],
            []
        );
        msgs.push(registerMsg);
    }

    // Create pair if not exist
    const isPairExist = await LCD.move.viewFunction(
        "0x1",
        "dex",
        "is_listed",
        [
            '0x1::native_uinit::Coin', // coin a,
            pairCoin, // coin b
            LPToken, // lp token
        ],
        [],
    );

    if (!isPairExist) {
        console.log("Pair does not exist, creating pair...")
        const createPairMsg = new MsgExecute(
            myAddr,
            '0x1',
            'dex',
            'create_pair_script',
            [
                '0x1::native_uinit::Coin', // coin a
                pairCoin, // coin b
                LPToken, // lp token
            ],
            [
                bcs.serialize('string', 'MyFirstLP'), // name
                bcs.serialize('string', 'myFirstSymbol'), // symbol
                bcs.serialize('string', '0.5'), // coin a weight
                bcs.serialize('string', '0.5'), // coin b weight
                bcs.serialize('string', '0.003'), // swap fee rate
                bcs.serialize('u64', 1000000), // initial coin a amount
                bcs.serialize('u64', 1000000), // initial coin b amount
            ]
        );

        msgs.push(createPairMsg);
    }

    // Create a message to execute the 'swap_script' function on the 'dex' module
    const swapMsg = new MsgExecute(
        myAddr,
        "0x1",
        "dex",
        "swap_script",
        // [offer coin type, return coin type, lp coin type], type arguments
        ["0x1::native_uinit::Coin", pairCoin, LPToken],
        [
            bcs.serialize("u64", 100000), // offer amount
            bcs.serialize("option<u64>", null), // min return
        ]
    );

    msgs.push(swapMsg);


    // (Optional) Create a message to provide liquidity on pair
    // const provideMsg = new MsgExecute(
    //     myAddr, // sender address
    //     "0x1", // module owner
    //     "dex", // module name
    //     "provide_liquidity_script", // function name
    //     ["0x1::native_uinit::Coin", pairCoin, LPToken], // type arguments
    //     [
    //         bcs.serialize("u64", 10000), // max uinit amount for provide
    //         bcs.serialize("u64", 10000), // max basic_coin amount for provide
    //         bcs.serialize("option<u64>", null), // min liquidity token return
    //     ] // function arguments
    // );

    const signedTx = await TEST_WALLET.createAndSignTx({ msgs });
    const broadcastResult = await LCD.tx.broadcast(signedTx);

    console.log("\nTX broadcasted, waiting for the result\n");

    pollingTx(broadcastResult.txhash)

    // Reload the balance after the swap
    myBalance = await LCD.bank.balance(myAddr);

    console.log("------------------After Swap------------------");
    console.log("my balances: ", myBalance[0].map((coin) => coin.toString()));
}

swap()



