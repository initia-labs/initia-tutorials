import {
    BCS,
    LCDClient,
    MnemonicKey,
    Msg,
    MsgExecute,
    MsgNftTransfer,
    Wallet,
    sha256,
  } from '@initia/initia.js';
  import { Height } from '@initia/initia.js/dist/core/ibc/core/client/Height';
  import { delay } from 'bluebird';
  
  // Wallet for tutorial
  const key = new MnemonicKey({
    mnemonic:
      'combine ship vivid lizard foster busy mad service sister earn bubble beach receive tenant seminar dune brush surprise security wine wrong film female dinosaur',
  });
  
  // Initia Chain Settings
  const initiaLCD = new LCDClient('https://next-stone-rest.initia.tech/', {
    chainId: 'stone-8',
    gasPrices: '0.15uinit',
    gasAdjustment: '2.0',
  });
  const initiaWallet = new Wallet(initiaLCD, key);
  const initiaChannel = 'channel-1';
  
  // Minitia Chain Settings
  const minitiaLCD = new LCDClient('http://localhost:1317/', {
    chainId: 'minitia-2',
    gasPrices: '0.15ustake',
    gasAdjustment: '2.0',
  });
  const minitiaWallet = new Wallet(minitiaLCD, key);
  const minitiaChannel = 'channel-0';
  
  const bcs = BCS.getInstance();
  
  
  // Use your own NFT module and Publish it on the Initia chain
  const username = 'nft-test30';
  const nftModuleAddr = '0x589b1e861579c3f07092859db5f8963e1dac50f1'
  const nftModuleName = 'usernames'
  
  async function mintNft(){
    const msgs: Msg[] = [
      new MsgExecute(
        key.accAddress,
        nftModuleAddr,
        nftModuleName,
        'register_domain',
        [],
        [
          bcs.serialize('string', username),
          bcs.serialize('u64', 31557600 * 10)
        ]
      ),
    ];
    
    await initiaWallet
      .createAndSignTx({
        msgs,
      })
      .then(res => {
        return initiaLCD.tx.broadcastSync(res);
      })
      .then(res => console.log(res))
      .catch(e => console.log(e));
  }
  
  async function transferNftToMinitia(initiaClassId: string, tokenId: string){
    const msgs = [
      new MsgNftTransfer(
        'nft-transfer',
        initiaChannel,
        initiaClassId,
        [tokenId],
        key.accAddress,
        key.accAddress,
        new Height(0, 0),
        ((new Date().valueOf() + 600000) * 1e6).toString(), // 10 mins timeout
        ''
      ),
    ];
  
    await initiaWallet
      .createAndSignTx({
        msgs,
      })
      .then(res => {
        return initiaLCD.tx.broadcastSync(res);
      })
      .then(res => console.log(res))
      .catch(e => console.log(e));
  }
  
  async function registerNftToMinitia(structTag: string){
    let isAccountRegistered = await minitiaLCD.move.viewFunction<boolean>(
      '0x1',
      'nft',
      'is_account_registered',
      [structTag],
      [bcs.serialize('address', key.accAddress)]
    );
  
    if (!isAccountRegistered) {
      // TXa: register nft store
      const msgs = [
        new MsgExecute(key.accAddress, '0x1', 'nft', 'register', [structTag]),
      ];
  
      await minitiaWallet
        .createAndSignTx({
          msgs,
        })
        .then(res => {
          return minitiaLCD.tx.broadcastSync(res);
        })
        .then(res => console.log(res))
        .catch(e => console.log(e));
  
      while (!isAccountRegistered) {
        isAccountRegistered = await minitiaLCD.move.viewFunction<boolean>(
          '0x1',
          'nft',
          'is_account_registered',
          [structTag],
          [bcs.serialize('address', key.accAddress)]
        );
  
        await delay(1000);
      }
    }
  }
  
  async function returnNftToInitia(denom: string, tokenId: string){
    const msgs = [
      new MsgNftTransfer(
        'nft-transfer',
        minitiaChannel,
        denom,
        [tokenId],
        key.accAddress,
        key.accAddress,
        new Height(0, 0),
        ((new Date().valueOf() + 600000) * 1e6).toString(), // 10 mins timeout
        ''
      ),
    ];
  
    await minitiaWallet
      .createAndSignTx({
        msgs,
      })
      .then(res => {
        return minitiaLCD.tx.broadcastSync(res);
      })
      .then(res => console.log(res))
      .catch(e => console.log(e));
  }
  
  
  
  async function main() {
    // Step1. Mint NFT
    mintNft();
  
    // wait for a block
    let tokenId = await pollingNftRecieve(
      initiaLCD,
      '0x589b1e861579c3f07092859db5f8963e1dac50f1::metadata::Metadata',
      username + ':'
    );
  
    console.log(`new token minted, token id is ${tokenId}`);
    const initiaClassId = `move/${structTagToMoveHash(
      '0x589b1e861579c3f07092859db5f8963e1dac50f1::metadata::Metadata'
    )}`;
    //Step2. Transfer nft to minitia
    transferNftToMinitia(initiaClassId, tokenId);
  
    const hash = structTagToIbcHash(minitiaChannel, initiaClassId);
    const denom = `ibc/${hash}`;
    const structTag = `0x1::ibc_${hash}::Extension`;
  
    // if it is the first transfer for the collection, need to wait until transfer done.
    let collectionExists = await minitiaLCD.move
      .resource('0x1', `0x1::nft::NftCollection<${structTag}>`)
      .catch(_ => undefined);
  
    while (!collectionExists) {
      collectionExists = await minitiaLCD.move
        .resource('0x1', `0x1::nft::NftCollection<${structTag}>`)
        .catch(_ => undefined);
  
      await delay(1000);
    }
    return;
    // Step 3. Reigster nft to Minitia Nft store if not exists
    registerNftToMinitia(structTag)
  
    tokenId = await pollingNftRecieve(minitiaLCD, structTag, username + ':');
    console.log(`minitia wallet recieved ${tokenId}`);
  
    // Step 4: Return nft from minitia to initia
    returnNftToInitia(denom, tokenId);
  
    tokenId = await pollingNftRecieve(
      initiaLCD,
      '0x589b1e861579c3f07092859db5f8963e1dac50f1::metadata::Metadata',
      username + ':'
    );
    console.log(`initia wallet recieved ${tokenId}`);
  }
  
  main().catch(e => {
    console.log(e);
    return;
  });
  
  //
  // util functions
  //
  
  function structTagToIbcHash(channelId: string, structTag: string) {
    const fullTrace = `nft-transfer/${channelId}/${structTag}`;
    const shaSum = sha256(Buffer.from(fullTrace));
    const hash = Buffer.from(shaSum).toString('hex').toUpperCase();
    return hash;
  }
  
  function structTagToMoveHash(structTag: string) {
    const shaSum = sha256(Buffer.from(structTag));
    const hash = Buffer.from(shaSum).toString('hex').toUpperCase();
    return hash;
  }
  
  async function pollingNftRecieve(
    lcd: LCDClient,
    structTag: string,
    tokenIdPart: string
  ): Promise<string> {
    let tokenIds = await lcd.move.viewFunction<string[]>(
      '0x1',
      'nft',
      'token_ids',
      [structTag],
      [
        bcs.serialize('address', key.accAddress),
        bcs.serialize('option<string>', null),
        bcs.serialize('u8', 30),
      ]
    );
  
    let tokenId = tokenIds.find(id => id.indexOf(tokenIdPart) !== -1);
  
    while (tokenId === undefined) {
      tokenIds = await lcd.move.viewFunction<string[]>(
        '0x1',
        'nft',
        'token_ids',
        [structTag],
        [
          bcs.serialize('address', key.accAddress),
          bcs.serialize('option<string>', null),
          bcs.serialize('u8', 30),
        ]
      );
  
      tokenId = tokenIds.find(id => id.indexOf(tokenIdPart) !== -1);
  
      await delay(1000);
    }
  
    return tokenId;
  }