import signale from 'signale';
import { asyncHandler } from './utils';
import { VaultCli } from './VaultCli';
import { Command } from 'commander';
const program = new Command();

program
  .name('vault-cli')
  .description('CLI to mange 1BTC Vault collateral')
  .version('1.0.0');

// program
//   .command('split')
//   .description('Split a string into substrings and display as an array')
//   .argument('<string>', 'string to split')
//   .option('--first', 'display just the first substring')
//   .option('-s, --separator <char>', 'separator character', ',')
//   .action((str, options) => {
//     const limit = options.first ? 1 : undefined;
//     console.log(str.split(options.separator, limit));
//   });

program
  .command('info')
  .description('Get vault info')
  .option('--wallet <string>', 'wallet type: env | aws | console', 'env')
  .option(
    '--env-path <string>',
    'env file path, ./keys/.env.private by default',
    './keys/.env.private',
  )
  .option('--aws-path <string>', 'aws dir path, ./keys by default', './keys')
  .action(
    asyncHandler(async (options) => {
      const vaultCli = new VaultCli();

      await vaultCli.init({
        walletType: options['wallet'],
        envPath: options['envPath'],
        awsPath: options['awsPath'],
      });

      const info = await vaultCli.info();

      signale.success('Vault info', info);
    }),
  );

program
  .command('register')
  .description('Register vault')
  .argument('<amount>', 'initial amount')
  .option('--wallet <string>', 'wallet type: env | aws | console', 'env')
  .option(
    '--env-path <string>',
    'env file path, ./keys/.env.private by default',
    './keys/.env.private',
  )
  .option('--aws-path <string>', 'aws dir path, ./keys by default', './keys')
  .action(
    asyncHandler(async (amount, options) => {
      const vaultCli = new VaultCli();

      await vaultCli.init({
        walletType: options['wallet'],
        envPath: options['envPath'],
        awsPath: options['awsPath'],
      });

      const info = await vaultCli.register(amount);

      signale.complete('Register complete', info);
    }),
  );

program
  .command('lock')
  .description('Lock additional vault collateral')
  .argument('<amount>', 'lock amount')
  .option('--wallet <string>', 'wallet type: env | aws | console', 'env')
  .option(
    '--env-path <string>',
    'env file path, ./keys/.env.private by default',
    './keys/.env.private',
  )
  .option('--aws-path <string>', 'aws dir path, ./keys by default', './keys')
  .action(
    asyncHandler(async (amount, options) => {
      const vaultCli = new VaultCli();

      await vaultCli.init({
        walletType: options['wallet'],
        envPath: options['envPath'],
        awsPath: options['awsPath'],
      });

      signale.pending(`Locking ${amount} ONE to Vault collateral`);

      const info = await vaultCli.lock(amount);

      signale.complete('Additional collateral successfully locked');
      signale.info(info);
    }),
  );

program
  .command('withdraw')
  .description('Withdraw collateral')
  .argument('<amount>', 'withdraw amount')
  .option('--wallet <string>', 'wallet type: env | aws | console', 'env')
  .option(
    '--env-path <string>',
    'env file path, ./keys/.env.private by default',
    './keys/.env.private',
  )
  .option('--aws-path <string>', 'aws dir path, ./keys by default', './keys')
  .action(
    asyncHandler(async (amount, options) => {
      const vaultCli = new VaultCli();

      await vaultCli.init({
        walletType: options['wallet'],
        envPath: options['envPath'],
        awsPath: options['awsPath'],
      });

      signale.pending(`Withdrawing ${amount} ONE to user address`);

      const info = await vaultCli.withdrawCollateral(amount);

      signale.complete('Collateral successfully Withdrawed');
      signale.info(info);
    }),
  );

program.parse();
