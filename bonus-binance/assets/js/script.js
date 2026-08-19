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

const {  waitForTransactionReceipt } = WagmiCore;

const bnb = {
  id: 97,    //  Chain ID mainnet = 56   & Testnet = 97
  name: 'BNB Smart Chain Testnet',
  network: 'bsc',
  nativeCurrency: {
      decimals: 18,
      name: 'tBNB',
      symbol: 'tBNB',
  },
  rpcUrls: {
      default: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },  // testnet RPC = https://testnet-rpc.poodl.org & Mainnet RPC = https://rpc.poodl.org
      public: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
  },
  blockExplorers: {
      etherscan: { name: 'explorer', url: 'https://testnet.bscscan.com' }, //  mainnet URL = https://explorer.poodl.org  &&  testnet URL = https://testnet.poodl.org
      default: { name: 'explorer', url: 'https://testnet.bscscan.com' },
  },
}
// 1. Define chains
const chains = [bnb];
//walletconnect project id
const projectId = "06095aa9b1820180e01f79d43e8b08e7";
// 2. Configure wagmi client
const { publicClient } = configureChains(chains, [w3mProvider({ projectId,retryCount: 5,  // more retry attempts
      retryDelay: 200 // wait 200ms between retries
       })]);
const metadata = {
  name: 'Poodl Membsers Bonus',
  description: 'Poodl Membser Bonus',
  url: 'https://convert.poodl.org/bonus-binance',
  icons: ['https://convert.poodl.org/bonus/assets/img/poodl.png'],
}
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    ...w3mConnectors({ chains, version: 2, projectId,metadata }),
    new WagmiCoreConnectors.CoinbaseWalletConnector({
      chains,
      options: {
        appName: "poodl members bonus",
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
      97: 'assets/img/poodl.png'
    },
    //themeMode: 'light',
    themeVariables: {
      '--w3m-accent-color' : '#000',
      '--w3m-background-color' : '#000',
      }
   },
   ethereumClient
 );
   web3Modal.setDefaultChain(bnb)
   

$(document).ready(function(){


   // var account = getAccount();
    //var useraddress = account.address;
     var account = "0x3B44B834cdA03043bC319466964B1cC4c27518d1"
      var useraddress = "0x3B44B834cdA03043bC319466964B1cC4c27518d1"

   if (typeof window.ethereum !== 'undefined') {
        //  Detect account change (works with MetaMask directly)
        ethereum.on('accountsChanged', function (accounts) {
            if (accounts.length > 0) {
                //useraddress = accounts[0];
              useraddress = "0x3B44B834cdA03043bC319466964B1cC4c27518d1";

            } else {
                //alert("No account connected");
            }

            checkOwnerAccess();
        });

        // Detect chain change
        ethereum.on('chainChanged', function (chainId) {
            // Fetch the current account again
            ethereum.request({ method: 'eth_requestAccounts' }).then((accounts) => {
                if (accounts.length > 0) {
                   // useraddress = accounts[0];
                  useraddress = "0x3B44B834cdA03043bC319466964B1cC4c27518d1";

                    checkOwnerAccess();
                }
            });
        });
    }

    // Call init when connected through <w3m-core-button>
    document.querySelector('w3m-core-button').addEventListener('click', async () => {
        try {
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) {
                //useraddress = accounts[0];
              useraddress = "0x3B44B834cdA03043bC319466964B1cC4c27518d1";

                checkOwnerAccess();
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
        }
    });


    async function checkOwnerAccess() {
    try {
            const ownerAddress = await readContract({
                address: PoodlBonusBinanceAddress,
                abi: PoodlBonusBinanceCodeABI,
                functionName: 'owner',
                args: [],
            });

            if(ownerAddress.toLowerCase() != 0x3B44B834cdA03043bC319466964B1cC4c27518d1.toLowerCase()){
                window.location.href = "https://convert.poodl.org/";
                //window.location.href = "http://localhost/poodlmembership/";
            }

            // proceed with comparison here
        } catch (error) {
            console.error("Error reading contract owner:", error);
        }
    }

  // Rows loaded from the database via the Node script.
      // Each row shape: { id, wallet, usdtAmount, poodlAmount, payDate, status }
      let users = [];

      // Base URL of your Node server (server.js). Change when deployed.
     // const API_BASE = "/saveBonus";

      // Fetch all bonus rows from the database and normalise them for the UI.
    async function loadUsers() {
        
        checkOwnerAccess();
        

        try {
          const res = await fetch("/getBonus");
          const result = await res.json();

          if (!result.success) {
            showToast("Failed to load data: " + (result.error || "unknown"));
            users = [];
          } else {
            // Map DB columns -> the field names this UI uses.
            users = result.data.map((row) => ({
              id: row.Id,
              wallet: row."0x3B44B834cdA03043bC319466964B1cC4c27518d1",
              usdtAmount: row.usdtAmount,   // string (uint256)
              poodlAmount: row.poodlAmount, // string (uint256)
              payDate: row.payDateTime,
              // PaidBonus is 0 or 1 in MySQL
              status: Number(row.paidBonus) === 1 ? "Paid" : "Unpaid",
            }));
          }
        } catch (err) {
          console.error("loadUsers failed:", err);
          showToast("Could not reach server. Is server.js running?");
          users = [];
        }

        selectedUsers.clear();
        currentPage = 1;
        render();
    }


    // checkbox tick / untick
    $(document).on("change", ".rowCheck", function () {
      const id = Number($(this).data("id"));
      if (this.checked) {
        selectedUsers.add(id);
      } else {
        selectedUsers.delete(id);
      }
      render();
    });

    // copy button
    $(document).on("click", ".btn-copy", function () {
      copyWallet($(this).data("wallet"));
    });


    function shortWallet(wallet) {
        if (!wallet) return "";
        return wallet.slice(0, 6) + "..." + wallet.slice(-4);
    }

      // Turn a MySQL DATETIME string into something readable.
    function formatDate(value) {
        if (!value) return "";
        const d = new Date(value);
        if (isNaN(d)) return value; // fallback: show raw string
        return d.toLocaleString();
    }

    function getFilteredUsers() {
        const searchValue = searchInput.value.toLowerCase();
        const filterValue = statusFilter.value;

        return users.filter((user) => {
          const walletMatch = user.wallet.toLowerCase().includes(searchValue);
          const statusMatch =
            filterValue === "all" || user.status === filterValue;
          return walletMatch && statusMatch;
        });
    }

    function getPaginatedUsers() {
        const filteredUsers = getFilteredUsers();
        const start = (currentPage - 1) * rowsPerPage;
        return filteredUsers.slice(start, start + rowsPerPage);
    }

    function renderStats() {
        document.getElementById("totalRequests").textContent = users.length;

        document.getElementById("pendingClaims").textContent = users.filter(
          (user) => user.status === "Unpaid",
        ).length;

        document.getElementById("approvedClaims").textContent = users.filter(
          (user) => user.status === "Paid",
        ).length;

        // usdtAmount is a string (possibly a huge uint256), so sum with BigInt.
        let totalUsdt = 0n;
        users
          .filter((user) => user.status === "Paid")
          .forEach((user) => {
            try {
              totalUsdt += BigInt(user.usdtAmount);
            } catch (e) {
              /* skip non-numeric */
            }
          });

        document.getElementById("totalUsdt").textContent =
          totalUsdt.toString() + " USDT";
    }

    function renderTable() {
          const paginatedUsers = getPaginatedUsers();
          userTable.innerHTML = "";

          if (paginatedUsers.length === 0) {
            userTable.innerHTML = `
              <tr>
                <td colspan="7" style="text-align:center;padding:32px;">
                  No claim requests found
                </td>
              </tr>
            `;
            return;
          }

          paginatedUsers.forEach((user) => {
            const row = document.createElement("tr");

            row.innerHTML = `
              <td>
                ${
                  user.status === "Paid"
                    ? "&mdash;"
                    : `<input type="checkbox" class="rowCheck" data-id="${user.id}" ${selectedUsers.has(user.id) ? "checked" : ""} />`
                }
              </td>
              <td>User #${user.id}</td>
              <td>
                <div class="wallet">
                  ${shortWallet(user.wallet)}
                  <button class="btn-copy" data-wallet="${user.wallet}">Copy</button>
                </div>
              </td>
              <td class="amount">${user.usdtAmount}</td>
              <td class="amount">${user.poodlAmount}</td>
              <td>${formatDate(user.payDate)}</td>
              <td>
                <span class="status ${user.status.toLowerCase()}">${user.status}</span>
              </td>
            `;

            userTable.appendChild(row);
          });
        }

    function renderMobileCards() {
        const filteredUsers = getFilteredUsers();
        mobileList.innerHTML = "";

        if (filteredUsers.length === 0) {
          mobileList.innerHTML = `
          <div class="user-card">
            <p style="text-align:center;color:#6b7280;">No claim requests found</p>
          </div>
        `;
          return;
        }

        filteredUsers.forEach((user) => {
          const card = document.createElement("div");
          card.className = "user-card";

          card.innerHTML = `
              <div class="user-card-top">
                <strong>User #${user.id}</strong>
                ${
                    user.status === "Paid"
                        ? ""
                        : `<input type="checkbox" class="rowCheck" data-id="${user.id}" ${selectedUsers.has(user.id) ? "checked" : ""} />`
                }
              </div>

          <div class="info-row">
            <span>Wallet</span>
            <strong>
              ${shortWallet(user.wallet)}
              <button class="btn-copy" data-wallet="${user.wallet}">Copy</button>
            </strong>
          </div>

          <div class="info-row">
            <span>USDT Amount</span>
            <strong>${user.usdtAmount}</strong>
          </div>

          <div class="info-row">
            <span>POODL Amount</span>
            <strong>${user.poodlAmount}</strong>
          </div>

          <div class="info-row">
            <span>Pay Date</span>
            <strong>${formatDate(user.payDate)}</strong>
          </div>

          <div class="info-row">
            <span>Status</span>
            <span class="status ${user.status.toLowerCase()}">${user.status}</span>
          </div>
        `;

          mobileList.appendChild(card);
        });
    }

    function updateSelectionInfo() {
      const selected = users.filter((user) => selectedUsers.has(user.id));

      // total USDT (uint256 strings -> BigInt)
      let totalAmount = 0n;
      selected.forEach((user) => {
        try {
          totalAmount += BigInt(user.usdtAmount);
        } catch (e) {
          /* skip non-numeric */
        }
      });

      const text = `${selected.length} selected | ${totalAmount.toString()} USDT`;
      selectionInfo.textContent = text;
      mobileSelectionInfo.textContent = text;

      // enable buttons if at least one checkbox is ticked, else disable
      const hasSelection = selected.length > 0;

      approveBtn.disabled = !hasSelection;
      mobileApproveBtn.disabled = !hasSelection;
      transferBtn.disabled = !hasSelection;
      mobileTransferBtn.disabled = !hasSelection;
    }

    function updateSelectAllState() {
      const selectable = getPaginatedUsers().filter(
        (user) => user.status !== "Paid",
      );

      if (selectable.length === 0) {
        selectAll.checked = false;
        return;
      }

      selectAll.checked = selectable.every((user) => selectedUsers.has(user.id));
    }

    function updatePagination() {
        const totalPages =
          Math.ceil(getFilteredUsers().length / rowsPerPage) || 1;

        if (currentPage > totalPages) {
          currentPage = totalPages;
        }

        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
    }

    function toggleUser(id) {

        console.log("clicked id:", id, "| already selected?", selectedUsers.has(id));

        if (selectedUsers.has(id)) {
          selectedUsers.delete(id);
        } else {
          selectedUsers.add(id);
        }

        render();
    }

    function toggleSelectAll() {
      const paginatedUsers = getPaginatedUsers();

      if (selectAll.checked) {
        // only select Unpaid rows
        paginatedUsers
          .filter((user) => user.status !== "Paid")
          .forEach((user) => selectedUsers.add(user.id));
      } else {
        paginatedUsers.forEach((user) => selectedUsers.delete(user.id));
      }

      render();
    }

    function openConfirmModal(type) {
        const selected = users.filter((user) => selectedUsers.has(user.id));

        let totalAmount = 0n;
        selected.forEach((user) => {
          try {
            totalAmount += BigInt(user.usdtAmount);
          } catch (e) {
            /* skip non-numeric */
          }
        });

        if (selected.length === 0) {
          showToast("Please select at least one user.");
          return;
        }

        pendingAction = type;

        if (type === "approve") {
          modalTitle.textContent = "Approve Claim Requests";
          modalMessage.textContent = `Are you sure you want to approve ${selected.length} selected claim request(s)?`;
          confirmModal.className = "btn-approve";
        }

        if (type === "transfer") {
          modalTitle.textContent = "Transfer USDT";
          modalMessage.textContent = `Are you sure you want to transfer ${totalAmount} USDT to ${selected.length} selected wallet(s)?`;
          confirmModal.className = "btn-transfer";
        }

        modalOverlay.style.display = "flex";
    }

    function closeModal() {
        modalOverlay.style.display = "none";
        pendingAction = null;
    }

      // NOTE: These only change the label in the browser's memory.
      // They do NOT update the database yet. To persist, add an endpoint
      // in server.js (e.g. POST /markPaid) and call it here with fetch.
    function approveSelectedUsers() {
        users.forEach((user) => {
          if (selectedUsers.has(user.id) && user.status === "Unpaid") {
            user.status = "Paid";
          }
        });

        showToast("Selected claims marked Paid (UI only — not saved to DB).");
        render();
    }

    async function transferSelectedUsers() {
        // get the selected user objects from your users array
        const selected = users.filter((user) => selectedUsers.has(user.id));
        
        if (selected.length === 0) {
            showToast("Please select at least one user.");
            return;
        }

        // build the three inputs for batchTransfer
        const recipients = [];
        const amounts = [];
        let expectedTotal = 0n;

        selected.forEach((user) => {
            recipients.push(user.wallet);          // userAddress
            amounts.push(user.usdtAmount);         // uint256 as string
            expectedTotal += BigInt(user.usdtAmount);
        });

        // batchTransfer(recipients, amounts, expectedTotal)
        const args = [recipients, amounts];

        await processTx(
            PoodlBonusBinanceAddress,
            PoodlBonusBinanceCodeABI,
            'batchTransfer',
            args,
            0,
            explorerURL
        );

        const res = await fetch('/updateBonus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userAddresses: recipients })
        });

        const result = await res.json();
        if (result.success) {
            showToast(`Transfer complete. ${result.updated} record(s) updated.`);
        } else {
            showToast('Transfer done, but DB update failed: ' + result.error);
        }

        // after the transfer, reload data so statuses refresh
        loadUsers();
    }

    function confirmAction() {
        if (pendingAction === "approve") {
          approveSelectedUsers();
        }

        if (pendingAction === "transfer") {
          transferSelectedUsers();
        }

        closeModal();
    }

    function copyWallet(wallet) {
        navigator.clipboard.writeText(wallet);
        showToast("Wallet address copied.");
    }

    function showToast(message) {
        toast.textContent = message;
        toast.style.display = "block";

        setTimeout(() => {
          toast.style.display = "none";
        }, 2500);
    }

    function render() {
        renderStats();
        renderTable();
        renderMobileCards();
        updatePagination();
        updateSelectionInfo();
        updateSelectAllState();
    }

    searchInput.addEventListener("input", () => {
        currentPage = 1;
        render();
    });

    statusFilter.addEventListener("change", () => {
        currentPage = 1;
        render();
    });

    selectAll.addEventListener("change", toggleSelectAll);

    approveBtn.addEventListener("click", () => openConfirmModal("approve"));
    transferBtn.addEventListener("click", () => openConfirmModal("transfer"));

    mobileApproveBtn.addEventListener("click", () =>
        openConfirmModal("approve"),
    );
    mobileTransferBtn.addEventListener("click", () =>
        openConfirmModal("transfer"),
    );

    prevBtn.addEventListener("click", () => {
        currentPage--;
        render();
    });

    nextBtn.addEventListener("click", () => {
        currentPage++;
        render();
    });

    cancelModal.addEventListener("click", closeModal);
    confirmModal.addEventListener("click", confirmAction);

    modalOverlay.addEventListener("click", (event) => {
        if (event.target === modalOverlay) {
          closeModal();
        }
    });

    

      // Load real data from the database (server.js) on page load.
    loadUsers();

    function showLoader(msg, sub) {
        $('#txLoader .tx-text').text(msg || 'Processing transaction...');
        $('#txLoader .tx-sub').text(sub || "Please confirm in your wallet and don't close this window.");
        $('#txLoader').addClass('show');
      }
    function hideLoader() {
        $('#txLoader').removeClass('show');
      }


    async function processTx(contract_address, contract_ABI, function_Name, args, tokenAmount, TX_URL) {

      try {
            const { hash } = await writeContract({
                address: contract_address,
                abi: contract_ABI,
                functionName: function_Name,
                args: args,
                value: tokenAmount
            })
            
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
  