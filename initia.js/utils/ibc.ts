import {
    BCS,
    LCDClient,
    sha256,
    MnemonicKey,
} from '@initia/initia.js';
import { delay } from 'bluebird';

const bcs = BCS.getInstance();


export function structTagToIbcHash(channelId: string, structTag: string) {
    const fullTrace = `nft-transfer/${channelId}/${structTag}`;
    const shaSum = sha256(Buffer.from(fullTrace));
    const hash = Buffer.from(shaSum).toString('hex').toUpperCase();
    return hash;
  }
  
export function structTagToMoveHash(structTag: string) {
    const shaSum = sha256(Buffer.from(structTag));
    const hash = Buffer.from(shaSum).toString('hex').toUpperCase();
    return hash;
}
  
export async function pollingNftRecieve(
    lcd: LCDClient,
    key: MnemonicKey, 
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