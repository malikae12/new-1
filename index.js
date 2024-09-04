import { ethers } from 'ethers';
import readline from 'readline'; // Untuk mendapatkan input pengguna dari terminal
import chalk from 'chalk'; // Untuk menambahkan warna pada output terminal
import { readFileSync } from 'fs'; // Untuk membaca file JSON

const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url), 'utf-8'));

const privateKey = '0x_your_private_key'; // Pastikan formatnya benar
const tokenContractAddress = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'; // Alamat kontrak token Anda

// Definisi ABI token
const tokenAbi = [
  "function transfer(address to, uint amount) public returns (bool)",
  "function balanceOf(address account) public view returns (uint)"
];

// Buat provider dan wallet
const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// Buat instance kontrak
const tokenContract = new ethers.Contract(tokenContractAddress, tokenAbi, wallet);

// Definisikan alamat penerima
const recipient = '0xf64d3CeFdAe63560C8b1E1D0f134a54988F5260E';

// Definisikan warna dengan chalk
const orange = chalk.rgb(255, 165, 0);
const green = chalk.green;
const pink = chalk.hex('#FFC0CB'); // Warna pink
const blue = chalk.blue;
const red = chalk.red;

// Setup readline untuk mendapatkan input pengguna
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fungsi untuk meminta jumlah dan berapa kali mengirim token
rl.question(orange('Masukkan jumlah token yang ingin dikirim (dalam USDC.e): '), (inputAmount) => {
  rl.question(orange('Berapa kali Anda ingin mengirim token?: '), async (inputTimes) => {
    const amount = ethers.parseUnits(inputAmount, 6); // Parse jumlah ke 6 desimal (untuk USDC.e)
    const times = BigInt(inputTimes); // Ubah jumlah kali ke BigInt

    // Periksa saldo dan kirim token beberapa kali
    await checkBalance();
    await sendMultipleTokens(amount, times);

    rl.close(); // Tutup antarmuka readline setelah selesai
  });
});

// Fungsi untuk mengirim token beberapa kali
async function sendMultipleTokens(amount, times) {
  try {
    // Ambil saldo sebelum mengirim
    const balance = await tokenContract.balanceOf(wallet.address);

    // Periksa apakah saldo cukup
    if (balance < (amount * times)) { // Gunakan BigInt untuk perkalian
      throw new Error('Saldo tidak mencukupi untuk mengirim token beberapa kali.');
    }

    for (let i = 0; i < times; i++) {
      // Transfer token
      const txResponse = await tokenContract.transfer(recipient, amount);
      const txHashUrl = `https://arbiscan.io/tx/${txResponse.hash}`; // URL Arbiscan untuk transaksi

      // Cetak hash transaksi dengan warna hijau
      console.log(green(`Hash transaksi ${i + 1}: ${txResponse.hash}`));
      console.log(green(`Lacak transaksi di sini: ${txHashUrl}`));

      // Tunggu konfirmasi transaksi
      const receipt = await txResponse.wait();
      console.log(green(`Transaksi ${i + 1} dikonfirmasi di blok ${receipt.blockNumber}`));

      // Cetak pesan ucapan selamat dengan warna hijau
      console.log(chalk.bgGreenBright(`TRANSAKSI ANDA SUDAH SELESAI SELAMAT`));
    }

    // Periksa saldo setelah semua transaksi selesai
    await checkBalanceAfterTransactions();
  } catch (error) {
    // Cetak kesalahan dengan warna merah
    console.error(red('Kesalahan mengirim token:', error));
  }
}

// Fungsi untuk memeriksa saldo setelah transaksi selesai
async function checkBalanceAfterTransactions() {
  try {
    const balance = await tokenContract.balanceOf(wallet.address);
    // Cetak saldo dengan warna pink
    console.log(pink(`Saldo Setelah Transaksi: ${ethers.formatUnits(balance, 6)} USDC.e`)); // 6 desimal untuk USDC.e
  } catch (error) {
    // Cetak kesalahan dengan warna merah jika pemeriksaan saldo gagal
    console.error(red('Kesalahan memeriksa saldo:', error));
  }
}

// Fungsi untuk memeriksa saldo sebelum transaksi
async function checkBalance() {
  try {
    const balance = await tokenContract.balanceOf(wallet.address);
    // Cetak saldo dengan warna biru
    console.log(blue(`Saldo Saat Ini: ${ethers.formatUnits(balance, 6)} USDC.e`)); // 6 desimal untuk USDC.e
  } catch (error) {
    // Cetak kesalahan dengan warna merah jika pemeriksaan saldo gagal
    console.error(red('Kesalahan memeriksa saldo:', error));
  }
}
