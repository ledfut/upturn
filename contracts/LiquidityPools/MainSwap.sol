pragma solidity 0.8.15;
import "./Exchange.sol";
import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/LSP7DigitalAsset.sol";

contract Main {
    //     //token    //exchange
    mapping (address => address payable) public token_to_exchange;

    mapping (uint => address payable) public exchangeAddresses;
    mapping (uint => address) public tokenAddresses;
    mapping (address => uint) public tokenExchangeIterator;
    uint iterator;

    uint ethBalance;

    constructor() {
        iterator = 1;
    }

    function createExchange(address _tokenAddress) public {
        Exchange newExchange = new Exchange(_tokenAddress);
        exchangeAddresses[iterator] = payable (address(newExchange));
        tokenAddresses[iterator] = _tokenAddress;
        tokenExchangeIterator[_tokenAddress] = iterator;
        iterator++;
    }

    function swapTokenForToken(address _tokenA, uint _tokenAmount, address _tokenB) public {
        //user must approve this contract to send their funds before calling this function
        uint tokenAIterator = tokenExchangeIterator[_tokenA];
        uint tokenBIterator = tokenExchangeIterator[_tokenB];
        
        require (exchangeAddresses[tokenAIterator] != 0x0000000000000000000000000000000000000000, "Token A does not have an exchange");
        require (exchangeAddresses[tokenBIterator] != 0x0000000000000000000000000000000000000000, "Token B does not have an exchange");
       
        Exchange tokenA_Exchange = Exchange(exchangeAddresses[tokenAIterator]);
        Exchange tokenB_Exchange = Exchange(exchangeAddresses[tokenBIterator]);

        LSP7DigitalAsset TokenA = LSP7DigitalAsset(_tokenA);
        LSP7DigitalAsset TokenB = LSP7DigitalAsset(_tokenB);
        
        //SET FALSE
        TokenA.transfer(msg.sender, address(this), _tokenAmount, true, "0x");      
        uint ethRecieved = tokenA_Exchange.tokenToNativeSwap(_tokenAmount);

        payable (address(tokenB_Exchange)).transfer(ethRecieved);

        uint tokensRecieved = tokenB_Exchange.nativeToTokenSwapNonPayable(ethRecieved);

        //SET FALSE
        TokenB.transfer(address (this), msg.sender, tokensRecieved, true, "0x");
    }

    function returnExchangeAddress(uint id) public view returns(address){
        return exchangeAddresses[id];
    }

    function returnTokenAddress(address _address) public view returns (uint){
        return (tokenExchangeIterator[_address]);
    }

}