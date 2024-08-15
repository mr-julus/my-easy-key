import axios from 'axios';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';

async function getKey(url) {
  try {
    const response = await axios.get(url);
    const key = response.data.trim();
    console.log(`${key}`);
    return key;
  } catch (error) {
    console.error(error);
  }
}

async function main() {
  const rl = readline.createInterface({ input, output });
  const url = await rl.question('URL: ');
  rl.close();

  getKey(url);
}
main()
