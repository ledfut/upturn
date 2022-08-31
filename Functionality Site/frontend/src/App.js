import logo from './logo.svg';
import { React, useState } from "react";
import {ethers} from "ethers";
import './App.css';
import Navbar from './Navbar';
import ArtistTokenSale from "./Json/ArtistTokenSale.json";
import ArtistToken from "./Json/ArtistToken.json";
import 'bootstrap/dist/css/bootstrap.min.css'

import { Container, Row, Col, Button, Alert, Breadcrumb, Card, Form } from "react-bootstrap"

export const ArtistTokenAddress = "0x5e69fc1670622728c1274843cdef6c0f69bdb82a";
export const ArtistTokenSaleAddress = "0xf050007c57922ff6b388c7148d33a8ba8e83eb16";

export let connectedAddress;
export let isWalletConnected;

function App() {
    const [walletAddress, setWalletAddress] = useState(""); 

    const [artistAddress, setArtistAddress] = useState("");
    const [artistTokenAddress, setArtistTokenAddress] = useState("")
    const [tokenExchangeAddress, setTokenExchangeAddress] = useState("")
    const [pricePerToken, setPricePerToken] = useState("")
    const [percentageForArtist, setPercentageForArtist] = useState("")
    const [percentageForLiquidity, setPercentageForLiquidity] = useState("")
    const [percentageOfCommitedFunds, setPercentageOfCommitedFunds] = useState("")
    const [commitedFundsIntervalLength, setCommitedFundsIntervalLength] = useState("")
    const [commitedFundsTotalLength, setCommitedFundsTotalLength] = useState("")

    const handleChangeArtistAddress = (event) => setArtistAddress(event.target.value);
    const handleChangeArtistTokenAddress = (event) => setArtistTokenAddress(event.target.value);
    const handleChangeArtistExchangeAddress = (event) => setTokenExchangeAddress(event.target.value);
    const handleChangePricePerToken = (event) => setPricePerToken(event.target.value);
    const handleChangePercentageForArtist = (event) => setPercentageForArtist(event.target.value);
    const handleChangePercentageForLiquidity = (event) => setPercentageForLiquidity(event.target.value);
    const handleChangePercentageOfCommitedFunds = (event) => setPercentageOfCommitedFunds(event.target.value);
    const handleChangeCommitedFundsIntervalLength = (event) => setCommitedFundsIntervalLength(event.target.value);
    const handleChangeCommitedFundsTotalLength = (event) => setCommitedFundsTotalLength(event.target.value);

    const [getArtistAddress, setGetArtistAddress] = useState("");
    const handleChangeGetArtistAddress = (event) => setGetArtistAddress(event.target.value);

    const [amountOfLYXtToSend, setAmountOfLYXtToSend] = useState("");
    const handleChangeAmountOfLYXtToSend = (event) => setAmountOfLYXtToSend(event.target.value);

    const [amountOfTokensToReturn, setAmountOfTokensToReturn] = useState("");
    const handleChangeAmountOfTokensToReturn = (event) => setAmountOfTokensToReturn(event.target.value);

    const [depositId, setDepositId] = useState("");
    const handleChangeDepositId = (event) => setDepositId(event.target.value);

    async function requestAccount() {
      if (window.ethereum) {
          console.log('detected');
      
          try {
              const accounts = await window.ethereum.request({
                  method: "eth_requestAccounts",
          });
          setWalletAddress(accounts[0]);
          connectedAddress = accounts[0]
          isWalletConnected = Boolean(accounts[0]);
          connectWallet = accounts[0];
          console.log("account: " + accounts[0])
        
      } catch (error) {
          console.log("error account request");
      }
    
      } else {
          alert("Meta mask not deteched");
      }
    }

    async function connectWallet() {
      if(typeof window.ethereum !== "undefined") {
        await requestAccount();
      
        const provider = new ethers.providers.Web3Provider(window.ethereum);
      }
    }

    async function approveContract() {
      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          ArtistTokenAddress,
          ArtistToken.abi,
          signer
        );

        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          
          const response = await contract.authorizeOperator(ArtistTokenSaleAddress, contract.balanceOf(accounts[0]))

          console.log('response: ', response);
        } catch (err){
          console.log("error: " + err);
        }
      }
    }

    async function createTokenSale() {
      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          ArtistTokenSaleAddress,
          ArtistTokenSale.abi,
          signer
        );

        try {
          const response = await contract.CreateSale(ethers.utils.getAddress(artistAddress), 
                                                     ethers.utils.getAddress(artistTokenAddress), 
                                                     ethers.utils.getAddress(tokenExchangeAddress), 
                                                     pricePerToken, 
                                                     percentageForArtist, 
                                                     percentageForLiquidity, 
                                                     percentageOfCommitedFunds, 
                                                     commitedFundsIntervalLength, 
                                                     commitedFundsTotalLength);


          console.log('response1: ', response);

        } catch (err){
          console.log("error: " + err);
        }
      }
    }

    async function percentage() {
      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          ArtistTokenSaleAddress,
          ArtistTokenSale.abi,
          signer
        );  

        try {
          const response = await contract.percentage(ethers.utils.getAddress(artistAddress), 
                                                     ethers.utils.getAddress(artistTokenAddress), 
                                                     percentageForArtist, 
                                                     percentageForLiquidity,
                                                     pricePerToken
                                                     );


          console.log('response1: ', response);

        } catch (err){
          console.log("error: " + err);
        }
      }
    }

    async function sendFunds() {
      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          ArtistTokenSaleAddress,
          ArtistTokenSale.abi,
          signer
        );  

        try {
          const response = await contract.transferFunds(ethers.utils.getAddress(artistAddress), 
                                                        ethers.utils.getAddress(artistTokenAddress), 
                                                        percentageForArtist, 
                                                        percentageForLiquidity,
                                                        pricePerToken
                                                        );


          console.log('response1: ', response);

        } catch (err){
          console.log("error: " + err);
        }
      }
    }

    async function createTokenExchange() {
      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          ArtistTokenSaleAddress,
          ArtistTokenSale.abi,
          signer
        );

        try {
          const response = await contract.CreateExchange(artistTokenAddress,
                                                         artistAddress);

          console.log('response: ', response);
        } catch (err){
          console.log("error: " + err);
        }
      }
    }

    async function getTokenExchange() {
      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          ArtistTokenSaleAddress,
          ArtistTokenSale.abi,
          signer
        );

        try {
          const response = await contract.getExchangeAddress(getArtistAddress);
          setTokenExchangeAddress(response)

          console.log('response: ', response);
        } catch (err){
          console.log("error: " + err);
        }
      }
    }

    async function buyArtistTokens() {
      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          ArtistTokenSaleAddress,
          ArtistTokenSale.abi,
          signer
        );

        try {
          const response = await contract.BuyArtistTokens(artistAddress);

          console.log('response: ', response);
        } catch (err){
          console.log("error: " + err);
        }
      }
    }

    async function returnTokens() {
      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          ArtistTokenSaleAddress,
          ArtistTokenSale.abi,
          signer
        );

        try {
          const response = await contract.ReturnTokens(artistAddress, amountOfTokensToReturn);

          console.log('response: ', response);
        } catch (err){
          console.log("error: " + err);
        }
      }
    }

    async function unlockLiquidity() {
      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          ArtistTokenSaleAddress,
          ArtistTokenSale.abi,
          signer
        );

        try {
          const response = await contract.UnlockLiquidity(depositId);

          console.log('response: ', response);
        } catch (err){
          console.log("error: " + err);
        }
      }
    }

    async function ArtistClaim() {
      if(window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          ArtistTokenSaleAddress,
          ArtistTokenSale.abi,
          signer
        );

        try {
          const response = await contract.ArtistClaim();

          console.log('response: ', response);
        } catch (err){
          console.log("error: " + err);
        }
      }
    }

  return (
    <div className="App">
      <header className="App-header">
        <Container >

        <Row className="mb-3">
            <Card style={{ color: "#000", }}>
              <Form>
                <Form.Group controlId="formCreateToken">
                  <Form.Label>Connect Wallet</Form.Label>
                  <Col>
                    <Button variant="secondary"
                    onClick={connectWallet}>Connect Wallet</Button>
                    
                    <Button variant="secondary"
                    onClick={approveContract}>Approve Contract</Button>
                  </Col>
                </Form.Group>
              </Form>
            </Card>
          </Row>

          <Row className="mb-3">
            <Card  style={{ color: "#000", }}>
              <Form>
                <Form.Group controlId="formCreateToken">
                  <Form.Label>Create Token Sale</Form.Label>
                  <Col>
                    <Form.Text className="text-muted">Artist Address</Form.Text>
                    <Form.Control type="artistAddress" placeholder="Enter Artist Address:" onChange={handleChangeArtistAddress}/>

                    <Form.Text className="text-muted">Token Address</Form.Text>
                    <Form.Control type="tokenAddress" placeholder="Enter Token Address:" onChange={handleChangeArtistTokenAddress}/>

                    <Form.Text className="text-muted">Token Exchange Address</Form.Text>
                    <Form.Control type="tokenExchangeAddress" placeholder="Enter Exchange Address:" onChange={handleChangeArtistExchangeAddress}/>

                    <Form.Text className="text-muted">Price Per Token</Form.Text>
                    <Form.Control type="pricePerToken" placeholder="Enter Price Per Token:" onChange={handleChangePricePerToken}/>
                    
                    <Form.Text className="text-muted">Percentage For Artist</Form.Text>
                    <Form.Control type="artistTokenAddress" placeholder="Enter Percentage For Artist:" onChange={handleChangePercentageForArtist}/>

                    <Form.Text className="text-muted">Percentage For Liquidity</Form.Text>
                    <Form.Control type="artistTokenAddress" placeholder="Enter Percentage For Liquidity:" onChange={handleChangePercentageForLiquidity}/>

                    <Form.Text className="text-muted">Percentage Of Commited Funds</Form.Text>
                    <Form.Control type="artistTokenAddress" placeholder="Enter Percentage Of Commited Funds:" onChange={handleChangePercentageOfCommitedFunds}/>

                    <Form.Text className="text-muted">Commited Funds Interval Length In Seconds</Form.Text>
                    <Form.Control type="artistTokenAddress" placeholder="Enter Commited Funds Interval Length:" onChange={handleChangeCommitedFundsIntervalLength}/>
                   
                    <Form.Text className="text-muted">Commited Funds Total Interval Length In Months</Form.Text>
                    <Form.Control type="artistTokenAddress" placeholder="Enter Commited Funds Interval Length:" onChange={handleChangeCommitedFundsTotalLength}/>

                    <Button variant="secondary" onClick={createTokenSale}>Create Sale</Button>
                  </Col>
                </Form.Group>
              </Form>
            </Card>
          </Row>

          <Row className="mb-3">
            <Card style={{ color: "#000", }}>
              <Form>
                <Form.Group controlId="formCreateToken">
                  <Form.Label>Create Token Exchange</Form.Label>
                  <Col>
                    <Form.Text className="text-muted">Token Address</Form.Text>
                    <Form.Control type="tokenAddress" placeholder="Enter Token Address:" onChange={handleChangeArtistTokenAddress}/>

                    <Form.Text className="text-muted">Artist Address</Form.Text>
                    <Form.Control type="tokenSymbol" placeholder="Enter Artist Address:" onChange={handleChangeArtistAddress}/>
                    
                    <Button variant="secondary" onClick={createTokenExchange} >Create Exchange</Button>
                  </Col>
                </Form.Group>
              </Form>
            </Card>
          </Row>

          <Row className="mb-3">
            <Card style={{ color: "#000", }}>
              <Form>
                <Form.Group controlId="formCreateToken">
                  <Form.Label>Get Artist Token Exchange Address</Form.Label>
                  <Col>
                    <Form.Text className="text-muted">Artist Address</Form.Text>
                    <Form.Control type="tokenSymbol" placeholder="Enter Artist Address:" onChange={handleChangeGetArtistAddress}/>
                    
                    <Button variant="secondary" onClick={getTokenExchange} >Get Exchange Address </Button>
                    
                  </Col>
                  <Form.Text className="text-muted">{tokenExchangeAddress}</Form.Text>
                </Form.Group>
              </Form>
            </Card>
          </Row>

          <Row className="mb-3">
            <Card style={{ color: "#000", }}>
              <Form>
                <Form.Group controlId="formCreateToken">
                  <Form.Label>Buy Artist Token</Form.Label>
                  <Col>
                    <Form.Text className="text-muted">Artist Address</Form.Text>
                    <Form.Control type="tokenSymbol" placeholder="Enter Artist Address:" onChange={handleChangeArtistAddress}/>

                    <Form.Text className="text-muted">Amount Of LYXt To Send</Form.Text>
                    <Form.Control type="tokenSymbol" placeholder="Amount of lyxt to send:" onChange={handleChangeAmountOfLYXtToSend}/>
                    
                    <Button variant="secondary" onClick={buyArtistTokens}>Buy Tokens</Button>
                  </Col>
                </Form.Group>
              </Form>
            </Card>
          </Row>

          <Row className="mb-3">
            <Card style={{ color: "#000", }}>
              <Form>
                <Form.Group controlId="formCreateToken">
                  <Form.Label>Return Tokens</Form.Label>
                  <Col>
                    <Form.Text className="text-muted">Artist Address</Form.Text>
                    <Form.Control type="tokenSymbol" placeholder="Enter Artist Address:" onChange={handleChangeArtistAddress}/>

                    <Form.Text className="text-muted">Amount Of Tokens To Return</Form.Text>
                    <Form.Control type="tokenSymbol" placeholder="Amount of tokens to return:" onChange={handleChangeAmountOfTokensToReturn}/>
                    
                    <Button variant="secondary" onClick={returnTokens} >Return Tokens</Button>
                  </Col>
                </Form.Group>
              </Form>
            </Card>
          </Row>

          <Row className="mb-3">
            <Card style={{ color: "#000", }}>
              <Form>
                <Form.Group controlId="formCreateToken">
                  <Form.Label>Unlock Liquidity</Form.Label>
                  <Col>
                    <Form.Text className="text-muted">Deposit Id</Form.Text>
                    <Form.Control type="tokenSymbol" placeholder="Deposit Id:" onChange={handleChangeDepositId}/>

                    <Button variant="secondary" onClick={unlockLiquidity}>Unlock Liquidity</Button>
                  </Col>
                </Form.Group>
              </Form>
            </Card>
          </Row>


          <Row className="mb-3">
            <Card style={{ color: "#000", }}>
              <Form>
                <Form.Group controlId="formCreateToken">
                  <Form.Label>Artist Claim</Form.Label>
                  <Col>
                    <Button variant="secondary" onClick={ArtistClaim}>Artist Claim</Button>
                  </Col>
                </Form.Group>
              </Form>
            </Card>
          </Row>
        
        </Container>
      </header>
    </div>
  );
}

export default App;
