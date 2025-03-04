const { getConnection, decodeAccount, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID  } = require("../helper/solana");
const { PublicKey } = require("@solana/web3.js");
const { sha256 } = require("js-sha256")
const bs58 = require("bs58")
const programs = {
  two_way_peg: 'ZPLzxjNk1zUAgJmm3Jkmrhvb4UaLwzvY2MotpfovF5K', // Replace with actual program ID
  delegator: 'ZPLt7XEyRvRxEZcGFGnRKGLBymFjQbwmgTZhMAMfGAU',
  liquidity_manager: 'ZPLuj6HoZ2z6y6WfJuHz3Gg48QeMZ6kGbsa74oPxACY'
};

const ZBTC_MINT_ADDRESS = 'zBTCug3er3tLyffELcvDNrKkCymbPWysGcWihESYfLg'
const WBTC_MINT_ADDRESS = '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh'

async function tvl(api) {
  const data = [];
  const connection = getConnection();
  const programDelegator = new PublicKey(programs.delegator);


  function generateDiscriminator(
    preImage
  ) {
    return Buffer.from(sha256(preImage), "hex").subarray(0, 8);
  }
  const filters = [
    {
      memcmp: {
        offset: 0,
        bytes: bs58.encode(generateDiscriminator("delegator:guardian-setting")),
      },
    },
  ];

  const accounts = await connection.getProgramAccounts(programDelegator, {
    filters, // Adjust dataSize based on GuardianSetting size
  });



  data.push(...accounts.map(i => decodeAccount('GuardianSetting', i.account)));
  console.log(data)
  let totalAccumulatedAmount = BigInt(0);
  const tokenAccounts = [];
  const zbtc_mint_address = new PublicKey(ZBTC_MINT_ADDRESS)

  data.forEach(({ spl_token_vault_authority }) => {
    const spl_token_vault = new PublicKey(spl_token_vault_authority)
    console.log(`Processing vault authority: ${spl_token_vault.toBase58()}`);
    const associatedTokenAccount = getAssociatedTokenAddress(zbtc_mint_address, spl_token_vault, TOKEN_2022_PROGRAM_ID )
    console.log(`Associated Token Account: ${associatedTokenAccount}`);
    tokenAccounts.push(associatedTokenAccount);
  });



  console.log(`Total Accumulated Amount: ${totalAccumulatedAmount}`);

  api.add(WBTC_MINT_ADDRESS, totalAccumulatedAmount.toString())
}

module.exports = {
  timetravel: false,
  solana: {
    tvl,
  },
};
