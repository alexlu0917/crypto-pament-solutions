import { Request, Response } from "express";
import Web3 from 'web3';

/**
 * POST /ethereum/createAccount
 * REST API.
 */
export const createAccount = async (req: Request, res: Response): Promise<void> => {
    const web3 = new Web3(`https://eth-ropsten.alchemyapi.io/v2/${process.env.alchemyKey}`);
    const account = web3.eth.accounts.create();
    res.json({
        address: account.address,
        privateKey: account.privateKey
    });
};
