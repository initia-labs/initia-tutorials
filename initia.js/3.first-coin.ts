import { AccAddress, MsgExecute, BCS } from '@initia/initia.js';
import { 
    LCD,
    TEST_WALLET,
    TEST_KEY
} from './config';
import { pollingTx } from './utils';

const testAddr = TEST_KEY.accAddress;
const bcs = BCS.getInstance();

async function registerCoin() {
    try{
        // Create a message to execute the "register" function on the "coin" module
        const executeMsg = new MsgExecute(
            testAddr, // sender
            "0x1", // module address
            "coin", // module name
            "register", // function name
            [`${AccAddress.toHex(testAddr)}::basic_coin::Coin`], // type arguments
            [] // argument
        );

        const signedTx = await TEST_WALLET.createAndSignTx({ msgs: [executeMsg] });
        const broadcastResult = await LCD.tx.broadcast(signedTx);

        console.log("\nTX broadcasted, waiting for the result\n");

        pollingTx(broadcastResult.txhash)

        // Retrieve coin store information for the specified type
        LCD.move.resource(testAddr, `0x1::coin::CoinStore<${AccAddress.toHex(testAddr)}::basic_coin::Coin>`)
            .then((res) => console.log(res));
    } catch(e){
        console.log("if you see this, it might mean you have already registered the coin store.");
    }
    
}

async function mintCoin(){
    // Create an execute msg
    // Execute the 'mint_to' function of the 'basic_coin' module
    const executeMsg = new MsgExecute(
        testAddr, // sender
        testAddr, // module address, in this case, the module owner is myAddr
        "basic_coin", // module name
        "mint_to", // function name
        [], // type argument
        [
          bcs.serialize("u64", 1000000), // amount
          bcs.serialize("address", AccAddress.toHex(testAddr)), // to
        ]
    );
    // sign tx
    const signedTx = await TEST_WALLET.createAndSignTx({ msgs: [executeMsg] });
    // broadcast tx
    const broadcastResult = await LCD.tx.broadcast(signedTx);
  
    console.log("\nTX broadcasted, waiting for the result\n");
  
    pollingTx(broadcastResult.txhash)

    // Check the balance of the specified address for the specified coin
    LCD.move
        .viewFunction(
            "0x1",
            "coin",
            "balance",
            [`${AccAddress.toHex(testAddr)}::basic_coin::Coin`],
            [bcs.serialize("address", AccAddress.toHex(testAddr))]
        )
        .then((res) => console.log(`my balance: ${res}`))
        .catch((e) => console.log(e));
}

async function main(){
    await registerCoin(); // WARNING: Register Only Once! Don't call twice
    await mintCoin();
}

main();