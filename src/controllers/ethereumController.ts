import { Request, Response } from "express";
import Web3 from 'web3';
import axios from 'axios';

/**
 * POST /ethereum/createAccount
 * REST API.
 */
export const createAccount = async (req: Request, res: Response): Promise<void> => {
    const web3 = new Web3(`https://eth-ropsten.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`);
    const account = web3.eth.accounts.create();
    res.json({
        address: account.address,
        privateKey: account.privateKey
    });
};

/**
 * POST /ethereum/transferEtherToOwner
 */

export const transferEtherToOwner = async (req: Request, res: Response): Promise<void> => {
    const web3 = new Web3(`https://eth-ropsten.alchemyapi.io/v2/${process.env.alchemyKey}`);

    const account = web3.eth.accounts.privateKeyToAccount(process.env.ETHEREUM_ACCOUNT_PRIVATEKEY);
    web3.eth.defaultAccount = account.address;
    
    const myBalanceWei = await web3.eth.getBalance(process.env.ETHEREUM_ACCOUNT);
    const myBalance = web3.utils.fromWei(myBalanceWei, 'ether');
    const amountToSend = req.body.amountToSend;

    if (myBalance < amountToSend) {
        res.json({
            success: false,
            message: `Low Balance. Please check the balance of ${account.address}`
        })
    }

    const response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json')
    const gasPrices = {
        low: response.data.safeLow / 10,
        medium: response.data.average / 10,
        high: response.data.fast / 10
    }
    const nonce: number = await web3.eth.getTransactionCount(process.env.ETHEREUM_ACCOUNT);

    let details = {
        to: process.env.ETHEREUM_OWNER,
        value: web3.utils.toHex( web3.utils.toWei(amountToSend, 'ether') ),
        gas: 21000,
        gasPrice: gasPrices.low * 1000000000, // converts the gwei price to wei
        nonce: nonce,
        chainId: 3,
    };

    const signedTx =await web3.eth.accounts.signTransaction(details, process.env.ETHEREUM_ACCOUNT_PRIVATEKEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    const url = `https://ropsten.etherscan.io/tx/${receipt.transactionHash}`;

    res.json({
        success: true,
        url
    });
}
