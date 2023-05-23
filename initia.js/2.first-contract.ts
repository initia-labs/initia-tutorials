import { MsgPublish } from '@initia/initia.js';
import { 
    lcd,
    wallet,
    key
} from './config';
import * as fs from "fs";
import { MoveBuilder } from '@initia/builder.js';
import path from 'path';

async function deployContract() {
    const myAddr = key.accAddress;

    // Compile contract and read the compiled module bytes
    const builder = new MoveBuilder(path.resolve(__dirname, "../move/basic-coin"), {});
    await builder.build();
    const compiledModuleBytes = await builder.get("basic_coin");
    const base64EncodedModuleBytes = compiledModuleBytes.toString('base64');

    // Create a new message to publish the module
    const publishMsg = new MsgPublish(myAddr, [base64EncodedModuleBytes], 1);

    const signedTx = await wallet.createAndSignTx({ msgs: [publishMsg] });
    const broadcastResult = await lcd.tx.broadcast(signedTx);

    console.log("\nTX broadcasted, waiting for the result\n");

    // Set up a polling interval to check for the transaction result
    let polling = setInterval(async () => {
        const txResult = await lcd.tx
            .txInfo(broadcastResult.txhash)
            .catch((_) => undefined);

        if (txResult) {
        clearInterval(polling);

        // check published
        lcd.move.module(myAddr, "basic_coin").then((res) => console.log(res));
        }
    }, 1000);
}
  
deployContract()