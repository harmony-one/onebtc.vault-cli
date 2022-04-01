import { loadKey } from './load-keys';
import { convertBtcKeyToHex } from './helpers';
import signale from 'signale';
import { abi as oneBtcAbi } from '../abi/OneBtc';
import { HmyContractManager } from '../harmony/HmyContractManager';
import { bn } from '../utils';
import { Buffer } from 'buffer';
const bitcoin = require('bitcoinjs-lib');

interface VaultInitParams {
  walletType: string;
  envPath: string;
  awsPath: string;
}

interface IVaultCli {
  contractAddress?: string;
  hmyNodeUrl?: string;
}

export interface IVault {
  btcPublicKeyX: string;
  btcPublicKeyY: string;
  collateral: string;
  issued: string;
  toBeIssued: string;
  toBeRedeemed: string;
  replaceCollateral: string;
  toBeReplaced: string;
}

export class VaultCli {
  hmyPrivateKey: string;
  btcPrivateKey: string;
  hmyContractManager: HmyContractManager;

  contractAbi = oneBtcAbi;
  contractAddress = '0xdc54046c0451f9269FEe1840aeC808D36015697d';
  // hmyNodeUrl = 'https://api.harmony.one';
  hmyNodeUrl = 'https://bridge.api.s0.t.hmny.io';

  vault: IVault;

  constructor(props?: IVaultCli) {
    if (props?.contractAddress) {
      this.contractAddress = props.contractAddress;
    }

    if (props?.hmyNodeUrl) {
      this.hmyNodeUrl = props.hmyNodeUrl;
    }
  }

  init = async ({ envPath, awsPath, walletType }: VaultInitParams) => {
    if (!['env', 'aws'].includes(walletType)) {
      throw new Error(`Wrong wallet type: ${walletType}`);
    }

    this.hmyPrivateKey = await loadKey({
      walletType,
      envKeyFile: envPath,
      awsKeyFile: `${awsPath}/hmy-secret`,
      envKey: 'HMY_VAULT_PRIVATE_KEY',
      dbKey: 'hmyPrivateKey',
      name: 'Harmony',
    });

    const btcPrivateKey = await loadKey({
      walletType,
      envKeyFile: envPath,
      awsKeyFile: `${awsPath}/btc-secret`,
      envKey: 'BTC_VAULT_PRIVATE_KEY',
      dbKey: 'btcPrivateKey',
      name: 'BTC',
    });

    this.btcPrivateKey = convertBtcKeyToHex(btcPrivateKey);

    this.hmyContractManager = new HmyContractManager({
      contractAddress: this.contractAddress,
      contractAbi: this.contractAbi,
      nodeUrl: this.hmyNodeUrl,
    });

    await this.hmyContractManager.init(this.hmyPrivateKey);

    // additional check for BTC PK
    this.vault = await this.hmyContractManager.getVaultInfo();

    if (!!this.vault && !this.checkBTCKey(this.vault)) {
      throw new Error(
        'BTC private key does not match registered public address',
      );
    }

    const userBalance = await this.hmyContractManager.getUserBalance();
    signale.success('User balance:', userBalance, 'ONE');

    signale.complete('Client succefully init');
  };

  checkBTCKey = (vault: IVault) => {
    if (!vault) {
      return false;
    }

    const vaultEcPair = bitcoin.ECPair.fromPrivateKey(
      Buffer.from(this.btcPrivateKey, 'hex'),
      { compressed: false },
    );

    const pubX = bn(vaultEcPair.publicKey.slice(1, 33));
    const pubY = bn(vaultEcPair.publicKey.slice(33, 65));

    return (
      String(pubX) === vault.btcPublicKeyX &&
      String(pubY) === vault.btcPublicKeyY
    );
  };

  info = async () => {
    const vault = await this.hmyContractManager.getVaultInfo();

    return {
      registered: !!vault,
      vaultAddress: this.hmyContractManager.masterAddress,
      vaultInfo: vault,
      contract: this.contractAddress,
    };
  };

  register = async (collateral: string) => {
    if (!!this.vault) {
      throw new Error(
        `Vault ${this.hmyContractManager.masterAddress} already registered`,
      );
    }

    const vaultEcPair = bitcoin.ECPair.fromPrivateKey(
      Buffer.from(this.btcPrivateKey, 'hex'),
      { compressed: false },
    );

    const pubX = bn(vaultEcPair.publicKey.slice(1, 33));
    const pubY = bn(vaultEcPair.publicKey.slice(33, 65));

    return await this.hmyContractManager.register(collateral, pubX, pubY);
  };

  lock = async (amount: string) => {
    if (!this.vault) {
      throw new Error(
        `Vault ${this.hmyContractManager.masterAddress} not registered`,
      );
    }

    if (isNaN(Number(amount)) || !Number(amount)) {
      throw new Error(`Wrong deposit amount`);
    }

    const res = await this.hmyContractManager.lockAdditionalCollateral(amount);

    return {
      status: res.status,
      transactionHash: res.transactionHash,
      events: res.events,
    };
  };

  withdrawCollateral = async (amount: string) => {
    if (!this.vault) {
      throw new Error(
        `Vault ${this.hmyContractManager.masterAddress} not registered`,
      );
    }

    if (isNaN(Number(amount)) || !Number(amount)) {
      throw new Error(`Wrong deposit amount`);
    }

    const res = await this.hmyContractManager.withdrawCollateral(amount);

    return {
      status: res.status,
      transactionHash: res.transactionHash,
      events: res.events,
    };
  };
}
