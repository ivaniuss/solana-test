const { exec } = require("child_process");
const axios = require('axios').default;
const COMMANDS = "sudo ts-node /home/ivaniuss/metaplex/js/packages/cli/src/candy-machine-v2-cli.ts upload -e devnet -k ~/.config/solana/devnet.json -cp /home/ivaniuss/metaplex/js/packages/cli/example-candy-machine-upload-config.json /home/ivaniuss/metaplex/assets"
// const COMMANDS = "l -la" 
const PATH = "https://metrics.solana.com/api/datasources/proxy/1/query?db=mainnet-beta&q=SELECT%20SUM(%22len%22%20)%20%20FROM%20%22mainnet-beta%22.%22autogen%22.%22send_transaction_service-queue-size%22%20WHERE%20time%20%3E%3D%20now()%20-%2015m%20and%20time%20%3C%3D%20now()%20GROUP%20BY%20time(10s)%0A%0A%0A&epoch=ms"

const MAX_TRIES = 3;
const AVERAGE_EXPECTED = 20000 //20k transactions
const TIME_TO_START_AGAIN =  60*1000 * 60 * 2 //2 hours
let tries = 0;

const executionCommands = () => {
    exec(COMMANDS, (error, stdout, stderr) => {
        if (stderr || error) {
            console.log(`stderr or error: ${error}`);
            if (tries < MAX_TRIES) setTimeout(() => {
                tries++;
                executionCommands();
            }, 1000)
            else{
                init()
            }
            return;
        }
        console.log(`stdout: ${stdout}`);
        });
}

const init = async() => {
    try {
        const {data} = await axios(PATH);
        const metrics =  data.results[0]?.series[0]?.values;
        let totalMetrics = 0;
        metrics.map(value => {
            totalMetrics += value[1];
        })
        const averageMetrics = totalMetrics / metrics.length;
        console.log(`average metrics: ${parseInt(averageMetrics/1000)}k...`)
        if (averageMetrics <= AVERAGE_EXPECTED){
            console.log('testing...')
            executionCommands()
            tries = 0

        }
        else{
            console.log(`waiting for a while ${TIME_TO_START_AGAIN/(1000*60*60)} hours to try again...`)
            setTimeout(function () {
                init()
            }, TIME_TO_START_AGAIN);
        
        }
    } catch (error) {
        console.log(error)
    }
    
}

init()