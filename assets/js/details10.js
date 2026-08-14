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
const { mainnet, polygon, bsc } = WagmiCoreChains;
const {fetchFeeData, waitForTransaction, getNetwork, fetchBalance, configureChains, createConfig, switchNetwork, readContract, writeContract, getAccount, watchAccount } = WagmiCore;

const poodl = {
  id: 15259,
  name: 'Poodl Network',
  network: 'POODL',
  nativeCurrency: {
      decimals: 18,
      name: 'POODL',
      symbol: 'POODL',
  },
  rpcUrls: {
      default: { http: ['https://rpc.poodl.org'] },
      public: { http: ['https://rpc.poodl.org'] },
  },
  blockExplorers: {
      etherscan: { name: 'explorer', url: 'https://explorer.poodl.org' },
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
        appName: "poodl bridge",
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
  var rewardAmount;
  var packageArray =[];
  var refereeComiData;
  var minCommission =10;
  var refereeCommission =0;


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

       

      if(useraddress!= null) {

        const getpckLength = await readContract({
            address: PoodlReferralContractAddress,
            abi: memberShipRefCodeABI,
            functionName: 'pckLength',
            args: [],
          })
        for (var i = 0; i < getpckLength; i++) {
          var getPkgInfo = await readContract({
              address: PoodlReferralContractAddress,
              abi: memberShipRefCodeABI,
              functionName: 'packages',
              args: [i],
            })
            packageArray.push(getPkgInfo[0]);
          }
        var userTotalStake = await readContract({
            address: PoodlReferralContractAddress,
            abi: memberShipRefCodeABI,
            functionName: 'userTotalStake',
            args: [useraddress],
          })

          userTotalStake = Number(userTotalStake) / Math.pow(10, decimals);
          userTotalStake = userTotalStake.toFixed(4);
          $("#totalStakedCoins").html(userTotalStake +' ' +symbol);

         rewardAmount = await readContract({
            address: PoodlReferralContractAddress,
            abi: memberShipRefCodeABI,
            functionName: 'viewRewards',
            args: [useraddress,true],
          })
         //alert (" rewardAmount = " + rewardAmount);
          rewardAmount = Number(rewardAmount) / Math.pow(10, decimals);
          rewardAmount = rewardAmount.toFixed(7);
          $("#rewardAmount").html(rewardAmount+' ' +symbol);

          refereeCommission = await readContract({
            address: PoodlReferralContractAddress,
            abi: memberShipRefCodeABI,
            functionName: 'refreeCommissionEarned',
            args: [useraddress],
          })
       
          refereeCommission =  Number(refereeCommission) / Math.pow(10, decimals)
          refereeCommission = refereeCommission.toFixed(7);
          
          refereeComiData = await readContract({
            address: PoodlReferralContractAddress,
            abi: memberShipRefCodeABI,
            functionName: 'getRefereeCommissions',
            args: [useraddress],
          })
        
          getstakingTxs();
          getBonusData();
          getCommissionTxs();

      }
      else
      {
          $("#total-commission-tab").html("");
          $("#rewardAmount").html("0.0000"+' ' +symbol);
          $("#totalStakedCoins").html("0.0000"+' ' +symbol);
          $("#stakingsTxTable").html('<tr><td colspan="4" style="text-align: center;">No Data Found.</td></tr>');
          $("#bonusTable").html('<tr><td colspan="2" style="text-align: center;">No Data Found.</td></tr>');
          $("#commissionTable").html('<tr><td colspan="2" style="text-align: center;">No Data Found.</td></tr>');

      }

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

    function solidityTimestampToDate(timestamp) {
      // Convert BigNumber/string to number, then seconds -> ms
      const ms = Number(timestamp) * 1000;
      return dayjs(ms).format('MMM Do YYYY, h:mm:ss a');
    }


     function showLoader(msg, sub) {
        $('#txLoader .tx-text').text(msg || 'Processing transaction...');
        $('#txLoader .tx-sub').text(sub || "Please confirm in your wallet and don't close this window.");
        $('#txLoader').addClass('show');
      }
      function hideLoader() {
        $('#txLoader').removeClass('show');
      }

    init();


    $('#claimall').click(async function(){

        if(parseFloat(refereeCommission)< parseFloat(minCommission)) {
             alertify.alert('Warning',"You need minimum commission "+ parseFloat(minCommission) + " " +symbol+" to claim");
              return;
        }
        var pIds =  $("#hPurIds").val() ;
        var idArray = pIds.split(',').map(id => Number(id.trim()));
         // Convert to array of numbers
        // var pidArray = pIds.split(',').map(id => BigInt(id.trim()));

        await processTx(PoodlReferralContractAddress,memberShipRefCodeABI,'claimSpecificCommissions',Array(idArray),0,explorerURL);
        await init();
                 
    });


    async function getstakingTxs(){
 
        const userPurchases = await readContract({
            address: PoodlReferralContractAddress,
            abi: memberShipRefCodeABI,
            functionName: 'getUserPurchases',
            args: [useraddress],
          })
    

        var stakingData = "";
        if(userPurchases.length>0){

            for(var i=0; i<userPurchases.length; i++)
            {
              
                var userPurId = userPurchases[i];
                var userPurData = await readContract({
                    address: PoodlReferralContractAddress,
                    abi: memberShipRefCodeABI,
                    functionName: 'getPurchaseDetails',
                    args: [userPurId],
                })

                var buyAmt = Number(userPurData.buyAmount) / Math.pow(10, decimals);
                buyAmt = buyAmt.toFixed(7);

                var giftAmt = Number(userPurData.giftAmount) / Math.pow(10, decimals);
                giftAmt = giftAmt.toFixed(7); 

                var getPkgInfo = await readContract({
                  address: PoodlReferralContractAddress,
                  abi: memberShipRefCodeABI,
                  functionName: 'packages',
                  args: [userPurData.packageId],
                })

                stakingData+='<tr>'+
                                '<td>'+ getPkgInfo[0]+'</td>'+
                                '<td>'+buyAmt+' ' +symbol+'</td>'+
                                '<td>'+giftAmt+' ' +symbol+'</td>'+
                                '<td><a target="_blank" href=""><i class="fa fa-external-link-square" aria-hidden="true"></i></a></td>'+
                            '</tr>';
                        
            }

            $("#stakingsTxTable").html(stakingData);

            $("#total-commission-tab").html("");

        }  else{
            $("#stakingsTxTable").html('<tr><td colspan="4" style="text-align: center;">No Data Found.</td></tr>');
        }
        
    }
    async function getBonusData(){

        // get claimed bonus data
        const claimedBonusData = await readContract({
            address: PoodlReferralContractAddress,
            abi: memberShipRefCodeABI,
            functionName: 'getBonusClaims',
            args: [useraddress],
          })

        const bonusDetails = await readContract({
            address: PoodlReferralContractAddress,
            abi: memberShipRefCodeABI,
            functionName: 'getReferralStats',
            args: [useraddress],
        })

        $("#uniqueUserCnt").html('Referral code has been used = ' + bonusDetails.uniqueUserCount + ' times');

        var profitData = "";
             
        if(bonusDetails.pendingBonus >0 || bonusDetails.claimedBonus>0)
        {

            var bonusAmt = Number(bonusDetails.pendingBonus) / Math.pow(10, decimals);
                bonusAmt = bonusAmt.toFixed(7);

            var bonusClaimAmt = Number(bonusDetails.claimedBonus) / Math.pow(10, decimals);
                bonusClaimAmt = bonusClaimAmt.toFixed(7);

            var bonusButtonTD="";
            if(bonusDetails.pendingBonus>0){
                    bonusButtonTD='<a href="#" id="btnClaimBonus" type="button" class="claimcommission"  ><i   aria-hidden="true">Claim Bonus</i></a> ';
                } else {
                    bonusButtonTD ='<i   aria-hidden="true">Bonus Claimed</i> ';
            }

            profitData+='<tr>'+
                    '<td><span id="bonusAmt" >'+bonusAmt+'</span> ' +symbol+'</td>'+
                    '<td> '+solidityTimestampToDate(bonusDetails.bonusDate)+' </td>'+
                    '<td>'+bonusClaimAmt+' ' +symbol+'</td>'+
                    '<td> '+solidityTimestampToDate(claimedBonusData.claimedDateTime)+' </td>'+
                    '<td>'+bonusButtonTD+'  </td>'+
                '</tr>';
         
            
            $("#bonusTable").html(profitData);
        
        }  else{
            $("#bonusTable").html('<tr><td colspan="5" style="text-align: center;">No Data Found.</td></tr>');
        }


        //================ Claim bonus ==================

            

            $('#btnClaimBonus').on('click', async function () {

                if(useraddress == undefined)
                {
                      alertify.alert('Warning',"Please connect Metamask");
                      return;
                }

                await processTx(PoodlReferralContractAddress,memberShipRefCodeABI,'claimBonus',Array(),0,explorerURL);

                // get converted USDT 
                const getUSDTAmt = await readContract({
                    address: PoodlReferralContractAddress,
                    abi: memberShipRefCodeABI,
                    functionName: 'getBonusClaims',
                    args: [useraddress],
                  })

                //getUSDTAmt.usdtValue
                //getUSDTAmt.bonusInPoodl

                // send data to Node script
                const response = await fetch('http://localhost:3000/saveBonus', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userAddress: useraddress,
                        usdtAmount:  getUSDTAmt.usdtValue,   // BigInt -> string
                        poodlAmount: getUSDTAmt.bonusInPoodl,
                        paidBonus: false
                    })
                });

                const data = await response.json();
                //console.log(data);   // { success: true, insertId: ... }
                await init();         

            });

       
    }
    async function getCommissionTxs(){

         
            if(refereeComiData.length>0){
                 var commData ="";
                 var purIds = "";
                 var amtCnt =0;
                for (var i = 0; i < refereeComiData.length; i++) {

                    var commamount = refereeComiData[i].amount;
                     
                    commamount =  Number(commamount) / Math.pow(10, decimals)
                    commamount = commamount.toFixed(7);
                    var commissionTD= "";

                     if(refereeComiData[i].claimed==false){
                          if(amtCnt==0)
                          {
                              purIds = refereeComiData[i].purchaseId;
                          }
                          else
                          {
                              purIds += "," + refereeComiData[i].purchaseId;
                          }

                          amtCnt++;
                          commissionTD='<td><a href="#" type="button" class="claimcommission" data-id="'+refereeComiData[i].purchaseId+'"><i   aria-hidden="true">Claim Commission</i></a></td> ';
                        } else {
                          commissionTD ='<td> <i   aria-hidden="true">Commission Claimed</i></td> ';
                        }
                         
                     
                    commData+='<tr>'+
                                '<td>'+commamount+' ' +symbol+'</td>'+
                                '<td> '+solidityTimestampToDate(refereeComiData[i].commDate)+' </td>'+
                                commissionTD+
                            '</tr>';

                  }
                  

                  $("#hPurIds").val(purIds);

                  $("#commissionTable").html(commData);


            }  else{

                $("#total-commission-tab").html("Total Commission : 0.0000"+' ' +symbol);
                $("#commissionTable").html('<tr><td colspan="3" style="text-align: center;">No Data Found.</td></tr>');
            }


            $('.claimcommission').click(async function(){
                var pid = $(this).data("id");

                if(parseFloat(refereeCommission)< parseFloat(minCommission)) {
                  alertify.alert('Warning',"You need minimum commission "+ parseFloat(minCommission) + " " +symbol+" to claim");
                  return;
                }

                try {

                  processTx(PoodlReferralContractAddress,memberShipRefCodeABI,'claimSpecificCommissions',Array([pid]),0,explorerURL);
                    setTimeout(init,2000);

                }catch (error) {

                  // Try to extract revert message
                  let errorMessage = "Unknown error";

                  if (error.message && error.message.includes("reverted with the following reason:")) {
                    const split = error.message.split("reverted with the following reason:");
                    if (split.length > 1) {
                      errorMessage = split[1].trim().split("Contract Call:")[0].trim();
                    }
                  } else if (error.message) {
                    errorMessage = error.message;
                  }

                  alertify.alert("Warning" , errorMessage);
              }

            });
    }

    $('#pills-commission-tab').click(async function(){
        var strTotals ="";
        strTotals += 'Total Commission : <span id="totalCommAmt">'+refereeCommission +' ' +symbol  + ' '+ '<button type="button" class="btn btn-outline-danger staking-pink" id="claimall" >Claim Total Commission</button>'+' </span>'
        $("#total-commission-tab").html(strTotals);
    });
    $('#pills-reward-tab').click(async function(){
        $("#total-commission-tab").html('');
    });
    $('#pills-stake-tab').click(async function(){
        $("#total-commission-tab").html('');
    });

 
    $('#btnwithdraw').click(async function(){
        const account = getAccount();
        const useraddress = account.address;

        if(useraddress == undefined)
        {
              alertify.alert('Warning',"Please connect Metamask");
              return;
        }

        if(parseFloat(rewardAmount)>0)
        {
          var rewardFund = await readContract({
              address: PoodlReferralContractAddress,
              abi: memberShipRefCodeABI,
              functionName: 'rewardFund',
              args: [],
            })
          rewardFund = Number(rewardFund) / Math.pow(10,decimals);

          if(parseFloat(rewardFund)>= parseFloat(rewardAmount)) {

            await processTx(PoodlReferralContractAddress,memberShipRefCodeABI,'withdrawStakingReward',Array(),0,explorerURL);
            await init();
          }
          else {
            alertify.alert("Warning","Contract does not have enough rewards. Please contact admin");
          }
        }
        else {
          alertify.alert("No amount to claim");
        }

      });


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
  //     } catch (e) {
  //         console.log(e)
  //     }
  // }
