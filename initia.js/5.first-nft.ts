import {
    AccAddress,
    MsgPublish,
    MsgExecute,
    BCS,
    Msg
} from "@initia/initia.js";
import { 
    LCD,
    TEST_WALLET,
    TEST_KEY
} from './config';
import { pollingTx } from './utils';
import { MoveBuilder } from '@initia/builder.js';
import path from 'path';

const testAddr = TEST_KEY.accAddress;
const bcs = BCS.getInstance();


async function publishNftController() {
  // Compile contract and read the compiled module bytes
  const builder = new MoveBuilder(path.resolve(__dirname, "../move/nft_controller"), {});
  await builder.build();
  const compiledModuleBytes = await builder.get("nft_controller");
  const base64EncodedModuleBytes = compiledModuleBytes.toString('base64');

  // Create a new message to publish the module
  const publishMsg = new MsgPublish(testAddr, [base64EncodedModuleBytes], 1);

  const signedTx = await TEST_WALLET.createAndSignTx({ msgs: [publishMsg] });
  const broadcastResult = await LCD.tx.broadcast(signedTx);

  pollingTx(broadcastResult.txhash)
  // Retrieve the NFT controller module information published by the given address
  LCD.move.module(testAddr, "nft_controller").then((res) => console.log(res));

  console.log("Done for publish...\n")
}

async function registerNft() { 
  const msgs: Msg[] = [];


  // Check if the account is registered on the DEX module
  const isNftRegistered = await LCD.move.module(testAddr, "nft_controller");

  if (isNftRegistered) {
    console.log("Nft is already registered!")
    return
  }

  const initializeMsg = new MsgExecute(
    testAddr,
    testAddr,
    "nft_controller",
    "initialize",
    [],
    []);
  
  msgs.push(initializeMsg)

  const registerMsg = new MsgExecute(
      testAddr,
      "0x1",
      "nft",
      "register",
      [`${AccAddress.toHex(testAddr)}::nft_controller::Metadata`], // type arguments
      []
  );

  msgs.push(registerMsg)

  const signedTx = await TEST_WALLET.createAndSignTx({ msgs: msgs });
  const broadcastResult = await LCD.tx.broadcast(signedTx);

  pollingTx(broadcastResult.txhash)

  // Check the result of the token store published in the NFT
  LCD.move.resource(
    testAddr,
    `0x1::nft::TokenStore<${AccAddress.toHex(testAddr)}::nft_controller::Metadata>`)
    .then((res) => console.log(res));
  
  console.log("Done for register...\n")
}
  
async function mintNft(){
  const mintNftMsg = new MsgExecute(
      testAddr,
      testAddr,
      "nft_controller",
      "mint_to",
      [],
      [
        bcs.serialize("address", AccAddress.toHex(testAddr)), // Recipient's address
        bcs.serialize("string", "token_id_3"), // Token ID
        bcs.serialize("string", "https://initia.co"), // Token URI
        bcs.serialize("u64", 1234), // Numeric value of the token
        bcs.serialize("string", "value"), // String value of the token
      ]
    );

    const signedTx = await TEST_WALLET.createAndSignTx({ msgs: [mintNftMsg] });
    const broadcastResult = await LCD.tx.broadcast(signedTx);
  
    pollingTx(broadcastResult.txhash)

    // Retrieve nft information
    const nftIds = await LCD.move.viewFunction(
      "0x1",
      "nft",
      "token_ids",
      // The name of the module and the entrypoint
      [`${AccAddress.toHex(testAddr)}::nft_controller::Metadata`],
      [
        bcs.serialize("address", AccAddress.toHex(testAddr)),
        bcs.serialize("option<string>", null),
        bcs.serialize("u8", 10),
      ]
    );

    // Call the "get_token_infos" entry function of the "nft" module, passing in the serialized
    // nftIds as the input parameter.
    LCD.move.viewFunction(
        "0x1",
        "nft",
        "get_nft_infos",
        [`${AccAddress.toHex(testAddr)}::nft_controller::Metadata`],
        [bcs.serialize("vector<string>", nftIds)])
      .then((res) => console.log(res));
    
    console.log("Done for mint...\n")
}

async function main(){
  await publishNftController();
  await registerNft();
  await mintNft();
  
}

main()
