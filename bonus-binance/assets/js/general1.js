var myAccountAddress,contractInstance  ;
var isLoggedIn = false;
 //validator/staking contract address
  //var contractAddress = '0x27011282CA98553523C381EB7B2E83217250408A';
   var contractAddress ='0x000000000000000000000000000000000000F000';
   // var PoodlBonusBinance ='0x6cF17BB424E8dca7f0195e873d67D7C5314EFe47';
	const explorerURL =   'https://testnet.bscscan.com'; //testnet  , 'https://bscscan.com';  // mainnet  
    const CHAIN_ID = 97;   // BSC mainnet = 56, testnet = 97
    const chainName = 'BNB Smart Chain Testnet';  //  'BNB Smart Chain'; 
    const decimals = 18;
    const chainIDHex = '0x61';           //  testnet  0x61 , mainnet 0x38
    const symbol = 'tBNB';
    const rpcURL =  'https://data-seed-prebsc-1-s1.binance.org:8545';  // testnet , mainnt = 'https://bsc-dataseed.binance.org';
    
    const gas_limit = 5000000;
    const gasLimit = gas_limit.toString();
 
 
    //var PoodlBonusBinanceCodeABI = JSON.parse('');

async function addNetwork() {
if (window.ethereum) {
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIDHex }],
    });
    setTimeout(() => {
      location.reload();
    }
      , 1000);


  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: chainIDHex,
            chainName: chainName,
            nativeCurrency: {
              name: chainName,
              symbol: symbol,
              decimals: decimals
            },
            rpcUrls: [rpcURL], blockExplorerUrls: [explorerURL]
          }]
        });
        setTimeout(() => {
          location.reload();
        }
          , 1000);
      } catch (addError) {
        // handle "add" error
      }
    }
    // handle other "switch" errors
  }

}
}

function logEtoLongNumber(amountInLogE) {

amountInLogE = amountInLogE.toString();
var noDecimalDigits = "";

if (amountInLogE.includes("e-")) {
  var splitString = amountInLogE.split("e-"); //split the string from 'e-'
  noDecimalDigits = splitString[0].replace(".", ""); //remove decimal point
  //how far decimals to move
  var zeroString = "";
  for (var i = 1; i < splitString[1]; i++) {
    zeroString += "0";
  }
  return "0." + zeroString + noDecimalDigits;
} else if (amountInLogE.includes("e+")) {
  var splitString = amountInLogE.split("e+"); //split the string from 'e+'
  var ePower = parseInt(splitString[1]);
  noDecimalDigits = splitString[0].replace(".", ""); //remove decimal point
  if (ePower >= noDecimalDigits.length - 1) {
    var zerosToAdd = ePower - noDecimalDigits.length;
    for (var i = 0; i <= zerosToAdd; i++) {
      noDecimalDigits += "0";
    }
  } else {
    //this condition will run if the e+n is less than numbers
    var stringFirstHalf = noDecimalDigits.slice(0, ePower + 1);
    var stringSecondHalf = noDecimalDigits.slice(ePower + 1);
    return stringFirstHalf + "." + stringSecondHalf;
  }
  return noDecimalDigits;
}
return amountInLogE;  //by default it returns stringify value of original number if its not logarithm number
}

function secondsToDhms(seconds) {
seconds = Number(seconds);
var d = Math.floor(seconds / (3600 * 24));
var h = Math.floor(seconds % (3600 * 24) / 3600);
var m = Math.floor(seconds % 3600 / 60);
var s = Math.floor(seconds % 60);

var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
var hDisplay = h > 0 ? h + (h == 1 ? ":" : ":") : "";
var mDisplay = m > 0 ? m + (m == 1 ? ":" : ":") : "";
var sDisplay = s > 0 ? s + (s == 1 ? "" : "") : "";
return dDisplay + hDisplay + mDisplay + sDisplay;
}

function getUserAddress(userAddress) {
firstFive = userAddress.substring(0, 5);
lastFive = userAddress.substr(userAddress.length - 5);
return firstFive + '...' + lastFive;
}
