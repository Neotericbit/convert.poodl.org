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
  var refereeComiPurchaseIds;
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

     function txStoreKey() {
      if (typeof useraddress === "undefined" || !useraddress) return null;
      return "buypackHistory_" + useraddress.toLowerCase();
    }

    function loadTxs() {
      const key = txStoreKey();
      if (!key) return [];
      return JSON.parse(localStorage.getItem(key) || "[]");
    }


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
         // alert("refereeCommission 1 : " +refereeCommission);
          refereeCommission =  Number(refereeCommission) / Math.pow(10, decimals)
          // alert("refereeCommission 2 : " +refereeCommission);
          refereeCommission = refereeCommission.toFixed(7);
          //$("#totalCommAmt").html(refereeCommission +' ' +symbol  + ' '+ '<button type="button" class="btn btn-outline-danger staking-pink" id="claimall" >Claim Total Commission</button>');

          refereeComiPurchaseIds = await readContract({
            address: PoodlReferralContractAddress,
            abi: memberShipRefCodeABI,
            functionName: 'getAllCommissionPurchaseIds',
            args: [useraddress],
          })

          

          getstakingTxs();
          getBonusData();
          getCommissionTxs();

          $('#claimall').click(async function(){

             if(parseFloat(refereeCommission)< parseFloat(minCommission)) {
                 alertify.alert('Warning',"You need minimum commission "+ parseFloat(minCommission) + " " +symbol+" to claim");
                  return;
             }

             var pIds =  $("#hPurIds").val() ;
            var idArray = pIds.split(',').map(id => Number(id.trim()));
             // Convert to array of numbers
            // var pidArray = pIds.split(',').map(id => BigInt(id.trim()));

             try {

                  processTx(PoodlReferralContractAddress,memberShipRefCodeABI,'claimSpecificCommissions',Array(idArray),0,explorerURL);
                  init();

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
    setTimeout(init,1000);



    async function getstakingTxs(){
        
        const list = loadTxs();

        if(list.length>0){
            var stakingData = "";
            list.forEach(txData =>  {
       
                stakingData+='<tr>'+
                            '<td>'+ txData.pckgName+'</td>'+
                            '<td>'+txData.amount+' ' +symbol+'</td>'+
                            '<td>'+txData.giftamt+' ' +symbol+'</td>'+
                            '<td><a target="_blank" href="'+txData.extra+'"><i class="fa fa-external-link-square" aria-hidden="true"></i></a></td>'+
                        '</tr>';
            });
            $("#stakingsTxTable").html(stakingData);
            
            $("#total-commission-tab").html("");

        }  else{
            $("#stakingsTxTable").html('<tr><td colspan="4" style="text-align: center;">No Data Found.</td></tr>');
        }
        
    }
    async function getBonusData(){

        const bonusDetails = await readContract({
            address: PoodlReferralContractAddress,
            abi: memberShipRefCodeABI,
            functionName: 'referrals',
            args: [useraddress],
          })

             
        if(bonusDetails.pendingBonus >0)
        {
            var bonusButtonTD="";
            if(bonusDetails.claimedBonus>0){
                    bonusButtonTD='<td><a href="#" id="btnClaimBonus" type="button" class="claimcommission"  ><i   aria-hidden="true">Claim Bonus</i></a></td> ';
                } else {
                    bonusButtonTD ='<td> <i   aria-hidden="true">Bonus Claimed</i></td> ';
            }

            profitData+='<tr>'+
                    '<td><span id="bonusAmt" >'+bonusDetails.pendingBonus+'</span> ' +symbol+'</td>'+
                    '<td>'+bonusDetails.claimedBonus+' ' +symbol+'</td>'+
                    '<td>'+bonusButtonTD+'  </td>'+
                '</tr>';
         
            
            $("#bonusTable").html(profitData);
        
        }  else{
            $("#bonusTable").html('<tr><td colspan="2" style="text-align: center;">No Data Found.</td></tr>');
        }
       
    }

    async function getCommissionTxs(){

            if(refereeComiPurchaseIds.length>0){
                 var commData ="";
                 var purIds = "";
                 var amtCnt =0;
                for (var i = 0; i < refereeComiPurchaseIds.length; i++) {

                     var purchaseDetails = await readContract({
                      address: PoodlReferralContractAddress,
                      abi: memberShipRefCodeABI,
                      functionName: 'purchases',
                      args: [refereeComiPurchaseIds[i]],
                    })

                    const [
                      packageId,
                      buyAmount,
                      commissionAmount,
                      commissionClaimed,
                      referee
                    ] = purchaseDetails;


                    var data = commissionAmount;
                    var commamount = commissionAmount;
                    commamount =  Number(commamount) / Math.pow(10, decimals)
                    commamount = commamount.toFixed(7);
                    var commissionTD= "";

                     if(commissionClaimed==false){
                          if(amtCnt==0)
                          {
                              purIds = refereeComiPurchaseIds[i];
                          }
                          else
                          {
                              purIds += "," + refereeComiPurchaseIds[i];
                          }

                          amtCnt++;
                          commissionTD='<td><a href="#" type="button" class="claimcommission" data-id="'+refereeComiPurchaseIds[i]+'"><i   aria-hidden="true">Claim Commission</i></a></td> ';
                        } else {
                          commissionTD ='<td> <i   aria-hidden="true">Commission Claimed</i></td> ';
                        }

                    var transactionHash = referee;
                    commData+='<tr>'+
                                '<td>'+commamount+' ' +symbol+'</td>'+commissionTD+
                            '</tr>';

                  }

                  $("#hPurIds").val(purIds);

                  $("#commissionTable").html(commData);

                  var strTotals ="";
                  strTotals += 'Total Commission : <span id="totalCommAmt">'+refereeCommission +' ' +symbol  + ' '+ '<button type="button" class="btn btn-outline-danger staking-pink" id="claimall" >Claim Total Commission</button>'+' </span>'
                  $("#total-commission-tab").html(strTotals);


            }  else{

                $("#total-commission-tab").html("Total Commission : 0.0000"+' ' +symbol);
                $("#commissionTable").html('<tr><td colspan="2" style="text-align: center;">No Data Found.</td></tr>');
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

     let fileHandle = null; 

    $('#btnClaimBonus').on('click', async function () {

        if(useraddress == undefined)
        {
              alertify.alert('Warning',"Please connect Metamask");
              return;
        }

         try {

                processTx(PoodlReferralContractAddress,memberShipRefCodeABI,'claimBonus',Array(),0,explorerURL);

                getBonusData();
                
                // get converted USDT 
                const getUSDTAmt = await readContract({
                    address: PoodlReferralContractAddress,
                    abi: memberShipRefCodeABI,
                    functionName: 'bonusClaims',
                    args: [useraddress],
                  })

                const flName = useraddress + ".txt"

                fileHandle = await window.showSaveFilePicker({
                  suggestedName:flName,
                  types: [{ description: 'Text', accept: { 'text/plain': ['.txt'] } }]
                });


                 const writable = await fileHandle.createWritable();
                  await writable.write(getUSDTAmt.usdtValue);
                  await writable.close();

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

     

   $('#readBtn').on('click', async function () {
      try {
         
          [fileHandle] = await window.showOpenFilePicker({
            types: [{ description: 'Text', accept: { 'text/plain': ['.txt'] } }],
            multiple: false
          });
        
        const file = await fileHandle.getFile();
        var filetxt = await file.text();
        alert(filetxt);
      } catch (err) {
        if (err.name === 'AbortError') return;   // user closed the dialog
        $('#output').text('Error: ' + err.message);
      }
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
            processTx(PoodlReferralContractAddress,memberShipRefCodeABI,'withdrawStakingReward',Array(),0,explorerURL);
            setTimeout(init,2000);
          }
          else {
            alertify.alert("Warning","Contract does not have enough rewards. Please contact admin");
          }
        }
        else {
          alertify.alert("No amount to claim");
        }

      });

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
          console.log(hash);
          alertify.alert('Transaction Success', 'Your transaction is processing.<br>' + "Please check the status of transaction <a href='" + TX_URL + '/tx/' + hash + "' target='_blank'> Here</a>", function () { });
      } catch (e) {
          console.log(e)
      }
  }
