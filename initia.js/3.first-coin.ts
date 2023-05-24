import { AccAddress, MsgExecute, BCS } from '@initia/initia.js';
import { 
    lcd,
    wallet,
    key
} from './config';

const myAddr = key.accAddress;
const bcs = BCS.getInstance();

async function registerCoin() {
    try{
        // Create a message to execute the "register" function on the "coin" module
        const executeMsg = new MsgExecute(
            myAddr, // sender
            "0x1", // module address
            "coin", // module name
            "register", // function name
            [`${AccAddress.toHex(myAddr)}::basic_coin::Coin`], // type arguments
            [] // argument
        );

        const signedTx = await wallet.createAndSignTx({ msgs: [executeMsg] });
        const broadcastResult = await lcd.tx.broadcast(signedTx);

        console.log("\nTX broadcasted, waiting for the result\n");

        // polling tx, waiting for block creation
        let polling = setInterval(async () => {
            const txResult = await lcd.tx
                .txInfo(broadcastResult.txhash)
                .catch((_) => undefined);
            if (txResult) {
                clearInterval(polling);

                // Retrieve coin store information for the specified type
                lcd.move.resource( myAddr, `0x1::coin::CoinStore<${AccAddress.toHex(myAddr)}::basic_coin::Coin>`)
                    .then((res) => console.log(res));
            }
        }, 1000);
    } catch(e){
        console.log("if you see this, it might mean you have already registered the coin store.");
    }
    
}

async function mintCoin(){
    // Create an execute msg
    // Execute the 'mint_to' function of the 'basic_coin' module
    const executeMsg = new MsgExecute(
        myAddr, // sender
        myAddr, // module address, in this case, the module owner is myAddr
        "basic_coin", // module name
        "mint_to", // function name
        [], // type argument
        [
          bcs.serialize("u64", 1000000), // amount
          bcs.serialize("address", AccAddress.toHex(myAddr)), // to
        ]
    );
    // sign tx
    const signedTx = await wallet.createAndSignTx({ msgs: [executeMsg] });
    // broadcast tx
    const broadcastResult = await lcd.tx.broadcast(signedTx);
  
    console.log("\nTX broadcasted, waiting for the result\n");
  
    // polling tx, waiting for block creation
    let polling = setInterval(async () => {
      const txResult = await lcd.tx
        .txInfo(broadcastResult.txhash)
        .catch((_) => undefined);
      if (txResult) {
        clearInterval(polling);
  
        // Check the balance of the specified address for the specified coin
        lcd.move
          .viewFunction(
            "0x1",
            "coin",
            "balance",
            [`${AccAddress.toHex(myAddr)}::basic_coin::Coin`],
            [bcs.serialize("address", AccAddress.toHex(myAddr))]
          )
          .then((res) => console.log(`my balance: ${res}`))
          .catch((e) => console.log(e));
      }
    }, 1000);
}

registerCoin(); // WARNING: Register Only Once! Don't call twice
mintCoin();

