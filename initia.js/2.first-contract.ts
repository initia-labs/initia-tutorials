import { MsgPublish } from '@initia/initia.js';
import { 
    lcd,
    wallet,
    key
} from './config';
import * as os from "os";
import * as fs from "fs";


async function main() {
    const myAddr = key.accAddress;

    // Read the module from the file system using the file path
    const module = fs.readFileSync(__dirname + "/../move/basic-coin/build/basic_coin/bytecode_modules/basic_coin.mv").toString('base64');

    // Create a new message to publish the module
    const publishMsg = new MsgPublish(myAddr, [module], 1);

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
  
main()