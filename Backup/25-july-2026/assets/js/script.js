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

    const popup = document.getElementById("firstVisitPopup");
    const websiteContent = document.getElementById("websiteContent");
    const closePopup = document.getElementById("closePopup");
    const continueBtn = document.getElementById("continueBtn");

    
    function txStoreKey() {
      if (typeof useraddress === "undefined" || !useraddress) return null;
      return "buypackHistory_" + useraddress.toLowerCase();
    }

    function loadTxs() {
      const key = txStoreKey();
      if (!key) return [];
      return JSON.parse(localStorage.getItem(key) || "[]");
    }

    function persistTxs(list) {
      const key = txStoreKey();
      if (!key) return;
      localStorage.setItem(key, JSON.stringify(list));
    }
    
    function showWebsite() {
        popup.classList.remove("active");
        websiteContent.classList.remove("hidden");
        //localStorage.setItem("poodlPopupShown", "true");
    }

    // Save a new transaction (called right after you get a hash)
    function saveTx({ hash, type, amount,giftamt , pckgName, extra = "" }) {
      const list = loadTxs();
      // avoid duplicates
      if (list.some(t => t.hash.toLowerCase() === hash.toLowerCase())) return;
      list.unshift({
        hash,
        type,                 // e.g. "Stake", "Profit Claim", "Buy"
        amount,               // human string, e.g. "125.0000"
        giftamt,
        pckgName,
        extra,                // anything optional (package name, etc.)
        status: "pending",
        time: Date.now(),
      });
      persistTxs(list);
    }

    function updateTxStatus(hash, status) {
      const list = loadTxs();
      const item = list.find(t => t.hash.toLowerCase() === hash.toLowerCase());
      if (item) {
        item.status = status;
        persistTxs(list);
      }
    }


    async function init(){

        const getpckLength = await readContract({
            address: PoodlReferralContractAddress,
            abi: memberShipRefCodeABI,
            functionName: 'pckLength',
            args: [],
          })

        
        if(useraddress!= null)
        {
            const isUserActive = await readContract({
              address: PoodlReferralContractAddress,
              abi: memberShipRefCodeABI,
              functionName: 'isActiveUser',
              args: [useraddress]
            });

             

          const myRefCode = await readContract({
              address: PoodlReferralContractAddress,
              abi: memberShipRefCodeABI,
              functionName: 'userReferralCode',
              args: [useraddress],
            })

           if(myRefCode=="")
           {
              var  refButton = '';
              refButton += '<a href="#" id="generateRefCode" class="btn btn-outline-danger" ';
              refButton += 'style="background: linear-gradient(90deg, rgb(236, 2, 40),rgb(7, 164, 254) 95.07%) !important;color: #fff;" >';
              refButton += ' Generate Referral Code</a>';

              $("#refcodesection").html(refButton);

           }
           else
           {
              var  refText ='';
              refText += '<a href="#" id="btnRefcode" class="btn btn-outline-danger" ';
              refText += 'style="background: linear-gradient(90deg, rgb(236, 2, 40),rgb(7, 164, 254) 95.07%) !important;color: #fff;" >';
              refText += '<span id="copyIcon" class="fa fa-copy" ';
              refText += ' style="cursor:pointer;font-size: 16px; margin-right:10px;margin-left:10px;color: #fff;"></span>';
              refText += ' <span id="myRefCode" style="margin-top:10px;color:#fff;">'+myRefCode+' </span>';
              refText += '</a>';

               $("#refcodesection").html(refText);
           }

           // if old user and not migrated data yet , show popup
           //  else show website

            if (isUserActive === 3) {
              // migrate-first popup
               popup.classList.add("active");
                websiteContent.classList.add("hidden");
            } else if (isUserActive !== 0) {
              alertify.alert('Warning', isUserActive === 1 ? 'Not open' : 'New users not open');
            } else {
              websiteContent.classList.remove("hidden");
            }

        }
       else
       {
          $("#refcodesection").html("");
          // if wallet not connected , show website content
          showWebsite();
       }

       //=============  Popup ===========

 
      closePopup.addEventListener("click", showWebsite);
      //continueBtn.addEventListener("click", showWebsite);

      $('#continueBtn').click(async function(){

            if(useraddress == undefined || useraddress == null)
            {
                alertify.alert('Warning',"Please connect Metamask");
                return;
            }

            try {
                await processTx(PoodlReferralContractAddress,memberShipRefCodeABI,'migrateMyAccount',Array(),0,explorerURL);
                // data migrated successfully
                localStorage.setItem("poodlPopupShown", "true");
                showWebsite();

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


        $('#generateRefCode').click(async function(){

           if(useraddress == undefined)
            {
                alertify.alert('Warning',"Please connect Metamask");
                return;
            }

            try {

                await processTx(PoodlReferralContractAddress,memberShipRefCodeABI,'getReferralCode',Array(),0,explorerURL);
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


         $("#copyIcon").click(async function(){

            var text = $("#myRefCode").text().trim(); // Get text without icon space

            navigator.clipboard.writeText(text).then(function(){
                // Change icon to indicate success
                $("#copyIcon").removeClass("fa-copy").addClass("fa-check");
                setTimeout(function(){
                    $("#copyIcon").removeClass("fa-check").addClass("fa-copy");
                }, 1500);
            });
        });

    }

    setTimeout(init,1000);


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


     $('.buynow').click(async function(){


          const account = getAccount();
          const address = account.address;
          // if(address == undefined)
          // {
          //     alertify.alert('Warning',"Please connect Metamask");
          //     return;
          // }
          var index = $(this).attr("data");
        
            var getPkgInfo = await readContract({
              address: PoodlReferralContractAddress,
              abi: memberShipRefCodeABI,
              functionName: 'packages',
              args: [index],
            })

            var pckName = getPkgInfo[0];
			
     		 const myRefCode = await readContract({
              address: PoodlReferralContractAddress,
              abi: memberShipRefCodeABI,
              functionName: 'userReferralCode',
              args: [address],

            })
          var txtPackVal =  $('#txtRefCode'+index).val();
          if(txtPackVal == "")
          {
              alertify.alert('Warning',"Please enter referral code");
              return;
          }
     	
     	// if(txtPackVal == myRefCode)
      //     {
      //       alertify.alert('',"⛔️ ATTENTION ⛔️<br><br> You are using your own referal code. You will receive the gift, but YOU WILL NOT be able to claim the commission bonus.<br><br>Please use a referral code other than your own. Proceed at your own risk.⚠️");
      //         return;
      //     }
          var giftFund = await readContract({
              address: PoodlReferralContractAddress,
              abi: memberShipRefCodeABI,
              functionName: 'giftFund',
              args: [],
            })

            var userPackage = await readContract({
                address: PoodlReferralContractAddress,
                abi: memberShipRefCodeABI,
                functionName: 'userPackage',
                args: [address, index],
              })
            var pkgPrice = Number($("#pkgPrice"+index).html().replace(/,/g, ''));
     	 
          var giftAmount = (pkgPrice * $("#pkgPerc"+index).html()/100) * Math.pow(10, decimals);
		
          if(userPackage == true || parseInt(giftFund) >= parseInt(giftAmount)){

            var payableAmount = Number(pkgPrice);
           
            const balance = await fetchBalance({
                address: address,
            })
            if (parseFloat(balance.formatted) < parseFloat(payableAmount)) {
                //alertify.alert('Warning', 'You don\'t have sufficient balance in your wallet to proceed with this transaction. <a target="blank" href="http://bridge.poodl.org">Please buy some Poodl<a>'); return false;
            }
            
            payableAmount = toWei(payableAmount, decimals); 

            let hash;

             try {

                  //await processTx(PoodlReferralContractAddress,memberShipRefCodeABI,'buyVIPPackage',Array(index,txtPackVal),payableAmount,explorerURL);
                 const result = await writeContract({
                      address: PoodlReferralContractAddress,
                      abi: memberShipRefCodeABI,
                      functionName: 'buyVIPPackage',
                      args: Array(index,txtPackVal),
                      value: payableAmount
                  })
                
                hash = result.hash;

                var vType = "buyVIPPackage";
                var vExtra =  explorerURL + '/tx/' + hash ;
                    saveTx({ hash, vType, payableAmount,giftAmount , pckName ,vExtra });

                    const receipt = await waitForTransaction({ hash });
                    updateTxStatus(hash, receipt.status === "success" ? "confirmed" : "failed");

                  alertify.alert('Transaction Success', 'Your transaction is processing.<br>' + "Please check the status of transaction <a href='" + explorerURL + '/tx/' + hash + "' target='_blank'> Here</a>", function () { });

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

                  updateTxStatus(hash, "failed");

                  alertify.alert("Warning" , errorMessage);
              }

          }
          else {
            alertify.alert('Warning', "Contract does not have enough gift fund. Please contact admin"); return false;
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
          throw e;
      }
  }
