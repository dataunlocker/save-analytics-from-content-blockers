import { mask, unmask } from './src/modules/mask';

const command = process.argv[2];
const args = process.argv.slice(3);

const f = ({

  "mask": (path) => {
    
    if (typeof path !== 'string') {
      console.log('Please provide an argument to mask');
      return;
    }
    console.log(`Masking ${path}...`);
    console.log('Masked URL:', mask(path));
  },

  "unmask": (path) => {
    if (typeof path !== 'string') {
      console.log('Please provide an argument to unmask');
      return;
    }
    console.log('Unmasked URL:', unmask(path));
  },

})[command] || (() => console.log(`No script ${command}!`));

f(...args);