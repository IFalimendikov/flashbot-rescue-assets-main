import { providers, Wallet, utils } from 'ethers'
import {
    FlashbotsBundleProvider,
    FlashbotsBundleResolution
} from '@flashbots/ethers-provider-bundle'
import { exit } from 'process'
require('dotenv').config()

const FLASHBOTS_URL = "https://relay.flashbots.net"

const {HACKED_WALLET, RESCUER } = process.env

if (!HACKED_WALLET || !RESCUER) {
    throw new Error("Env's are missing");
}

const run = async () => {
    const provider = new providers.JsonRpcProvider('https://rpc.ankr.com/eth')

    const authSigner = Wallet.createRandom()

    const flashbotProvider = await FlashbotsBundleProvider.create(
        provider,
        authSigner,
        FLASHBOTS_URL
    )


    const rescuer = new Wallet(RESCUER).connect(provider)
    const hackedWallet = new Wallet(HACKED_WALLET).connect(provider)


    const abi = ["function transferOwnership (address) public"]

    const iface = new utils.Interface(abi)

    provider.on('block', async (blockNo) => {
        console.log('block minted', blockNo, rescuer.address)
        const targetBlock = blockNo + 2;
        const resp = await flashbotProvider.sendBundle([
            {
                signer: rescuer,
                transaction: {
                    chainId: 1,
                    type: 2,
                    to: hackedWallet.address,
                    value: utils.parseEther('0.01'),
                    maxFeePerGas: utils.parseUnits('35', 'gwei'),
                    maxPriorityFeePerGas: utils.parseUnits('13', 'gwei')
                }
            },
            {
                signer: hackedWallet,
                transaction: {
                    chainId: 1,
                    type: 2,
                    to: "0xc019C0d0DaAf9CcEC4277c0Dba0BF51348aBBE3b",
                    gasLimit: '30000',
                    data: iface.encodeFunctionData("transferOwnership", [
                        rescuer.address
                    ]),
                    maxFeePerGas: utils.parseUnits('35', 'gwei'),
                    maxPriorityFeePerGas: utils.parseUnits('13', 'gwei')
                }
            },
            {
                signer: hackedWallet,
                transaction: {
                    chainId: 1,
                    type: 2,
                    to: "0x07493F6d027De62A9A84D1F6359c85F66D55fF70",
                    gasLimit: '30000',
                    data: iface.encodeFunctionData("transferOwnership", [
                        rescuer.address
                    ]),
                    maxFeePerGas: utils.parseUnits('35', 'gwei'),
                    maxPriorityFeePerGas: utils.parseUnits('13', 'gwei')
                }
            },
            {
                signer: hackedWallet,
                transaction: {
                    chainId: 1,
                    type: 2,
                    to: "0x275Af81Cd01C435898EbF243dF609cb923c362ee",
                    gasLimit: '30000',
                    data: iface.encodeFunctionData("transferOwnership", [
                        rescuer.address
                    ]),
                    maxFeePerGas: utils.parseUnits('35', 'gwei'),
                    maxPriorityFeePerGas: utils.parseUnits('13', 'gwei')
                }
            }
        ], targetBlock)


        if ('error' in resp) {
            console.log((resp.error as any).message)
            return;
        }

        const response = await resp.wait()

        if (response === FlashbotsBundleResolution.BundleIncluded) {
            console.log('Included in block no:', targetBlock)
            exit(0)
        }
        else if (response === FlashbotsBundleResolution.BlockPassedWithoutInclusion) {
            console.log('Not included block no:', targetBlock)
        }
        else if (response === FlashbotsBundleResolution.AccountNonceTooHigh) {
            console.log('Nonce high')
            exit(1)
        }
    })
}

run()