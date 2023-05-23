import { LCDClient, Wallet, MnemonicKey, MsgSend } from '@initia/initia.js';
import { 
    lcd,
    wallet,
    key
} from './config';

async function transferToken(){
    // Generate a new key for the recipient
    const recipientKey = new MnemonicKey();

    const recipientAddr = recipientKey.accAddress;
    const myAddr = key.accAddress;

    // Get the balance of the recipient and sender addresses
    let recipientBalance = await lcd.bank.balance(recipientAddr);
    let myBalance = await lcd.bank.balance(myAddr);

    console.log('------------------Before Transfer------------------');
    console.log('recipient balances:', recipientBalance[0].map(coin => coin.toString()));
    console.log('my balances:', myBalance[0].map(coin => coin.toString()));

    // Create a new MsgSend object with the sender and recipient addresses and the amount to send
    const sendMsg = new MsgSend(myAddr, recipientAddr, '1000uinit');
    // Sign the transaction with the wallet
    const signedTx = await wallet.createAndSignTx({ msgs: [sendMsg] });
    // Broadcast the transaction to the network
    const broadcastResult = await lcd.tx.broadcast(signedTx);

    console.log('\nTX broadcasted, waiting for the result\n');

    // Poll for the result of the transaction until it is included in a block
    let polling = setInterval(async () => {
        const txResult = await lcd.tx
            .txInfo(broadcastResult.txhash)
            .catch(_ => undefined);
        if (txResult) {
            clearInterval(polling);

            // Reload the balance of the recipient and sender addresses
            recipientBalance = await lcd.bank.balance(recipientAddr);
            myBalance = await lcd.bank.balance(myAddr);

            console.log('------------------After Transfer------------------');
            console.log('recipient balances:', recipientBalance[0].map(coin => coin.toString()));
            console.log('my balances:', myBalance[0].map(coin => coin.toString()));
        }
    }, 1000);

}

transferToken();