import "./UserDashboard.css";
import React, { useCallback, useEffect, useState } from "react";
import getWeb3 from "../../handlers/Web3Handler";
import MultiValidatorABI from "../../abis/MultiValidator.json";
import MintTokensABI from "../../abis/MintTokens.json";
import ammABI from "../../abis/AMM.json";
import nftABI from "../../abis/MintNFT.json";

import { MapContainer, TileLayer, Rectangle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";

const SelectRegion = ({ setBounds }) => {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const offset = 0.05;
      const newBounds = [
        [lat - offset, lng - offset],
        [lat + offset, lng + offset],
      ];
      setBounds(newBounds);
    },
  });

  return null;
};

const useDashboardFeedback = () => {
  const [loadingKey, setLoadingKey] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const runWithLoading = useCallback(async (key, task) => {
    setLoadingKey(key);
    try {
      return await task();
    } finally {
      setLoadingKey("");
    }
  }, []);

  return { loadingKey, toast, showToast, runWithLoading };
};

const Toast = ({ toast }) => {
  if (!toast) {
    return null;
  }

  return (
    <div className={`dashboard-toast dashboard-toast-${toast.type}`}>
      {toast.message}
    </div>
  );
};

const ActionButton = ({ loadingKey, actionKey, className, children, ...props }) => {
  const isLoading = loadingKey === actionKey;
  return (
    <button {...props} className={className} disabled={isLoading || props.disabled}>
      {isLoading && <span className="btn-spinner" />}
      {children}
    </button>
  );
};

const GeneratorDashboard = (props) => {
  const [web3, setWeb3] = useState(null);
  const [genAddress, setGenAddress] = useState("");
  const [tokensReceived, setTokensReceived] = useState("");
  const [listAmount, setListAmount] = useState("");
  const [pricePerCCT, setPricePerCCT] = useState("");
  const [ndvi, setNDVI] = useState(0);
  const [bounds, setBounds] = useState([
    [20.5937, 78.9629],
    [20.7037, 79.0629],
  ]);

  const { loadingKey, toast, showToast, runWithLoading } = useDashboardFeedback();

  const handleConnectWallet = async () => {
    await runWithLoading("connect", async () => {
      try {
        const web3Instance = await getWeb3();
        if (!web3Instance) {
          showToast("error", "Không thể khởi tạo Web3.");
          return;
        }

        setWeb3(web3Instance);
        const accounts = await web3Instance.eth.getAccounts();

        if (accounts.length > 0) {
          setGenAddress(accounts[0]);
          showToast("success", "Đã kết nối ví Generator thành công.");
        } else {
          showToast("error", "Không tìm thấy tài khoản MetaMask.");
        }
      } catch (error) {
        console.error("Error connecting wallet!", error);
        showToast("error", "Lỗi kết nối ví.");
      }
    });
  };

  const handleNDVICalcFromMap = async () => {
    await runWithLoading("calc-ndvi", async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_PYTHON_BE_URL}/api/calculate-ndvi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bounds }),
        });

        if (!response.ok) {
          showToast("error", "Tính NDVI thất bại.");
          return;
        }

        const data = await response.json();
        setNDVI(data.ndvi);
        showToast("success", "Đã tính NDVI thành công.");
      } catch (error) {
        console.error("Error calling NDVI API:", error);
        showToast("error", "Không gọi được API NDVI.");
      }
    });
  };

  const sendNDVI = async () => {
    await runWithLoading("send-ndvi", async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/send-ndvi`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-type": "application/json",
          },
          body: JSON.stringify({ address: genAddress, value: ndvi, coords: bounds }),
        });

        if (!response.ok) {
          showToast("error", "Gửi NDVI thất bại.");
          return;
        }

        await response.json();
        setNDVI("0");
        showToast("success", "Đã gửi NDVI cho Validators.");
      } catch (error) {
        console.error(error);
        showToast("error", "Lỗi khi gửi NDVI.");
      }
    });
  };

  const fetchTokensReceived = async () => {
    if (!web3 || !genAddress) {
      showToast("error", "Vui lòng kết nối ví trước.");
      return;
    }

    await runWithLoading("view-cct", async () => {
      try {
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = MintTokensABI.networks[networkId];
        const mintContract = new web3.eth.Contract(MintTokensABI.abi, deployedNetwork.address);

        const balance = await mintContract.methods.balanceOf(genAddress).call();
        const cctBalance = await web3.utils.fromWei(balance, "ether");
        setTokensReceived(cctBalance);
        showToast("success", "Đã cập nhật số dư CCT.");
      } catch (error) {
        console.error("Error fetching tokens:", error);
        showToast("error", "Không lấy được số dư CCT.");
      }
    });
  };

  const listOnAMM = async () => {
    if (!web3 || !genAddress) {
      showToast("error", "Vui lòng kết nối ví trước.");
      return;
    }

    if (!listAmount || !pricePerCCT) {
      showToast("error", "Nhập đầy đủ số lượng CCT và giá ETH.");
      return;
    }

    await runWithLoading("list-amm", async () => {
      try {
        const networkId = await web3.eth.net.getId();
        const ammNetwork = ammABI.networks[networkId];
        const mintNetwork = MintTokensABI.networks[networkId];

        const ammContract = new web3.eth.Contract(ammABI.abi, ammNetwork.address);
        const mintContract = new web3.eth.Contract(MintTokensABI.abi, mintNetwork.address);

        const amountInWei = web3.utils.toWei(listAmount.toString(), "ether");
        showToast("info", "Đang chờ ký Approve trên MetaMask...");
        await mintContract.methods.approve(ammNetwork.address, amountInWei).send({ from: genAddress });

        showToast("info", "Đang chờ ký List Tokens trên MetaMask...");
        await ammContract.methods.listTokens(listAmount, pricePerCCT).send({ from: genAddress });

        setListAmount("");
        setPricePerCCT("");
        showToast("success", "Niêm yết CCT lên AMM thành công.");
      } catch (error) {
        console.error("Lỗi khi niêm yết:", error);
        showToast("error", "Niêm yết CCT thất bại.");
      }
    });
  };

  const handleLogout = () => {
    props.setIsLoggedIn(false);
  };

  return (
    <React.Fragment>
      <div className="dashboard-shell">
        <Toast toast={toast} />
        <div className="dashboard-header">
          <p className="dashboard-kicker">Carbon Credit Ecosystem</p>
          <h1>Generator Dashboard</h1>
          <p className="dashboard-subtitle">Đo NDVI, gửi bằng chứng hấp thụ carbon và niêm yết CCT lên AMM.</p>
        </div>

        <div className="top-actions">
          <ActionButton loadingKey={loadingKey} actionKey="connect" className="connect-btn" onClick={handleConnectWallet}>
            Connect Wallet
          </ActionButton>
          <p className="wallet-chip">Wallet Address: {genAddress || "Chưa kết nối"}</p>
        </div>

        <div className="dashboard-panel">
          <h3 className="section-title">1) Chọn khu vực dự án</h3>
          <div className="map-container">
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "400px", width: "100%" }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              />
              <Rectangle bounds={bounds} pathOptions={{ color: "green" }} draggable={true} />
              <SelectRegion setBounds={setBounds} />
            </MapContainer>
          </div>

          <div className="action-row left-align">
            <ActionButton loadingKey={loadingKey} actionKey="calc-ndvi" className="fun-btn" onClick={handleNDVICalcFromMap}>
              Calculate NDVI
            </ActionButton>
            <ActionButton loadingKey={loadingKey} actionKey="send-ndvi" className="fun-btn" onClick={sendNDVI}>
              Send NDVI
            </ActionButton>
            <ActionButton loadingKey={loadingKey} actionKey="view-cct" className="fun-btn" onClick={fetchTokensReceived}>
              View CCT
            </ActionButton>
          </div>

          <div className="chip-row">
            <p className="metric-chip">NDVI: <strong>{ndvi}</strong></p>
            <p className="metric-chip">CCT khả dụng: <strong>{tokensReceived || "0"}</strong></p>
          </div>
        </div>

        <div className="dashboard-panel">
          <h3 className="section-title">2) Niêm yết tín chỉ trên AMM</h3>
          <div className="amm-listing">
            <input type="number" placeholder="CCT amount to list" value={listAmount} onChange={(e) => setListAmount(e.target.value)} />
            <input type="number" placeholder="ETH per CCT" value={pricePerCCT} onChange={(e) => setPricePerCCT(e.target.value)} />
            <ActionButton loadingKey={loadingKey} actionKey="list-amm" className="fun-btn" onClick={listOnAMM}>
              List on AMM
            </ActionButton>
          </div>
        </div>

        <div className="footer-action-row">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </React.Fragment>
  );
};

const ConsumerDashboard = (props) => {
  const [web3, setWeb3] = useState(null);
  const [consumerAddress, setConsumerAddress] = useState(null);
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [buyAmount, setBuyAmount] = useState(0);
  const [cctReceived, setCCTReceived] = useState("");
  const [retireAmount, setRetireAmount] = useState("");
  const [crc, setCRC] = useState("");

  const { loadingKey, toast, showToast, runWithLoading } = useDashboardFeedback();

  const handleConnectWallet = async () => {
    await runWithLoading("connect", async () => {
      try {
        const web3Instance = await getWeb3();
        if (!web3Instance) {
          showToast("error", "Không thể khởi tạo Web3.");
          return;
        }

        setWeb3(web3Instance);
        const accounts = await web3Instance.eth.getAccounts();
        if (accounts.length > 0) {
          setConsumerAddress(accounts[0]);
          showToast("success", "Đã kết nối ví Consumer.");
        } else {
          showToast("error", "Không tìm thấy tài khoản MetaMask.");
        }
      } catch (error) {
        console.error("Error connecting wallet!", error);
        showToast("error", "Lỗi kết nối ví.");
      }
    });
  };

  useEffect(() => {
    if (web3 && consumerAddress) {
      fetchFromAMM();
    }
  }, [web3, consumerAddress]);

  const fetchFromAMM = async () => {
    if (!web3) {
      showToast("error", "Vui lòng kết nối ví trước.");
      return;
    }

    await runWithLoading("fetch-amm", async () => {
      try {
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = ammABI.networks[networkId.toString()];
        if (!deployedNetwork) {
          showToast("error", "AMM Contract không tồn tại trên network này.");
          return;
        }
        const contract = new web3.eth.Contract(ammABI.abi, deployedNetwork.address);

        const rawListings = await contract.methods.fetchListings().call();
        // Web3 v4 sometimes returns data in different formats (Array of objects or Array of arrays)
        const formattedListings = rawListings.map((l, index) => {
          // Defensive access: l.seller or l[0], l.amount or l[1], etc.
          const seller = l.seller || l[0];
          const amount = l.amount || l[1];
          const pricePerCCT = l.pricePerCCT || l[2];

          return {
            index,
            seller: seller,
            amount: web3.utils.fromWei(amount.toString(), "ether"),
            pricePerCCT: web3.utils.fromWei(pricePerCCT.toString(), "ether"),
          };
        });

        setListings(formattedListings);
        showToast("success", `Đã tải ${formattedListings.length} danh sách AMM.`);
      } catch (error) {
        console.error("Error fetching listings:", error);
        showToast("error", "Không tải được AMM listings.");
      }
    });
  };

  const buyCCT = async () => {
    if (!web3 || !consumerAddress || !selectedListing) {
      showToast("error", "Chọn listing và kết nối ví trước khi mua.");
      return;
    }

    await runWithLoading("buy-cct", async () => {
      try {
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = ammABI.networks[networkId];
        const ammContract = new web3.eth.Contract(ammABI.abi, deployedNetwork.address);

        const ethRequired = (buyAmount * selectedListing.pricePerCCT).toString();
        const weiToPay = web3.utils.toWei(ethRequired, "ether");

        await ammContract.methods.buyTokens(selectedListing.index, buyAmount).send({ from: consumerAddress, value: weiToPay });
        showToast("success", "Mua CCT thành công.");
      } catch (error) {
        console.error("Lỗi khi mua CCT:", error);
        showToast("error", "Mua CCT thất bại.");
      }
    });
  };

  const displayCCT = async () => {
    if (!web3 || !consumerAddress) {
      showToast("error", "Vui lòng kết nối ví trước.");
      return;
    }

    await runWithLoading("view-cct", async () => {
      try {
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = MintTokensABI.networks[networkId];
        const mintTokensContract = new web3.eth.Contract(MintTokensABI.abi, deployedNetwork.address);

        const balance = await mintTokensContract.methods.balanceOf(consumerAddress).call();
        const cctBalance = web3.utils.fromWei(balance, "ether");
        setCCTReceived(cctBalance);
        showToast("success", "Đã cập nhật số dư CCT.");
      } catch (error) {
        console.error("Error displaying balance:", error);
        showToast("error", "Không lấy được số dư CCT.");
      }
    });
  };

  const viewCRC = async () => {
    if (!web3 || !consumerAddress) {
      showToast("error", "Vui lòng kết nối ví trước.");
      return;
    }

    await runWithLoading("view-crc", async () => {
      try {
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = nftABI.networks[networkId];
        const nftContract = new web3.eth.Contract(nftABI.abi, deployedNetwork.address);

        const currentTokenId = await nftContract.methods.latestTokenId(consumerAddress).call();
        if (currentTokenId.toString() === "0") {
          showToast("info", "Bạn chưa có chứng nhận CRC.");
          return;
        }

        const crcData = await nftContract.methods.getCRCByAddress(consumerAddress).call();
        setCRC({
          owner: crcData[0],
          burnAmount: web3.utils.fromWei(crcData[1], "ether"),
          timestamp: crcData[2],
        });
        showToast("success", "Đã tải thông tin CRC.");
      } catch (error) {
        console.error("Lỗi sâu:", error);
        showToast("error", "Không thể lấy CRC.");
      }
    });
  };

  const retireCredits = async () => {
    if (!web3 || !consumerAddress) {
      showToast("error", "Vui lòng kết nối ví trước.");
      return;
    }

    if (!retireAmount) {
      showToast("error", "Nhập số lượng CCT cần retire.");
      return;
    }

    await runWithLoading("retire-cct", async () => {
      try {
        const networkId = await web3.eth.net.getId();
        const mintNetwork = MintTokensABI.networks[networkId];
        const multiValidatorNetwork = MultiValidatorABI.networks[networkId];
        const mintContract = new web3.eth.Contract(MintTokensABI.abi, mintNetwork.address);

        const amountInWei = web3.utils.toWei(retireAmount.toString(), "ether");
        showToast("info", "Đang chờ ký Approve retire trên MetaMask...");
        await mintContract.methods.approve(multiValidatorNetwork.address, amountInWei).send({ from: consumerAddress });

        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/retire-cct`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: consumerAddress,
            amount: retireAmount,
          }),
        });

        if (response.ok) {
          showToast("success", "Đã gửi yêu cầu retire. Chờ validator duyệt.");
        } else {
          showToast("error", "Gửi yêu cầu retire thất bại.");
        }
      } catch (error) {
        console.error(error);
        showToast("error", "Retire thất bại hoặc bị từ chối ký.");
      }
    });
  };

  const handleLogout = () => {
    props.setIsLoggedIn(false);
  };

  return (
    <React.Fragment>
      <div className="dashboard-shell">
        <Toast toast={toast} />
        <div className="dashboard-header">
          <p className="dashboard-kicker">Carbon Credit Ecosystem</p>
          <h1>Consumer Dashboard</h1>
          <p className="dashboard-subtitle">Mua CCT từ AMM, retire tín chỉ và nhận chứng nhận CRC NFT.</p>
        </div>

        <div className="top-actions">
          <ActionButton loadingKey={loadingKey} actionKey="connect" className="connect-btn" onClick={handleConnectWallet}>
            Connect Wallet
          </ActionButton>
          <p className="wallet-chip">Wallet Address: {consumerAddress || "Chưa kết nối"}</p>
        </div>

        <div className="dashboard-panel">
          <h3 className="section-title">1) AMM Market Listings</h3>
          <div className="action-row left-align">
            <ActionButton loadingKey={loadingKey} actionKey="fetch-amm" className="fun-btn" onClick={fetchFromAMM}>Fetch from AMM</ActionButton>
            <ActionButton loadingKey={loadingKey} actionKey="view-cct" className="fun-btn" onClick={displayCCT}>View CCT</ActionButton>
            <ActionButton loadingKey={loadingKey} actionKey="view-crc" className="fun-btn" onClick={viewCRC}>View CRC</ActionButton>
          </div>

          <div id="cct-listings">
            {listings.length > 0 ? (
              listings.map((listing, idx) => (
                <div key={idx} className="listing-item" onClick={() => setSelectedListing(listing)}>
                  <p>Seller: {listing.seller}</p>
                  <p>Amount: {listing.amount} CCT</p>
                  <p>Price: {listing.pricePerCCT} ETH per CCT</p>
                </div>
              ))
            ) : (
              <p>No listings available...</p>
            )}
          </div>

          {selectedListing && (
            <div className="buy-section">
              <p>From: {selectedListing.seller}</p>
              <p>CCT: {selectedListing.amount}</p>
              <p>Price: {selectedListing.pricePerCCT} ETH per CCT</p>
              <div className="buy-row">
                <input type="number" placeholder="Enter amount" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} />
                <ActionButton loadingKey={loadingKey} actionKey="buy-cct" className="fun-btn" onClick={buyCCT}>Buy CCT</ActionButton>
              </div>
              <p>ETH required: {buyAmount * selectedListing.pricePerCCT}</p>
            </div>
          )}

          <div className="chip-row">
            <p className="metric-chip">CCT trong ví: <strong>{cctReceived || "0"}</strong></p>
          </div>
        </div>

        <div className="dashboard-panel">
          <h3 className="section-title">2) Retire Carbon Credits</h3>
          <div className="retire-sec">
            <input type="number" placeholder="CCT amount to retire" value={retireAmount} onChange={(e) => setRetireAmount(e.target.value)} />
            <ActionButton loadingKey={loadingKey} actionKey="retire-cct" className="fun-btn" onClick={retireCredits}>Retire CCT</ActionButton>
          </div>

          {crc && (
            <div className="certificate-card">
              <b>CARBON REMOVAL CERTIFICATE</b>
              <p>Owner: {crc.owner}</p>
              <p>Amount retired: {crc.burnAmount} CCT</p>
            </div>
          )}
        </div>

        <div className="footer-action-row">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </React.Fragment>
  );
};

const ValidatorDashboard = (props) => {
  const [web3, setWeb3] = useState(null);
  const [validatorAddress, setValidatorAddress] = useState(null);
  const [credits, setCredits] = useState("");
  const [receivedAddress, setReceivedAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [addressGen, setAddressGen] = useState("");
  const [ndvi, setNDVI] = useState(0);
  const [sequestrationAmount, setSequestrationAmount] = useState("");
  const [coords, setCoords] = useState("");
  const [status, setStatus] = useState("not verified");
  const [requestId, setRequestId] = useState("");

  const { loadingKey, toast, showToast, runWithLoading } = useDashboardFeedback();

  const handleConnectWallet = async () => {
    await runWithLoading("connect", async () => {
      try {
        const web3Instance = await getWeb3();
        if (!web3Instance) {
          showToast("error", "Không thể khởi tạo Web3.");
          return;
        }

        setWeb3(web3Instance);
        const accounts = await web3Instance.eth.getAccounts();
        if (accounts.length > 0) {
          setValidatorAddress(accounts[0]);
          showToast("success", "Đã kết nối ví Validator.");
        } else {
          showToast("error", "Không tìm thấy tài khoản MetaMask.");
        }
      } catch (error) {
        console.error("Error connecting wallet!", error);
        showToast("error", "Lỗi kết nối ví.");
      }
    });
  };

  const approveEvidence = async () => {
    if (status !== "verified" || credits === "" || !addressGen || !requestId) {
      showToast("error", "Chưa thể approve CCT. Hãy nhận request và verify NDVI trước.");
      return;
    }

    await runWithLoading("approve-cct", async () => {
      try {
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = MultiValidatorABI.networks[networkId];
        const contract = new web3.eth.Contract(MultiValidatorABI.abi, deployedNetwork.address);

        // KIỂM TRA TRẠNG THÁI HIỆN TẠI TRÊN CONTRACT
        const req = await contract.methods.mintRequests(addressGen, requestId).call();
        const hasVoted = await contract.methods.hasVotedMint(requestId, validatorAddress).call();

        if (req.isCompleted) {
          showToast("error", "Yêu cầu này đã hoàn tất rồi.");
          return;
        }

        if (hasVoted) {
          showToast("error", "Bạn đã phê duyệt (vote) cho yêu cầu này rồi.");
          return;
        }

        if (Number(req.approvalCount) !== 0) {
          const existingCredits = web3.utils.fromWei(req.creditAmount, "ether");
          if (existingCredits.toString() !== credits.toString()) {
            showToast("error", `Mismatched credits! Validator trước đã duyệt ${existingCredits} CCT. Bạn cần duyệt khớp con số này.`);
            return;
          }
        }

        await contract.methods.voteToApprove(addressGen, credits, requestId).send({ from: validatorAddress });

        setAddressGen("");
        setNDVI("");
        setCoords("");
        setSequestrationAmount("");
        setCredits("");
        setStatus("not verified");
        showToast("success", "Đã approve CCT cho Generator.");
      } catch (error) {
        console.error("Error approving evidence:", error);
        showToast("error", "Approve CCT thất bại hoặc bị từ chối.");
      }
    });
  };

  const approveNFT = async () => {
    if (!amount || !receivedAddress || !requestId) {
      showToast("error", "Không có yêu cầu retire hợp lệ từ Consumer.");
      return;
    }

    await runWithLoading("approve-crc", async () => {
      try {
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = MultiValidatorABI.networks[networkId];
        const burnContract = new web3.eth.Contract(MultiValidatorABI.abi, deployedNetwork.address);

        // Kiểm tra vote
        const hasVoted = await burnContract.methods.hasVotedBurn(requestId, validatorAddress).call();
        if (hasVoted) {
          showToast("error", "Bạn đã phê duyệt cho yêu cầu retire này rồi.");
          return;
        }

        await burnContract.methods.burnTokens(receivedAddress, amount, requestId).send({ from: validatorAddress });
        setAmount("");
        setReceivedAddress("");
        showToast("success", "Phê duyệt retire và mint CRC thành công.");
      } catch (error) {
        console.error("Lỗi khi duyệt NFT:", error);
        showToast("error", "Approve CRC thất bại.");
      }
    });
  };

  const rejectEvidence = () => {
    setAddressGen("");
    setNDVI("");
    setCoords("");
    setSequestrationAmount("");
    setStatus("not verified");
    showToast("info", "Đã reject yêu cầu hiện tại.");
  };

  const handleLogout = () => {
    props.setIsLoggedIn(false);
  };

  useEffect(() => {
    let socket;

    const initializeWebSocket = async () => {
      socket = new WebSocket(`${process.env.REACT_APP_WEBSOCKET_URL}`);
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "consumer") {
          setReceivedAddress(data.address);
          setAmount(data.amount);
          setRequestId(data.requestId);
          showToast("info", "Có yêu cầu retire mới từ Consumer.");
        } else if (data.type === "generator") {
          setAddressGen(data.address);
          setNDVI(data.value);
          setCoords(data.coords);
          setRequestId(data.requestId);
          setStatus("not verified");
          setCredits("");
          setSequestrationAmount("");
          showToast("info", "Có dữ liệu NDVI mới từ Generator.");
        }
      };
    };

    initializeWebSocket();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [showToast]);

  const verifyNDVI = async () => {
    if (!addressGen) {
      showToast("error", "Chưa nhận được địa chỉ Generator để verify.");
      return;
    }
    await runWithLoading("verify-ndvi", async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_PYTHON_BE_URL}/api/calculate-ndvi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bounds: coords }),
        });

        if (!response.ok) {
          showToast("error", "Xác minh NDVI thất bại.");
          return;
        }

        const data = await response.json();
        if (data.ndvi === ndvi) {
          setStatus("verified");
          showToast("success", "NDVI đã được xác minh thành công.");
        } else {
          setStatus("not verified");
          showToast("error", "NDVI không khớp dữ liệu Generator.");
        }
      } catch (error) {
        console.error("Error calling NDVI API:", error);
        showToast("error", "Không gọi được API verify NDVI.");
      }
    });
  };

  const estimateCO2Sequestration = async () => {
    await runWithLoading("estimate-co2", async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_PYTHON_BE_URL}/api/estimate-co2`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-type": "application/json",
          },
          body: JSON.stringify({ ndvi }),
        });

        if (!response.ok) {
          showToast("error", "Estimate CO2 thất bại.");
          return;
        }

        const data = await response.json();
        setSequestrationAmount(data.amount);
        setCredits(data.credits);
        showToast("success", "Đã estimate lượng CO2 và credits.");
      } catch (error) {
        console.log(error);
        showToast("error", "Lỗi khi estimate CO2.");
      }
    });
  };

  return (
    <React.Fragment>
      <div className="dashboard-shell">
        <Toast toast={toast} />
        <div className="dashboard-header">
          <p className="dashboard-kicker">Carbon Credit Ecosystem</p>
          <h1>Validator Dashboard</h1>
          <p className="dashboard-subtitle">Kiểm định NDVI, phê duyệt mint CCT và xác nhận retire để phát hành CRC.</p>
        </div>

        <div className="top-actions">
          <ActionButton loadingKey={loadingKey} actionKey="connect" className="connect-btn" onClick={handleConnectWallet}>
            Connect Wallet
          </ActionButton>
          <p className="wallet-chip">Wallet Address: {validatorAddress || "Chưa kết nối"}</p>
        </div>

        <div className="evidence-section">
          <div className="gen-section">
            <h3 className="section-title">Yêu cầu phát hành từ Generator</h3>
            <p>Generator Address: {addressGen || "-"}</p>
            <p className="metric-chip">NDVI: <strong>{ndvi || 0}</strong></p>
            <p>Status: <strong>{status}</strong></p>
            <p>Sequestration amount: {sequestrationAmount || 0} tons</p>

            <div className="action-row">
              <ActionButton loadingKey={loadingKey} actionKey="verify-ndvi" className="fun-btn" onClick={verifyNDVI} disabled={!addressGen}>Verify NDVI</ActionButton>
              <ActionButton loadingKey={loadingKey} actionKey="estimate-co2" className="fun-btn" onClick={estimateCO2Sequestration} disabled={!addressGen}>Estimate CO2</ActionButton>
            </div>

            <div className="approve-reject">
              <ActionButton loadingKey={loadingKey} actionKey="approve-cct" className="fun-btn" onClick={approveEvidence} disabled={!addressGen || status !== "verified"}>Approve CCT</ActionButton>
              <button className="danger-btn" onClick={rejectEvidence} disabled={!addressGen}>Reject</button>
            </div>
          </div>

          <div className="con-section">
            <h3 className="section-title">Yêu cầu retire từ Consumer</h3>
            <p>Consumer Address: {receivedAddress || "-"}</p>
            <p>Retire Amount: {amount || 0}</p>
            <div className="action-row left-align">
              <ActionButton loadingKey={loadingKey} actionKey="approve-crc" className="fun-btn" onClick={approveNFT}>Approve CRC</ActionButton>
            </div>
          </div>
        </div>

        <div className="footer-action-row">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </React.Fragment>
  );
};

const UserDashboard = (props) => {
  const userType = props.location.state?.userType || props.userType || props.forcedUserType || "generator";
  const { setIsLoggedIn } = props;

  let Component;
  switch (userType) {
    case "generator":
      Component = GeneratorDashboard;
      break;
    case "consumer":
      Component = ConsumerDashboard;
      break;
    case "validator":
      Component = ValidatorDashboard;
      break;
    default:
      Component = GeneratorDashboard;
  }

  return (
    <React.Fragment>
      <div className="user-dashboard">
        <div className="dashboard-backdrop"></div>
        <Component setIsLoggedIn={setIsLoggedIn} />
      </div>
    </React.Fragment>
  );
};

export default UserDashboard;
