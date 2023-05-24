import {
    AccAddress,
    MsgPublish,
    MsgExecute,
    BCS,
    Msg
  } from "@initia/initia.js";
import { 
    lcd,
    wallet,
    key
} from './config';
import { MoveBuilder } from '@initia/builder.js';
import path from 'path';

const myAddr = key.accAddress;
const bcs = BCS.getInstance();


async function publishNftController() {
  // Compile contract and read the compiled module bytes
  const builder = new MoveBuilder(path.resolve(__dirname, "../move/nft_controller"), {});
  await builder.build();
  const compiledModuleBytes = await builder.get("nft_controller");
  const base64EncodedModuleBytes = compiledModuleBytes.toString('base64');

  // Create a new message to publish the module
  const publishMsg = new MsgPublish(myAddr, [base64EncodedModuleBytes], 1);

  const signedTx = await wallet.createAndSignTx({ msgs: [publishMsg] });
  const broadcastResult = await lcd.tx.broadcast(signedTx);

  // polling tx, waiting for block creation
  let polling = setInterval(async () => {
      const txResult = await lcd.tx
        .txInfo(broadcastResult.txhash)
        .catch((_) => undefined);
      
        if (txResult) {
        clearInterval(polling);
  
        // Retrieve the NFT controller module information published by the given address
        lcd.move.module(myAddr, "nft_controller").then((res) => console.log(res));
      }
  }, 1000);

  console.log("Done for publish...\n")
}

async function registerNft() { 
  const msgs: Msg[] = [];


  // Check if the account is registered on the DEX module
  const isNftRegistered = await lcd.move.module(myAddr, "nft_controller");

  if (isNftRegistered) {
    console.log("Nft is already registered!")
    return
  }

  const initializeMsg = new MsgExecute(
    myAddr,
    myAddr,
    "nft_controller",
    "initialize",
    [],
    []);
  
  msgs.push(initializeMsg)

  const registerMsg = new MsgExecute(
      myAddr,
      "0x1",
      "nft",
      "register",
      [`${AccAddress.toHex(myAddr)}::nft_controller::Metadata`], // type arguments
      []
  );

  msgs.push(registerMsg)

  const signedTx = await wallet.createAndSignTx({ msgs: msgs });
  const broadcastResult = await lcd.tx.broadcast(signedTx);

  // polling tx, waiting for block creation
  let polling = setInterval(async () => {
      const txResult = await lcd.tx
          .txInfo(broadcastResult.txhash)
          .catch((_) => undefined);

      if (txResult) {
          clearInterval(polling);

          // Check the result of the token store published in the NFT
          lcd.move.resource(
              myAddr,
              `0x1::nft::TokenStore<${AccAddress.toHex(myAddr)}::nft_controller::Metadata>`)
              .then((res) => console.log(res));
      }
  }, 1000);
  console.log("Done for register...\n")
}
  
async function mintNft(){
  const mintNftMsg = new MsgExecute(
      myAddr,
      myAddr,
      "nft_controller",
      "mint_to",
      [],
      [
        bcs.serialize("address", AccAddress.toHex(myAddr)), // Recipient's address
        bcs.serialize("string", "token_id_3"), // Token ID
        bcs.serialize("string", "https://initia.co"), // Token URI
        bcs.serialize("u64", 1234), // Numeric value of the token
        bcs.serialize("string", "value"), // String value of the token
      ]
    );

    const signedTx = await wallet.createAndSignTx({ msgs: [mintNftMsg] });
    const broadcastResult = await lcd.tx.broadcast(signedTx);
  
    // polling tx, waiting for block creation
    let polling = setInterval(async () => {
      const txResult = await lcd.tx
        .txInfo(broadcastResult.txhash)
        .catch((_) => undefined);
      if (txResult) {
        clearInterval(polling);
  
        // Retrieve nft information
        const nftIds = await lcd.move.viewFunction(
          "0x1",
          "nft",
          "token_ids",
          // The name of the module and the entrypoint
          [`${AccAddress.toHex(myAddr)}::nft_controller::Metadata`],
          [
            bcs.serialize("address", AccAddress.toHex(myAddr)),
            bcs.serialize("option<string>", null),
            bcs.serialize("u8", 10),
          ]
        );

        // Call the "get_token_infos" entry function of the "nft" module, passing in the serialized
        // nftIds as the input parameter.
        lcd.move.viewFunction(
            "0x1",
            "nft",
            "get_nft_infos",
            [`${AccAddress.toHex(myAddr)}::nft_controller::Metadata`],
            [bcs.serialize("vector<string>", nftIds)])
          .then((res) => console.log(res));
      }
    }, 1000);
    console.log("Done for mint...\n")
}

async function main(){
  await publishNftController();
  await registerNft();
  await mintNft();
  
}

main()
