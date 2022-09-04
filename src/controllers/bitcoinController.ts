import { Request, Response } from "express";
import bitcoin from "bitcoinjs-lib";
import axios from "axios";
const CoinKey = require("coinkey");
const ci = require("coininfo");
const { ECPairFactory } = require("ecpair");
const tinysecp = require("tiny-secp256k1");

const ECPair = ECPairFactory(tinysecp);

const validator = (pubkey: string, msghash: string, signature: string) =>
    ECPair.fromPublicKey(pubkey).verify(msghash, signature);

const bitcoinAccount = {
    address: "mhQfuHdrCRK589SWV7y5zCovazvkk9WgaG",
    privateKey:
        "bf7fb839d63d017bf33a727839804d6dc018aa4a7b203d315c1203bc740091be",
};

const bitcoinOwnerAddress = "2N4HLecwbJbxmVeyrxSHm2Ly763eUHUpZ1s";

/**
 * POST /bitcoin/createAccount
 * REST API.
 */
export const createAccount = async (
    req: Request,
    res: Response,
): Promise<void> => {
    const wallet = new CoinKey.createRandom(ci("BTC-TEST"));
    res.json({
        publicAddress: wallet.publicAddress,
        privateKey: wallet.privateKey.toString("hex"),
    });
};

/**
 * POST /bitcoin/createAccount
 * REST API.
 */
export const sendBitcoinToOwner = async (
    req: Request,
    res: Response,
): Promise<void> => {
    //create random account using bitcoinjs-lib
    const network = bitcoin.networks.testnet;
    const keypair = ECPair.makeRandom({ network });
    const pubkey = keypair.publicKey;
    const { address } = bitcoin.payments.p2pkh({ pubkey, network });
    const outputNumber = 0;

    //====================  unspent transactions ==================
    const networkName = "BTCTEST";
    const apiUrl = `https://sochain.com/api/v2`;

    const utxos = await axios.get(
        `${apiUrl}/get_tx_unspent/${networkName}/${bitcoinAccount.address}`,
    );

    let totalAmountAvailable = 0;
    let inputs: any[] = [];
    let inputCount = 0;

    const txs = utxos.data.data.txs;

    await Promise.all(
        txs.map(async (element: any) => {
            let input: any = {};
            const { data } = await axios.get(
                `${apiUrl}/get_tx/${networkName}/${element.txid}`,
            );
            input.hash = element.txid;
            input.index = element.output_no;
            input.nonWitnessUtxo = Buffer.from(data.data["tx_hex"], "hex");

            totalAmountAvailable += parseFloat(element.value) * 100000000;
            inputCount += 1;
            inputs.push(input);
        }),
    );

    const outputCount = 1;
    const transactionSize =
        inputCount * 180 + outputCount * 34 + 10 - inputCount;
    const byteFee = 20;

    const satoshiToSend = 1000;
    console.log(totalAmountAvailable, "totalAmountAvailable");
    // Check if we have enough funds to cover the transaction and the fees
    if (totalAmountAvailable - satoshiToSend - transactionSize * byteFee < 0) {
        throw new Error("Balance is too low for this transaction");
    }
    //=============================================================

    //=============  Partially Signed Bitcoin Transaction =========
    const pbst = new bitcoin.Psbt({ network });
    const transaction = pbst
        .addInputs(inputs)
        .addOutput({
            address: bitcoinOwnerAddress,
            value: satoshiToSend,
        })
        .signAllInputs(
            ECPair.fromPrivateKey(
                Buffer.from(bitcoinAccount.privateKey, "hex"),
            ),
        )
        // .validateSignaturesOfAllInputs(validator)
        .finalizeAllInputs()
        .extractTransaction()
        .toHex();
    //=============================================================

    //================ send bitcoin transaction ===========================
    const result = await axios.post(`${apiUrl}/send_tx/${networkName}`, {
        tx_hex: transaction,
    });

    const url = `https://live.blockcypher.com/btc-testnet/tx/${result.data.data.txid}/`;

    res.json({
        url,
        account: {
            address,
            privateKey: keypair.privateKey.toString("hex"),
        },
        utxos: utxos.data.data.txs,
    });
};
