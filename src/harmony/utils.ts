import { KMS } from 'aws-sdk';
import { readFileSync } from 'fs';

import logger from '../logger';
const log = logger.module('AWSConfig:main');

export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

const getAwsConfig = () => {
  // [known issue] nodejs sdk won't read the region from the credentials, hence hard coding
  const region = process.env.AWS_CONFIG_REGION || 'us-west-1';
  return new KMS({ region });
};

export const awsKMS = getAwsConfig();

export const getSecretKeyAWS = (secretFileName: string) => {
  return new Promise<string>((resolve, reject) => {
    awsKMS.decrypt(
      {
        CiphertextBlob: readFileSync(`${secretFileName}`),
      },
      (err, data) => {
        if (!err) {
          const decryptedScret = data['Plaintext'].toString();

          if (decryptedScret && decryptedScret.length) {
            log.info('Secret loaded successfully', { load: decryptedScret.length });
          } else {
            log.error('Error: secret not loaded', { err });
            reject(err);
          }

          resolve(decryptedScret);
        } else {
          log.error('Error: secret not loaded', { err });
          reject(err);
        }
      }
    );
  });
};
