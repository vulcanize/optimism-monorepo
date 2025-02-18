import { Contract, Wallet } from 'ethers'
import {
  Provider,
  TransactionRequest,
  TransactionResponse,
} from 'ethers/providers'
import { getLogger } from './log'
import { Logger } from '../types'

const log: Logger = getLogger('core-utils/ethereum')

/**
 * Populates and signs a transaction for the function call specified by the provided contract, function name, and args.
 *
 * @param contract The contract with a connected provider.
 * @param functionName The function name to be invoked by the returned TransactionRequest
 * @param functionArgs The arguments for the contract function to invoke
 * @param wallet The wallet with which the transaction will be signed.
 * @returns the constructed TransactionRequest.
 */
export const getSignedTransaction = async (
  contract: Contract,
  functionName: string,
  functionArgs: any[],
  wallet: Wallet
): Promise<string> => {
  let tx: TransactionRequest
  let nonce
  ;[tx, nonce] = await Promise.all([
    populateFunctionCallTx(
      contract,
      functionName,
      functionArgs,
      wallet.address
    ),
    wallet.getTransactionCount('pending'),
  ])

  tx.nonce = nonce
  return wallet.sign(tx)
}

/**
 * Populates and returns a TransactionRequest for the function call specified by the provided contract, function name, and args.
 *
 * @param contract The contract with a connected provider.
 * @param functionName The function name to be invoked by the returned TransactionRequest
 * @param functionArgs The arguments for the contract function to invoke
 * @param fromAddress The caller address for the tx
 * @returns the constructed TransactionRequest.
 */
export const populateFunctionCallTx = async (
  contract: Contract,
  functionName: string,
  functionArgs: any[],
  fromAddress?: string
): Promise<TransactionRequest> => {
  const data: string = contract.interface.functions[functionName].encode(
    functionArgs
  )
  const tx: TransactionRequest = {
    to: contract.address,
    data,
  }

  const estimateTx = { ...tx }
  if (!!fromAddress) {
    estimateTx.from = fromAddress
  }

  log.debug(
    `Getting gas limit and gas price for tx to ${
      contract.address
    } function ${functionName}, with args ${JSON.stringify(functionArgs)}`
  )

  let gasLimit
  let gasPrice
  ;[gasLimit, gasPrice] = await Promise.all([
    contract.provider.estimateGas(estimateTx),
    contract.provider.getGasPrice(),
  ])

  tx.gasLimit = gasLimit
  tx.gasPrice = gasPrice

  return tx
}

/**
 * Determines whether or not the tx with the provided hash has been submitted to the chain.
 * Note: This will return true if it has been submitted whether or not is has been mined.
 *
 * @param provider A provider to use for the fetch.
 * @param txHash The transaction hash.
 * @returns True if the tx with the provided hash has been submitted, false otherwise.
 */
export const isTxSubmitted = async (
  provider: Provider,
  txHash: string
): Promise<boolean> => {
  const tx: TransactionResponse = await provider.getTransaction(txHash)
  return !!tx
}
