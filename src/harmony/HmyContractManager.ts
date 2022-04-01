import { rpcErrorMessage } from './helpers';
const BN = require('bn.js');
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { sleep } from '../utils/index';
import logger from '../logger';
import { mulDecimals } from './helpers';
const log = logger.module('HmyContractManager:main');

export interface IHmyContractManager {
  contractAddress: string;
  contractAbi: any;
  nodeUrl: string;
}

export interface TransactionReceipt {
  blockHash: string;
  blockNumber: number;
  contractAddress: null;
  cumulativeGasUsed: number;
  events: Record<string, unknown>;
  gasUsed: number;
  logsBloom: string;
  status: boolean;
  to: string;
  from: string;
  transactionHash: string;
}

const HMY_GAS_LIMIT = 6721900;

export class HmyContractManager {
  web3: Web3;
  contract: Contract;
  masterAddress: string;
  contractAddress: string;
  contractAbi: any;

  constructor(params: IHmyContractManager) {
    this.web3 = new Web3(params.nodeUrl);
    this.contractAbi = params.contractAbi;
    this.contractAddress = params.contractAddress;
  }

  init = async (hmyPrivateKey: string) => {
    const ethMasterAccount =
      this.web3.eth.accounts.privateKeyToAccount(hmyPrivateKey);
    this.web3.eth.accounts.wallet.add(ethMasterAccount);
    this.web3.eth.defaultAccount = ethMasterAccount.address;

    this.masterAddress = ethMasterAccount.address;
    this.contract = new this.web3.eth.Contract(
      this.contractAbi,
      this.contractAddress,
    );
  };

  getVaultInfo = async () => {
    const vault = await this.contract.methods.vaults(this.masterAddress).call();
    return vault.btcPublicKeyX === '0'
      ? null
      : {
          btcPublicKeyX: vault.btcPublicKeyX,
          btcPublicKeyY: vault.btcPublicKeyY,
          collateral: vault.collateral,
          issued: vault.issued,
          toBeIssued: vault.toBeIssued,
          toBeRedeemed: vault.toBeRedeemed,
          replaceCollateral: vault.replaceCollateral,
          toBeReplaced: vault.toBeReplaced,
        };
  };

  getUserBalance = async () => {
    const balance = await this.web3.eth.getBalance(this.masterAddress);
    return Number(balance) / 1e18;
  };

  register = async (collateral: string, pubX, pubY) => {
    let vault = await this.getVaultInfo();

    if (!vault) {
      const value = this.web3.utils.toWei(collateral);

      try {
        await this.contract.methods.registerVault(pubX, pubY).send({
          from: this.masterAddress,
          gas: HMY_GAS_LIMIT,
          gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)),
          value,
        });
      } catch (e) {
        if (rpcErrorMessage(e)) {
          // log.error('register exception rpcErrorMessage', { collateral, pubX, pubY, error: e });
          log.info('register rpc error - another attempt in 10s ...');

          await sleep(10000);

          return await this.register(collateral, pubX, pubY);
        } else {
          throw e;
        }
      }

      vault = await this.getVaultInfo();
    }

    return vault;
  };

  getGasPrice = async () => {
    return new BN(await this.web3.eth.getGasPrice()).mul(new BN(1));
  };

  lockAdditionalCollateral = async (
    amount: number | string,
  ): Promise<TransactionReceipt> => {
    const gasPrice = await this.getGasPrice();

    return this.contract.methods.lockAdditionalCollateral().send({
      value: mulDecimals(amount, 18),
      from: this.masterAddress,
      gas: HMY_GAS_LIMIT,
      gasPrice,
    });
  };

  withdrawCollateral = async (
    amount: number | string,
  ): Promise<TransactionReceipt> => {
    const gasPrice = await this.getGasPrice();

    return this.contract.methods
      .withdrawCollateral(mulDecimals(amount, 18))
      .send({
        from: this.masterAddress,
        gas: HMY_GAS_LIMIT,
        gasPrice,
      });
  };
}
