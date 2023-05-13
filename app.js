import express from 'express';
import open from 'open';
import cache from 'memory-cache';
import exec from 'child_process';

const hostname = '127.0.0.1';
const port = 3000;

const options = {
    injectProvider: false,
    communicationLayerPreference: 'webrtc',
};

const app = express();

// var verified = false;
cache.put('verified', 0);

app.get('/', (req, res) => {
    const dynamicScript = `
        <script src="https://cdn.ethers.io/lib/ethers-5.2.umd.min.js"></script>

        <script>
        const { ethers } = window;        
        async function auth() {
            const ethereum = window.ethereum;
        
            // getting account
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            const userAddress = accounts[0]
        
            // working with contract
            console.log("preparing tx");
            const provider = new ethers.providers.Web3Provider(ethereum);
            console.log("provider created");
            const signer = provider.getSigner(userAddress);
            console.log("got signer");
        
            let abi = [
                {
                "inputs": [
                    {
                    "internalType": "uint256",
                    "name": "num",
                    "type": "uint256"
                    }
                ],
                "name": "store",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
                },
                {
                "inputs": [],
                "name": "retrieve",
                "outputs": [
                    {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
                }
            ];
        
            const contractAddress = "0x771eBDc8781e3EA1fE2F98a366e3Dd345f5Ae1ed";
        
            const contract = new ethers.Contract(contractAddress, abi, signer);
        
            console.log("sending the contract");
        
            const tx = await contract.retrieve();
            console.log(tx);
            console.log("finished");

            result = tx.toNumber();

            // send back
            fetch('/process', {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    number: result,
                   }),
              })
              .then(response => response.text())
              .then(data => {
                var outputElement = document.getElementById('output');
                outputElement.textContent = data;
                console.log('Результат от сервера:', JSON.stringify(data));
              })
              .catch(error => {
                console.error('Ошибка:', error);
              });            
        };
        
        // document.addEventListener('DOMContentLoaded', auth);
        </script>
    `;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
        <title>Validation using metamask</title>
        <button onclick="auth()" >Validate</button>
        <p id="output"></p>
        </head>
        <body>

        ${dynamicScript}
        </body>
        </html>
    `;

    res.send(html).on('finish', () => {
        // server.close();
    });
})

import bodyParser from "body-parser";

// app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.post('/process', express.urlencoded({ extended: false }), (req, res) => {
    const number = parseInt(req.body.number);
    if (isNaN(number)) {
      res.send('Error');
    } else {
      res.send(`State: ${number}`);

      if (number === 123) { // #TODO add more specific logic
        cache.put('verified', 1);
        server.close();
        server.closeAllConnections();
      }
    }
  });

const server = app.listen(3000, () => {
    console.log(`Сервер запущен на порту ${port}`);
});

(async () => {
    await open('http://localhost:3000/'); // Opens the url in the default browser
    server.on('close', () => {
        console.log(cache.get('verified'));
        if (cache.get('verified')) {
            exec.exec('echo "Hello, world!"', (error, stdout, stderr) => {
                if (error) {
                  console.error(`Command error: ${error.message}`);
                  return;
                }
                if (stderr) {
                  console.error(`Output error: ${stderr}`);
                  return;
                }
                console.log(`Result: ${stdout}`);
              });
        } else {
            return;
        }
    });
})();
