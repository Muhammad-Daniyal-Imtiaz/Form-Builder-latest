import 'dotenv/config';
import { decrypt } from './src/utils/encryption';

async function test() {
  const encKey = 'enc:v3:AfxmncSuYISKdFX7:JRUeb5sbadCcHMxovByQtGPsqC8ZgojNKW8KCv_Hne10KBw7Ljf2Iisr_BUVMVYD8VuuNLLDjNEmHc4Fp1_rnjUf';
  const dec = await decrypt(encKey);
  console.log('Decrypted API Key:', `"${dec}"`);
  console.log('Length:', dec.length);
}

test().catch(console.error);
