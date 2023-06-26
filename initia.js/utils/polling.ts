import { 
    LCD,

} from '../config';


// Poll for the result
export function pollingTx(txhash : string) {
    let polling = setInterval(async () => {
        const txResult = await LCD.tx
            .txInfo(txhash)
            .catch(_ => undefined);

        console.log(`Waiting ${txhash}...`)

        if (txResult) {
            clearInterval(polling);
        }
    }, 1000);
}