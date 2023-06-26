import { MnemonicKey, MsgSend } from '@initia/initia.js';
import { 
    LCD,
    TEST_WALLET,
    TEST_KEY
} from './config';
import { pollingTx } from './utils'
const senderAddr = TEST_KEY.accAddress;

async function transferToken(){
    // Generate a new key for the recipient
    const recipientKey = new MnemonicKey();
    const recipientAddr = recipientKey.accAddress;

    // Get balances of the recipient and sender
    let recipientBalance = await LCD.bank.balance(recipientAddr);
    let senderBalance = await LCD.bank.balance(senderAddr);

    console.log('------------------Before Transfer------------------');
    console.log('recipient balances:', recipientBalance[0].map(coin => coin.toString()));
    console.log('my balances:', senderBalance[0].map(coin => coin.toString()));

    // Create a new MsgSend object with the sender and recipient addresses and the amount to send
    const sendMsg = new MsgSend(senderAddr, recipientAddr, '1000uinit');
    
    // Sign and Broadcast the transaction
    const signedTx = await TEST_WALLET.createAndSignTx({ msgs: [sendMsg] });
    const broadcastResult = await LCD.tx.broadcast(signedTx);

    console.log('\nTX broadcasted, waiting for the result\n');
    
    pollingTx(broadcastResult.txhash)
    
    // Reload balances of the recipient and sender
    recipientBalance = await LCD.bank.balance(recipientAddr);
    senderBalance = await LCD.bank.balance(senderAddr);

    console.log('------------------After Transfer------------------');
    console.log('recipient balances:', recipientBalance[0].map(coin => coin.toString()));
    console.log('my balances:', senderBalance[0].map(coin => coin.toString()));
}   

transferToken();