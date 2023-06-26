import { MsgPublish } from '@initia/initia.js';
import { 
    LCD,
    TEST_WALLET,
    TEST_KEY
} from './config';
import { pollingTx } from './utils';
import { MoveBuilder } from '@initia/builder.js';
import path from 'path';


const testAddr = TEST_KEY.accAddress;

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
    const publishMsg = new MsgPublish(testAddr, [base64EncodedModuleBytes], 1);

    const signedTx = await TEST_WALLET.createAndSignTx({ msgs: [publishMsg] });
    const broadcastResult = await LCD.tx.broadcast(signedTx);

    console.log("\nTX broadcasted, waiting for the result\n");

    pollingTx(broadcastResult.txhash)
    
    // Check whether moudle is published
    LCD.move.module(testAddr, "basic_coin").then((res) => console.log(res));
}
  
deployContract()