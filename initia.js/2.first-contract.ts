import { MsgPublish } from '@initia/initia.js';
import { 
    lcd,
    wallet,
    key
} from './config';
import { MoveBuilder } from '@initia/builder.js';
import path from 'path';

const myAddr = key.accAddress;

async function compileContract(): Promise<string> {
    // Compile contract and read the compiled module bytes
    const builder = new MoveBuilder(path.resolve(__dirname, "../move/basic_coin"), {});
    await builder.build();
    const compiledModuleBytes = await builder.get("basic_coin");
    const base64EncodedModuleBytes = compiledModuleBytes.toString('base64');

    return base64EncodedModuleBytes;
}

async function deployContract() {
    const base64EncodedModuleBytes = await compileContract()

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