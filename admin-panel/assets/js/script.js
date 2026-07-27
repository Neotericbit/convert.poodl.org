// import libraries
import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
  WagmiCore,
  WagmiCoreChains,
  WagmiCoreConnectors,
} from "https://unpkg.com/@web3modal/ethereum";
import { Web3Modal } from "https://unpkg.com/@web3modal/html";

const {  waitForTransactionReceipt } = WagmiCore;
 

// 0. Import wagmi dependencies
const { mainnet } = WagmiCoreChains;
const {fetchFeeData, waitForTransaction, getNetwork, fetchBalance, configureChains, createConfig, switchNetwork, readContract, writeContract, getAccount, watchAccount } = WagmiCore;

const poodl = {
  id: 15259,    //  Chain ID mainnet = 15259   & Testnet = 15257
  name: 'Poodl Network',
  network: 'POODL',
  nativeCurrency: {
      decimals: 18,
      name: 'POODL',
      symbol: 'POODL',
  },
  rpcUrls: {
      default: { http: ['https://rpc.poodl.org'] },  // testnet RPC = https://testnet-rpc.poodl.org & Mainnet RPC = https://rpc.poodl.org
      public: { http: ['https://rpc.poodl.org'] },
  },
  blockExplorers: {
      etherscan: { name: 'explorer', url: 'https://explorer.poodl.org' }, //  mainnet URL = https://explorer.poodl.org  &&  testnet URL = https://testnet.poodl.org
      default: { name: 'explorer', url: 'https://explorer.poodl.org' },
  },
}
// 1. Define chains
const chains = [poodl];
//walletconnect project id
const projectId = "06095aa9b1820180e01f79d43e8b08e7";
// 2. Configure wagmi client
const { publicClient } = configureChains(chains, [w3mProvider({ projectId,retryCount: 5,  // more retry attempts
      retryDelay: 200 // wait 200ms between retries
       })]);
const metadata = {
  name: 'Poodl Membsers',
  description: 'Poodl Membser',
  url: 'https://convert.poodl.org/',
  icons: ['https://convert.poodl.org/assets/img/poodl.png'],
}
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    ...w3mConnectors({ chains, version: 2, projectId,metadata }),
    new WagmiCoreConnectors.CoinbaseWalletConnector({
      chains,
      options: {
        appName: "poodl members",
      },
    }),
  ],
  publicClient,
});

 // 3. Create ethereum and modal clients
 const ethereumClient = new EthereumClient(wagmiConfig, chains);
 export const web3Modal = new Web3Modal(
   {
     enableExplorer: false,
    enableAccountView: true,
     projectId,
     chainImages: {
      15259: 'assets/img/poodl.png'
    },
    //themeMode: 'light',
    themeVariables: {
      '--w3m-accent-color' : '#000',
      '--w3m-background-color' : '#000',
      }
   },
   ethereumClient
 );
   web3Modal.setDefaultChain(poodl)

 


 $(document).ready(function(){


    var account = getAccount();
    var useraddress = account.address;

   if (typeof window.ethereum !== 'undefined') {
        //  Detect account change (works with MetaMask directly)
        ethereum.on('accountsChanged', function (accounts) {
            if (accounts.length > 0) {
                useraddress = accounts[0];
                //alert("accountsChanged = " + useraddress);
                init();
            } else {
                //alert("No account connected");
            }
        });

        // Detect chain change
        ethereum.on('chainChanged', function (chainId) {
            // Fetch the current account again
            ethereum.request({ method: 'eth_requestAccounts' }).then((accounts) => {
                if (accounts.length > 0) {
                    useraddress = accounts[0];
                   // alert("chainChanged = " + useraddress);
                    init();
                }
            });
        });
    }

    // Call init when connected through <w3m-core-button>
    document.querySelector('w3m-core-button').addEventListener('click', async () => {
        try {
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) {
                useraddress = accounts[0];
                init();
            }
        } catch (err) {
            console.log("User rejected connection or error:", err);
        }
    });


    // Listen for account changes via Wagmi
    watchAccount((account) => {
        if (!account.isConnected) {
            //alert("Disconnected from MetaMask via Web3Modal");
            useraddress = null;
            // reset UI here if needed
             init();
        }
    });

   
    async function init(){

        // fetch reward fund
        var rewardFundAmt = await readContract({
            address: PoodlReferralContractAddress,
            abi: memberShipRefCodeABI,
            functionName: 'rewardFund',
            args: [],
          })

        $("#availReward").html(fromWei(rewardFundAmt,decimals) + " Poodl")
        //alert(rewardFundAmt);
        // fetch commission fund
        const commissionFundAmt = await readContract({
            address: PoodlReferralContractAddress,
            abi: memberShipRefCodeABI,
            functionName: 'commissionFund',
            args: [],
          })


        $("#availComm").html(fromWei(commissionFundAmt,decimals) + " Poodl")
        //alert(commissionFundAmt);

        // fetch gift fund
        const giftFundAmt = await readContract({
            address: PoodlReferralContractAddress,
            abi: memberShipRefCodeABI,
            functionName: 'giftFund',
            args: [],
          })
        $("#availGift").html(fromWei(giftFundAmt,decimals) + " Poodl")
        //alert(giftFundAmt);
    }


     function toWei(amountStr, decimals) {

      amountStr = String(amountStr).trim();
      const neg = amountStr.startsWith('-');
      if (neg) amountStr = amountStr.slice(1);

      let [whole, frac = ''] = amountStr.split('.');
      frac = frac.padEnd(decimals, '0').slice(0, decimals);
      const combined = (whole + frac).replace(/^0+/, '') || '0';
      const result = BigInt(combined);
      return neg ? -result : result;
    }

    function fromWei(weiValue, decimals) {
      let v = BigInt(weiValue);              // accepts bigint, string, or number
      const neg = v < 0n;
      if (neg) v = -v;

      let s = v.toString().padStart(decimals + 1, '0');   // ensure at least 1 whole digit

      const whole = s.slice(0, s.length - decimals);
      let frac    = s.slice(s.length - decimals);

      frac = frac.replace(/0+$/, '');        // drop trailing zeros: "500000..." -> "5"

      const result = frac ? `${whole}.${frac}` : whole;
      return neg ? '-' + result : result;
    }

    function showLoader(msg, sub) {
      $('#txLoader .tx-text').text(msg || 'Processing transaction...');
      $('#txLoader .tx-sub').text(sub || "Please confirm in your wallet and don't close this window.");
      $('#txLoader').addClass('show');
    }
    function hideLoader() {
      $('#txLoader').removeClass('show');
    }

        
    //==============  ADD Funds ================

    var addFundConfig = {
        gift:       { input: '#txtAddGift',   method: 'addGiftFund' },
        reward:     { input: '#txtAddReward', method: 'addRewardFund' },
        commission: { input: '#txtAddComm',   method: 'addCommissionFund' }
    };

    $('.addfund').click(async function(){

        var fundType = $(this).attr("data")
        var config = addFundConfig[fundType];
        if (!config) {
            alertify.alert('Warning', 'Invalid fund type');
            return;
        }
    
        var amount = $(config.input).val();

        if (amount == "") {
            alertify.alert('Warning', "Please enter amount");
            return;
        }
        if (useraddress == undefined) {
            alertify.alert('Warning', "Please connect Metamask");
            return;
        }

        var payableAmount = toWei(amount, decimals); 

        await processTx( PoodlReferralContractAddress, memberShipRefCodeABI, config.method, Array(), payableAmount, explorerURL );

        alertify.alert("Transaction Success !!" , fundType + " fund added");

         $(config.input).val('');

        await init();
         
    });

    //==============  Remove Funds ================

    var removeFundConfig = {
        gift:       {   method: 'rescueGiftFund' },
        reward:     {   method: 'rescueRewardFund' },
        commission: {   method: 'rescueCommissionFund' }
    };

    $('.removefund').click(async function(){

        var fundType = $(this).attr("data")
        var config = removeFundConfig[fundType];

        if (!config) {
            alertify.alert('Warning', 'Invalid fund type');
            return;
        }

        if (useraddress == undefined) {
            alertify.alert('Warning', "Please connect Metamask");
            return;
        }
        
        await processTx( PoodlReferralContractAddress, memberShipRefCodeABI, config.method, Array(), 0, explorerURL );

        alertify.alert("Transaction Success !!" , fundType + " fund withdrawn");
        await init();
         
    });

    $('#btnRemoveContractFund').click(async function(){

       if(useraddress == undefined)
        {
            alertify.alert('Warning',"Please connect Metamask");
            return;
        }

        await processTx(PoodlReferralContractAddress,memberShipRefCodeABI,'rescueFunds',Array(),0,explorerURL);

        alertify.alert("Transaction Success !!" ,"Contract fund withdrawn");
        await init();
          
    });

    $('#btnMigrateStatus').click(async function(){

        let vEnableMigration = $('#drpEnableMigration').val() === 'true';
        var vErr = ""

        if(vEnableMigration)
        {
            vErr = "Migration started";
        }
        else
        {
            vErr ="Migration stopped";
        }

        if(useraddress == undefined)
        {
            alertify.alert('Warning',"Please connect Metamask");
            return;
        }
         
        await processTx(PoodlReferralContractAddress,memberShipRefCodeABI,'setMigrationReady',Array(vEnableMigration),0,explorerURL);

        alertify.alert("Transaction Success !!" ,vErr);

        await init();

    });

    $('#btnMigrateContract').click(async function(){

        var vOldContract = $('#txtoldContract').val();
         
         if (vOldContract == "") {
            alertify.alert('Warning', "Please enter old contract address");
            return;
        }

       if(useraddress == undefined)
        {
            alertify.alert('Warning',"Please connect Metamask");
            return;
        }
         
        await processTx(PoodlReferralContractAddress,memberShipRefCodeABI,'setOldContract',Array(vOldContract),0,explorerURL);

        alertify.alert("Transaction Success !!" ,"Old contract address is set");

        $('#txtoldContract').val('');

        await init();
    
    });

    $('#btnPurchaseLen').click(async function(){

        var vPurLen = $('#txtPurLen').val();
         
         if (vPurLen == "") {
            alertify.alert('Warning', "Please enter value");
            return;
        }

        if(useraddress == undefined)
        {
            alertify.alert('Warning',"Please connect Metamask");
            return;
        }
         
        await processTx(PoodlReferralContractAddress,memberShipRefCodeABI,'setPurchasesLength',Array(vPurLen),0,explorerURL);

        alertify.alert("Transaction Success !!" ,"Purchase length set");

        $('#txtPurLen').val('');

        await init();

    });


    $('#btnNewUsersAllow').click(async function(){

        let vNewUsersAllowed = $('#drpNewUsers').val() === 'true';
        var vErr = ""

        if(vNewUsersAllowed)
        {
            vErr = "New users allowed";
        }
        else
        {
            vErr ="New users not allowed";
        }

        if(useraddress == undefined)
        {
            alertify.alert('Warning',"Please connect Metamask");
            return;
        }
         
        await processTx(PoodlReferralContractAddress,memberShipRefCodeABI,'setNewUsersAllowed',Array(vNewUsersAllowed),0,explorerURL);

        alertify.alert("Transaction Success !!" ,vErr);

        await init();

    });

    init();
 

  // async function processTx(contract_address, contract_ABI, function_Name, args, tokenAmount, TX_URL) {

  //     try {
  //         const { hash } = await writeContract({
  //             address: contract_address,
  //             abi: contract_ABI,
  //             functionName: function_Name,
  //             args: args,
  //             value: tokenAmount
  //         })
  //         console.log(hash);
  //         alertify.alert('Transaction Success', 'Your transaction is processing.<br>' + "Please check the status of transaction <a href='" + TX_URL + '/tx/' + hash + "' target='_blank'> Here</a>", function () { });
  //     } catch (error) {
  //          // Try to extract revert message
  //               let errorMessage = "Unknown error";

  //               if (error.message && error.message.includes("reverted with the following reason:")) {
  //                 const split = error.message.split("reverted with the following reason:");
  //                 if (split.length > 1) {
  //                   errorMessage = split[1].trim().split("Contract Call:")[0].trim();
  //                 }
  //               } else if (error.message) {
  //                 errorMessage = error.message;
  //               }

  //               alertify.alert("Warning" , errorMessage);
  //         throw error;
  //     }
  // }


  async function processTx(contract_address, contract_ABI, function_Name, args, tokenAmount, TX_URL) {

      try {
          const { hash } = await writeContract({
              address: contract_address,
              abi: contract_ABI,
              functionName: function_Name,
              args: args,
              value: tokenAmount
          })
          //console.log(hash);
          //alertify.alert('Transaction Success', 'Your transaction is processing.<br>' + "Please check the status of transaction <a href='" + TX_URL + '/tx/' + hash + "' target='_blank'> Here</a>", function () { });
        
        showLoader('Transaction submitted', 'Waiting for network confirmation...');

            let receipt;

          if (WagmiCore.waitForTransactionReceipt) {
            receipt = await WagmiCore.waitForTransactionReceipt({
              hash: hash
            });
          } else {
            receipt = await WagmiCore.waitForTransaction({
              hash: hash
            });
          }
           
         // console.log("Transaction confirmed:", receipt);

          if (receipt.status === "success" || receipt.status === 1) {
            //await init();
              } else {
                alertify.alert("Transaction Failed", "Transaction reverted.");
              }

          } catch (e) {
              //console.log(e)
              var errMsg = extractRevertReason(e);  

              alertify.alert('Warning', errMsg);
              throw e;
          }
          finally {
            hideLoader();
        }
  }

    function extractRevertReason(err) {
      // Walk the error's cause chain looking for revert info
      let current = err;

      while (current) {
        // String require("...") messages
        if (current.reason) {
          return current.reason;
        }

        // Custom errors: error InsufficientBalance(...)
        if (current.data?.errorName) {
          return current.data.errorName;
        }

        // viem tags the revert node with this name
        if (current.name === "ContractFunctionRevertedError" && current.shortMessage) {
          return current.shortMessage;
        }

        current = current.cause;
      }

      // Fallbacks
      return err?.shortMessage || err?.message || "Something went wrong";
    }


 });
