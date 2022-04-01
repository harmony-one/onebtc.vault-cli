const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

interface ILoadParams {
  filePath: string;
  envKey: string;
}

export const loadENVfromFile = async (params: ILoadParams) => {
  return new Promise((resolve, reject) => {
    try {
      // const dotenvFile = resolveApp(`${params.filePath}/.env.private`);
      const dotenvFile = resolveApp(`${params.filePath}`);

      if (fs.existsSync(dotenvFile)) {
        var myEnv = dotenv.config({
          path: dotenvFile,
        });

        dotenvExpand.expand(myEnv);

        resolve(process.env[params.envKey]);
      } else {
        reject(new Error(`${dotenvFile} not found`));
      }
    } catch (e) {
      reject(new Error(e));
    }
  });
};
