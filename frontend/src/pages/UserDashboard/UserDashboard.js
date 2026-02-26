import "./UserDashboard.css";
import React, { useState, useEffect} from "react";
import getWeb3 from "../../handlers/Web3Handler";
import MultiValidatorABI from "../../abis/MultiValidator.json";
import MintTokensABI from "../../abis/MintTokens.json";
import ammABI from "../../abis/AMM.json";
import nftABI from "../../abis/MintNFT.json";

import { MapContainer, TileLayer, Rectangle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';

// const SoilSequestration = () => {
   
//     const [ws, setWs] = useState(null);

//     useEffect(() => {
//         const socket = new WebSocket("ws://localhost:8080");
//         setWs(socket);

//         socket.onopen = () => console.log("WebSocket connected!");
//         socket.onerror = (error) => console.error("WebSocket Error:", error);
//         socket.onclose = () => console.log("WebSocket Disconnected!");

//         return () => socket.close();
//     }, []);
// };

const SelectRegion = ({ setBounds }) => {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      // Generate a small rectangle around the click
      const offset = 0.05;
      const newBounds = [
        [lat - offset, lng - offset],
        [lat + offset, lng + offset]
      ];
      setBounds(newBounds);
      console.log(newBounds)
    }
  });
  return null;
};


// const generatorAddress="0x59Bee23311a82E1984f188bf6Ba886Cd723daf32";
// const consumerAddress="0x8FC62510F4D3fb7259FE8AC091685222c1A6a211";

// const mintTokensContractAddress="0xB8e168E45767a6c343bAc3BC69E3322C41AB5492";
// const nftContractAddress="0x3982A6bE54499a69ECd02A9Ace26556E8A5183dF";
// const multiValidatorContractAddress="0x015bDDb1B132F58e8e94348d51a623a27363573f";
// const ammContractAddress="0x719EfaFeFBF4A036188E54Ef164CFAA34d1B7924";

const GeneratorDashboard=(props)=>{
    const [web3,setWeb3]=useState(null);
    const [genAddress,setGenAddress]=useState("");
    const [tokensReceived, setTokensReceived]=useState("");
    const [listAmount,setListAmount]=useState("");
    const [pricePerCCT,setPricePerCCT]=useState("");
    const [ndvi,setNDVI]=useState(0);
    const [bounds, setBounds] = useState([
        [20.5937, 78.9629], // southwest 
        [20.7037, 79.0629]  // northeast
        ]);
   
    //wallet connection
    const handleConnectWallet=async()=>{
        try{
            const web3Instance=await getWeb3();
                
            if(web3Instance){
                setWeb3(web3Instance);
                console.log('Web3 initialized!',web3Instance);
            }else{
                console.error('Failed to initialize Web3!');
                return;
            }
               
            const accounts = await web3Instance.eth.getAccounts();
            if (accounts.length > 0){
                setGenAddress(accounts[0]);
                console.log(`Connected Wallet Address: ${accounts[0]}`);
            }else{
                console.error('No accounts found!');
                return;
            }
        }catch(error){
            console.error("Error connecting wallet!");   
        } 
    }
     
    const handleNDVICalcFromMap = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/calculate-ndvi", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                bounds: bounds // send SW and NE corners
            })
            });

            if (response.ok) {
            const data = await response.json();
            console.log(data);
            setNDVI(data.ndvi);
            } else {
            console.error("NDVI calculation failed.");
            }
        } catch (error) {
            console.error("Error calling NDVI API:", error);
        }
    };

    const sendNDVI=async()=>{
       try{
            const response=await fetch("http://localhost:8000/api/send-ndvi",{
                method:"POST",
                headers:{
                    Accept:"application/json",
                    "Content-type":"application/json"
                },
                body:JSON.stringify({address:genAddress,value:ndvi,coords:bounds})
            });

            if(response.ok){
                const data=await response.json();
                console.log(data);
                setNDVI("0");
            }
        }catch(error){
            console.log(error);
        }
    }
    
    //fetch CCT Balance
    const fetchTokensReceived = async () => {
        if (!web3 || !genAddress) return;
        try {
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = MintTokensABI.networks[networkId];
            const mintContract = new web3.eth.Contract(MintTokensABI.abi, deployedNetwork.address);
            
            // Dùng genAddress (ví hiện tại) thay vì generatorAddress hardcode
            const balance = await mintContract.methods.balanceOf(genAddress).call();
            const cctBalance = await web3.utils.fromWei(balance, "ether");
            console.log("Carbon Tokens:", cctBalance);
            setTokensReceived(cctBalance); 
        } catch (error) {
            console.error("Error fetching tokens:", error);
        }
    };

    //listing on AMM
    const listOnAMM = async () => {
        if (!web3 || !genAddress) return;
        try {
            const networkId = await web3.eth.net.getId();
            
            // Lấy địa chỉ của cả 2 Contract
            const ammNetwork = ammABI.networks[networkId];
            const mintNetwork = MintTokensABI.networks[networkId];
            
            const ammContract = new web3.eth.Contract(ammABI.abi, ammNetwork.address);
            const mintContract = new web3.eth.Contract(MintTokensABI.abi, mintNetwork.address);
            
            // Hợp đồng AMM.sol tự nhân 10**18 ở bên trong, nên ta phải tính số lượng Wei để Approve
            const amountInWei = web3.utils.toWei(listAmount.toString(), "ether");

            // BƯỚC 1: CẤP QUYỀN (APPROVE) CHO AMM
            console.log("Đang cấp quyền cho AMM Contract...");
            alert("Vui lòng xác nhận giao dịch Approve trên MetaMask (Bước 1/2)");
            await mintContract.methods.approve(ammNetwork.address, amountInWei).send({from: genAddress});
            
            // BƯỚC 2: NIÊM YẾT LÊN SÀN (LIST)
            console.log("Đang niêm yết lên sàn...");
            alert("Vui lòng xác nhận giao dịch List Tokens trên MetaMask (Bước 2/2)");
            await ammContract.methods.listTokens(listAmount, pricePerCCT).send({from: genAddress});
            
            console.log(`Listed ${listAmount} CCT at ${pricePerCCT} ETH each`);
            alert("🎉 Niêm yết CCT lên sàn thành công!");
            
            // Reset input
            setListAmount("");
            setPricePerCCT("");
        } catch (error) {
            console.error("Lỗi khi niêm yết:", error);
            alert("Giao dịch thất bại! Vui lòng kiểm tra lại console.");
        }
    }

    //logout
    const handleLogout=()=>{
        props.setIsLoggedIn(false);
        console.log(`Logged out!`);
    }
    
    return (
    <React.Fragment>
        <div className="dashboard-shell">
            <div className="dashboard-header">
                <p className="dashboard-kicker">Carbon Credit Ecosystem</p>
                <h1>Generator Dashboard</h1>
                <p className="dashboard-subtitle">Đo NDVI, gửi bằng chứng hấp thụ carbon và niêm yết CCT lên AMM.</p>
            </div>
                
            {/*wallet connection*/}
            <br/>
            <button className="connect-btn" onClick={handleConnectWallet}>Connect Wallet</button>
            <br/>
            <p className="wallet-chip">Wallet Address: {genAddress || "Chưa kết nối"}</p>
        
            {/** */}
            <br/>
            <h3 className="section-title">1) Chọn khu vực dự án</h3>
            
            <div className="map-container">
                <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "400px", width: "100%" }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                    />
                    <Rectangle
                        bounds={bounds}
                        pathOptions={{ color: 'green' }}
                        draggable={true}
                    />
                    <SelectRegion setBounds={setBounds} />
                </MapContainer>
            </div>

            <br/>
            <button className="fun-btn" onClick={handleNDVICalcFromMap}>Calculate NDVI</button>
            <p className="metric-chip">NDVI: <strong>{ndvi}</strong></p>

            {/**send for approval */}
            <br/>
            <button  className="fun-btn" type="button" onClick={sendNDVI}>Send NDVI</button>
            
            {/* Fetch Tokens */}
            <br/><br/>
            <button  className="fun-btn" onClick={fetchTokensReceived}>View CCT</button>
            <br/>
            <p className="metric-chip">CCT khả dụng: <strong>{tokensReceived || "0"}</strong></p>
            
            {/**list on AMM */}
            <br/><br/>
            <div className="amm-listing">
                <input type="number" placeholder="CCT amount to list" 
                    value={listAmount} onChange={(e)=>setListAmount(e.target.value)}/>
                <input type="number" placeholder="ETH per CCT" 
                    value={pricePerCCT} onChange={(e)=>setPricePerCCT(e.target.value)} />
            
                <button className="fun-btn" onClick={listOnAMM}>List on AMM</button>
            </div>
            
           

            {/*logout*/}    
            <br/><br/>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
    </React.Fragment>
    );
}

const ConsumerDashboard=(props)=>{
    const [web3,setWeb3]=useState(null);
    const [consumerAddress,setConsumerAddress]=useState(null); 
    const [listings,setListings]=useState([]);
    const [selectedListing,setSelectedListing]=useState(null);
    const [buyAmount,setBuyAmount]=useState(0); 
    const [cctReceived,setCCTReceived]=useState("");
    const [retireAmount,setRetireAmount]=useState("");
    const [crc,setCRC]=useState("");

    //wallet connection
    const handleConnectWallet=async()=>{
        try{
            const web3Instance=await getWeb3();
                
            if(web3Instance){
                setWeb3(web3Instance);
                console.log('Web3 initialized!',web3Instance);
            }else{
                console.error('Failed to initialize Web3!');
                return;
            }
               
            const accounts = await web3Instance.eth.getAccounts();
            if (accounts.length > 0){
                setConsumerAddress(accounts[0]);
                console.log(`Connected Wallet Address: ${accounts[0]}`);
            }else{
                console.error('No accounts found!');
                return;
            }
        }catch(error){
            console.error("Error connecting wallet!");   
        } 
    }

//fetch listings
    const fetchFromAMM = async () => {
        if (!web3) return;
        try {
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = ammABI.networks[networkId];
            const contract = new web3.eth.Contract(ammABI.abi, deployedNetwork.address);
            
            const listings = await contract.methods.fetchListings().call();
            const formattedListings = listings.map((listing, index) => ({
                index,
                seller: listing.seller,
                amount: web3.utils.fromWei(listing.amount, "ether"),
                pricePerCCT: web3.utils.fromWei(listing.pricePerCCT, "ether"),
            }));
            setListings(formattedListings);
        } catch (error) {
            console.error("Error fetching listings:", error);
        }
    }

    //buy cct
    const buyCCT = async () => {
        if (!web3 || !consumerAddress) return;
        try {
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = ammABI.networks[networkId];
            const ammContract = new web3.eth.Contract(ammABI.abi, deployedNetwork.address);
            
            // Tính số ETH cần trả (Giá * Số lượng)
            const ethRequired = (buyAmount * selectedListing.pricePerCCT).toString();
            const weiToPay = web3.utils.toWei(ethRequired, "ether");

            await ammContract.methods
                .buyTokens(selectedListing.index, buyAmount)
                .send({ from: consumerAddress, value: weiToPay }); // Nhớ gửi kèm 'value' để trả tiền
            
            alert("Mua CCT thành công!");
        } catch (error) {
            console.error("Lỗi khi mua CCT:", error);
        }
    }   

    //display balance
    const displayCCT = async () => {
        if (!web3 || !consumerAddress) return;
        try {
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = MintTokensABI.networks[networkId];
            const mintTokensContract = new web3.eth.Contract(MintTokensABI.abi, deployedNetwork.address);
            
            const balance = await mintTokensContract.methods.balanceOf(consumerAddress).call();
            const cctBalance = web3.utils.fromWei(balance, "ether");
            setCCTReceived(cctBalance);
        } catch (error) {
            console.error("Error displaying balance:", error);
        }
    }

    const viewCRC = async () => {
        if (!web3 || !consumerAddress) return;
        try {
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = nftABI.networks[networkId];
            const nftContract = new web3.eth.Contract(nftABI.abi, deployedNetwork.address);
            
            // 1. IN RA DANH SÁCH HÀM ĐỂ CHECK ABI
            console.log("Danh sách hàm trong Contract:", Object.keys(nftContract.methods));

            // 2. GỌI THỬ BIẾN PUBLIC XEM CÓ DATA KHÔNG
            const currentTokenId = await nftContract.methods.latestTokenId(consumerAddress).call();
            console.log("Token ID của Consumer là:", currentTokenId);

            if (currentTokenId.toString() === "0") {
                alert("Bạn chưa có chứng nhận nào! Validator chưa duyệt thành công.");
                return;
            }

            // 3. NẾU TOKEN ID > 0 MỚI GỌI HÀM NÀY
            const crcData = await nftContract.methods.getCRCByAddress(consumerAddress).call();
            
            setCRC({
                owner: crcData[0],
                burnAmount: web3.utils.fromWei(crcData[1], "ether"),
                timestamp: crcData[2],
            });
        } catch (error) {
            console.error("Lỗi sâu:", error);
        }
    }

    //retire
    const retireCredits = async () => {
        if (!web3 || !consumerAddress) return;
        try {
            const networkId = await web3.eth.net.getId();
            
            // Lấy địa chỉ Contract
            const mintNetwork = MintTokensABI.networks[networkId];
            const multiValidatorNetwork = MultiValidatorABI.networks[networkId];
            
            const mintContract = new web3.eth.Contract(MintTokensABI.abi, mintNetwork.address);
            
            // Tính số lượng Wei
            const amountInWei = web3.utils.toWei(retireAmount.toString(), "ether");

            // 1. NGƯỜI MUA KÝ CẤP QUYỀN CHO VALIDATOR ĐƯỢC PHÉP ĐỐT TOKEN CỦA MÌNH
            console.log("Đang cấp quyền tiêu hủy cho Validator...");
            alert("Vui lòng xác nhận giao dịch Approve trên MetaMask để cho phép hệ thống thu hồi tín chỉ.");
            await mintContract.methods.approve(multiValidatorNetwork.address, amountInWei).send({from: consumerAddress});
            
            // 2. SAU KHI KÝ XONG MỚI GỬI REQUEST LÊN BACKEND (WEBSOCKET)
            const response = await fetch("http://localhost:8000/api/retire-cct", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    address: consumerAddress,
                    amount: retireAmount
                })
            });

            if(response.ok){
                alert("✅ Đã gửi yêu cầu tiêu hủy! Vui lòng chuyển sang Tab Validator để duyệt.");
                const data = await response.json();
                console.log(data);
            }
        } catch(error) {
            console.error(error);
            alert("Giao dịch thất bại hoặc bạn đã từ chối ký trên MetaMask!");
        }
    }

    //logout
    const handleLogout=()=>{
        props.setIsLoggedIn(false);
        console.log("Logged out!");
    }

    return (
        <React.Fragment>
            <div className="dashboard-shell">               
                <div className="dashboard-header">
                    <p className="dashboard-kicker">Carbon Credit Ecosystem</p>
                    <h1>Consumer Dashboard</h1>
                    <p className="dashboard-subtitle">Mua CCT từ AMM, retire tín chỉ và nhận chứng nhận CRC NFT.</p>
                </div>
                {/*wallet connection*/}
                <br/>
                <button className="connect-btn" onClick={handleConnectWallet}>Connect Wallet</button>
                <br/>
                <p className="wallet-chip">Wallet Address: {consumerAddress || "Chưa kết nối"}</p>

                {/**fetch from amm */}
                <br/>
                <button className="fun-btn" onClick={fetchFromAMM}>Fetch from AMM</button>
                <br/>
                <h3 className="section-title">1) AMM Market Listings</h3>
                <div id="cct-listings"> 
                    {listings.length>0?
                        (listings.map((listing,idx)=>
                            (
                                <div key={idx} className="listing-item" onClick={() => {setSelectedListing(listing);console.log(listing)}}>
                                    <p>Seller : {listing.seller}</p>
                                    <p>Amount : {listing.amount} CCT</p>
                                    <p>Price : {listing.pricePerCCT} ETH per CCT</p>
                                </div>
                            ))
                        )
                        :(
                            <p>No listings available...</p>
                        )
                    }
                </div>
                
                {selectedListing && (
                    <div className="buy-section">
                        <p>From : {selectedListing.seller}</p>
                        <p>CCT : {selectedListing.amount}</p>
                        <p>Price : {selectedListing.pricePerCCT} ETH per CCT</p>
                        <input 
                            type="number" 
                            placeholder="Enter amount" 
                            value={buyAmount} 
                            onChange={(e) => setBuyAmount(e.target.value)} 
                        />
                        <p>ETH required: {buyAmount * selectedListing.pricePerCCT}</p>
                        <button onClick={buyCCT}>Buy CCT</button>
                    </div>
                )}

                {/**balance display */}
                <br/>
                <button className="fun-btn" onClick={displayCCT} type="button">View CCT</button>
                <p className="metric-chip">CCT trong ví: <strong>{cctReceived || "0"}</strong></p>

                {/**retre credits */}
                <br/>
                <div className="retire-sec">
                    <input 
                        type="number" 
                        placeholder="CCT amount to retire"
                        value={retireAmount} 
                        onChange={(e) => setRetireAmount(e.target.value)}
                    />
                    <button className="fun-btn" onClick={retireCredits} type="button">Retire CCT</button>
                </div>

                {/**NFT */}
                <br/>
                <button className="fun-btn" onClick={viewCRC}>View CRC</button>
                <br/>
                {crc && (
                    <div className="certificate-card">
                        <b>CARBON REMOVAL CERTIFICATE</b>
                        <p>Owner : {crc.owner}</p>
                        <p>Amount retired : {crc.burnAmount} CCT</p>
                    </div>
                )}

                {/*logout*/}
                <br/>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
        </React.Fragment>);
}

const ValidatorDashboard=(props)=>{
    const [web3,setWeb3]=useState(null);
    const [validatorAddress,setValidatorAddress]=useState(null);  
    const [credits,setCredits]=useState("");
    const [receivedAddress,setReceivedAddress]=useState("");
    const [amount,setAmount]=useState("");
    const [addressGen,setAddressGen]=useState("");
    const [ndvi,setNDVI]=useState(0);
    const [sequestrationAmount,setSequestrationAmount]=useState("");
    const [coords,setCoords]=useState("");
    const [status,setStatus]=useState("not verified");

    //wallet connection
    const handleConnectWallet=async()=>{
        try{
            const web3Instance=await getWeb3();
                
            if(web3Instance){
                setWeb3(web3Instance);
                console.log('Web3 initialized!',web3Instance);
            }else{
                console.error('Failed to initialize Web3!');
                return;
            }
               
            const accounts = await web3Instance.eth.getAccounts();
            if (accounts.length > 0){
                setValidatorAddress(accounts[0]);
                console.log(`Connected Wallet Address: ${accounts[0]}`);
            }else{
                console.error('No accounts found!');
                return;
            }
        }catch(error){
            console.error("Error connecting wallet!");   
        } 
    }

    //approve evidence (Approve CCT cho Generator)
    const approveEvidence = async () => {
        if (status === "verified" && credits !== "") {
            try {
                const networkId = await web3.eth.net.getId();
                const deployedNetwork = MultiValidatorABI.networks[networkId];
                const contract = new web3.eth.Contract(MultiValidatorABI.abi, deployedNetwork.address);
                
                // Dùng addressGen (Địa chỉ do Generator gửi qua WebSocket)
                await contract.methods
                    .voteToApprove(addressGen, credits)
                    .send({ from: validatorAddress });
                
                alert("CCT Approved Thành Công");
                setAddressGen("");
                setNDVI("");
                setCoords("");
                setSequestrationAmount("");
                setStatus("not verified");
            } catch (error) {
                console.error("Error approving evidence:", error);
            }
        } else {
            alert("Không thể Approve CCT lúc này!");
        }
    };
    
    //approve NFT (Approve Retire cho Consumer)
    const approveNFT = async () => {
        try {
            if (!amount || amount === "" || !receivedAddress) {
                alert("Lỗi: Không có yêu cầu tiêu hủy nào từ Consumer!");
                return;
            }

            const networkId = await web3.eth.net.getId();
            const deployedNetwork = MultiValidatorABI.networks[networkId];
            const burnContract = new web3.eth.Contract(MultiValidatorABI.abi, deployedNetwork.address);
            
            // const amountInWei = web3.utils.toWei(amount.toString(), 'ether');

            await burnContract.methods
                .burnTokens(receivedAddress, amount)
                .send({ from: validatorAddress });
                
            alert("Phê duyệt tiêu hủy và cấp NFT thành công!");
            setAmount("");
            setReceivedAddress("");
        } catch (error) {
            console.error("Lỗi khi duyệt NFT:", error);
        }
    }
    
    const rejectEvidence=async()=>{
        alert("Request Rejected");
        setAddressGen("");
        setNDVI("");
        setCoords("");
        setSequestrationAmount("");
        setStatus("not verified");
    }
    //logout
    const handleLogout=()=>{
        props.setIsLoggedIn(false);
        console.log("Logged out!");
    }

    useEffect(() => {
        const initializeWebSocket = async () => {
            await handleConnectWallet();

            const socket = new WebSocket("ws://localhost:8080");
            socket.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                console.log(data);

                if(data.type==="consumer"){
                    setReceivedAddress(data.address);
                    setAmount(data.amount);
                }else if(data.type==="generator"){
                    setAddressGen(data.address);
                    setNDVI(data.value);
                    setCoords(data.coords);
                    setStatus("not verified");
                    console.log(coords);
                }
            };
            
            socket.onclose = () => console.log("WebSocket Disconnected");
        };
        initializeWebSocket();

    }, [coords]);

    const verifyNDVI=async()=>{
        try {
            const response = await fetch("http://localhost:5000/api/calculate-ndvi", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                bounds: coords // send SW and NE corners
            })
            });

            if (response.ok) {
                const data = await response.json();
                console.log(data);
                
                if(data.ndvi===ndvi){
                    setStatus("verified");
                } else {
                    console.error("NDVI calculation failed.");
                }
            }
        } catch (error) {
            console.error("Error calling NDVI API:", error);
        }
    }

    const estimateCO2Sequestration=async()=>{
        try{
            const response=await fetch(`http://localhost:5000/api/estimate-co2`,{
                method:"POST",
                headers:{
                    Accept:"application/json",
                    "Content-type":"application/json",
                },
                body:JSON.stringify({ndvi})
            });

            if(response.ok){
                const data=await response.json();
                setSequestrationAmount(data.amount);
                setCredits(data.credits);
            }
        }catch(error){
            console.log(error);
        }
    }

    return (
        <React.Fragment>
            <div className="dashboard-shell">
                <div className="dashboard-header">
                    <p className="dashboard-kicker">Carbon Credit Ecosystem</p>
                    <h1>Validator Dashboard</h1>
                    <p className="dashboard-subtitle">Kiểm định NDVI, phê duyệt mint CCT và xác nhận retire để phát hành CRC.</p>
                </div>
                {/*wallet connection*/}
                <br/>
                <button className="connect-btn" onClick={handleConnectWallet}>Connect Wallet</button>
                <br/>
                <p className="wallet-chip">Wallet Address: {validatorAddress || "Chưa kết nối"}</p>

                <div className="evidence-section">
                    <div className="gen-section">
                        <p>Generator Address : {addressGen}</p>
                        <p className="metric-chip">NDVI: <strong>{ndvi}</strong></p>

                        <br/>
                        <button className="fun-btn" type="button" onClick={verifyNDVI}>Verify NDVI</button>
                        <p>Status : {status}</p>

                        <br/>
                        <button className="fun-btn" type="button" onClick={estimateCO2Sequestration}>Estimate C02 Sequestration</button>
                        <p>Sequestration amount : {sequestrationAmount} tons</p>
                        
                        <br/>
                        <div className="approve-reject">
                            <button className="fun-btn" onClick={approveEvidence}>Approve CCT</button>
                            <button className="fun-btn" onClick={rejectEvidence}>Reject</button>
                        </div>
                    </div>

                    <div className="con-section">
                        <p>Consumer Address : {receivedAddress}</p>
                        <p>Retire Amount : {amount}</p>
                        
                        <br/>
                        <button className="fun-btn" onClick={approveNFT}>Approve CRC</button>
                    </div>
                </div>
                
                {/*logout*/}
                <br/>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
        </React.Fragment>);
}

const UserDashboard=(props)=>{
    const userType = props.location.state?.userType || props.userType || props.forcedUserType || "generator";
    const {setIsLoggedIn}=props;
  
    let Component;
    switch(userType){
        case "generator":
            Component=GeneratorDashboard;
            break;

        case "consumer":
            Component=ConsumerDashboard;
            break;
            
        case "validator":
            Component=ValidatorDashboard;
            break;
            
        default:
            break;
    }

    return (
    <React.Fragment>
        <div className="user-dashboard">
            <div className="dashboard-backdrop"></div>
            <Component setIsLoggedIn={setIsLoggedIn}/>
        </div>
    </React.Fragment>
    );
}

export default UserDashboard;