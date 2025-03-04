const { getConnection, decodeAccount } = require("../helper/solana");
const { PublicKey } = require("@solana/web3.js");
const { sha256 } = require("js-sha256")
const bs58 = require("bs58")
const programs = {
  two_way_peg: 'ZPLzxjNk1zUAgJmm3Jkmrhvb4UaLwzvY2MotpfovF5K', // Replace with actual program ID
  delegator: 'ZPLt7XEyRvRxEZcGFGnRKGLBymFjQbwmgTZhMAMfGAU'
};

const ZEUS_MINT_ADDRESS = 'ZEUS1aR7aX8DFFJf5QjWj2ftDDdNTroMNGo8YoQm3Gq'
const ZBTC_MINT_ADDRESS = 'zBTCug3er3tLyffELcvDNrKkCymbPWysGcWihESYfLg'

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
  console.log(accounts)

  data.push(...accounts.map(i => decodeAccount('GuardianSetting', i.account)));
  console.log("data",data)
  let totalAccumulatedAmount = BigInt(0);

  data.forEach(({ accumulated_amount, max_quota, available_quota }) => {
    console.log(BigInt(accumulated_amount))
    console.log(BigInt(available_quota))
    totalAccumulatedAmount += BigInt(accumulated_amount);
  });

  console.log(`Total Accumulated Amount: ${totalAccumulatedAmount}`);
  api.add(ZEUS_MINT_ADDRESS, totalAccumulatedAmount.toString())
}

module.exports = {
  timetravel: false,
  solana: {
    tvl,
  },
};
