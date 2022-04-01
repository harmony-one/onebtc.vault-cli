import { getSecretKeyAWS } from '../../harmony/utils';
import { loadFromStdIn } from './stdin-utils';
import { loadENVfromFile } from './env';
import signale from 'signale';

export enum WALLET_TYPE {
  ENV = 'env',
  AWS = 'aws',
  DATABASE = 'database',
  CONSOLE = 'console',
}

export const loadKey = async (params: {
  walletType;
  envKeyFile;
  envKey;
  awsKeyFile;
  dbKey;
  name;
}): Promise<string> => {
  let secretKey;
  let info;

  switch (params.walletType) {
    case WALLET_TYPE.ENV:
      info = `${params.name} private key from ${params.walletType} file ${params.envKeyFile}`

      secretKey = await loadENVfromFile({
        filePath: params.envKeyFile,
        envKey: params.envKey,
      });
      break;

    case WALLET_TYPE.AWS:
      info = `${params.name} private key from ${params.walletType} file ${params.awsKeyFile}`

      secretKey = await getSecretKeyAWS(params.awsKeyFile);
      break;

    case WALLET_TYPE.CONSOLE:
      info = `${params.name} private key from ${params.walletType}`

      secretKey = await loadFromStdIn(
        `Please enter your ${params.name} private key`,
      );
      break;

    // case WALLET_TYPE.DATABASE:
    //   secretKey = await loadFromDatabase(params.dbKey, params.services);
    //   break;

    default:
      throw new Error(`Wrong wallet type ${params.walletType}`);
      break;
  }

  if (!secretKey) {
    throw new Error(`Failed to load ${info}`);
  }

  signale.success(`Loaded ${info}`);

  return secretKey;
};
