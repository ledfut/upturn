pragma solidity 0.8.15;
import "../LiquidityPools/Exchange.sol";
import "./ArtistRightsToken.sol";
contract InitalRightsSale {
    mapping (address => Sale) artistTokenSales;

    struct Sale {
        address ArtistTokenAddress;
        address payable ExchangeAddress;
        uint PriceForTokens;
        bool IsTokensForSale;

        uint TokensForLiquidity;
        uint TokensForArtist;
        uint TokensForSale;
        uint NativeTokensForLiquidity;

        uint TokensForArtistLeftForRico;
        uint TimeStart;
        uint RicoInterval;
        uint RicoClaimPerInterval;
    }

    mapping (address => address) createdExchangeAddresses;

    address contractDeployer;

    event CreateSaleEvent(address indexed artistAddress, address indexed artistTokenAddress, uint indexed pricePerToken);
    event StartSaleEvent(address indexed artistAddress);
    event StopSaleEvent(address indexed artistAddress);
    event BuyArtistTokensEvent(address payable indexed artistAddress, uint indexed buyAmount);

    constructor() {
        contractDeployer = msg.sender;
    }
    
    function CreateExchange(address _tokenAddress, address _artistAddress) public {
        Exchange newExchange = new Exchange(_tokenAddress, _artistAddress);
        createdExchangeAddresses[msg.sender] = address(newExchange);
    }

    function CreateSale(address _artistAddress, address _artistTokenAddress, address payable _exchangeAddress, uint _pricePerToken, uint _percentageForArtist, uint _percentageForLiquidity) public {
        //user must approve this contract address to transfer tokens from artist token address before calling this function
        require(msg.sender == _artistAddress, "You must be the artist to call this function");
        require(artistTokenSales[_artistAddress].ArtistTokenAddress == 0x0000000000000000000000000000000000000000, "Artist token sale is already created");

        ArtistRightsToken artistToken = ArtistRightsToken(_artistTokenAddress);
        artistToken.mint();

        artistTokenSales[_artistAddress].TokensForLiquidity = artistToken.totalSupply() * _percentageForLiquidity / 100;
        artistTokenSales[_artistAddress].TokensForArtist = artistToken.totalSupply() * _percentageForArtist / 100;
        artistTokenSales[_artistAddress].TokensForSale = artistToken.balanceOf(address(this)) - artistTokenSales[_artistAddress].TokensForArtist - artistTokenSales[_artistAddress].TokensForLiquidity;
        artistTokenSales[_artistAddress].PriceForTokens = _pricePerToken;
        artistTokenSales[_artistAddress].NativeTokensForLiquidity = artistTokenSales[_artistAddress].TokensForSale * artistTokenSales[_artistAddress].PriceForTokens;
        
        artistTokenSales[_artistAddress].ArtistTokenAddress = _artistTokenAddress;
        artistTokenSales[_artistAddress].ExchangeAddress = _exchangeAddress;
        artistTokenSales[_artistAddress].IsTokensForSale = false;

        uint tokensForArtist = artistTokenSales[_artistAddress].TokensForArtist/2;
        artistTokenSales[_artistAddress].TimeStart = block.timestamp;
        artistTokenSales[_artistAddress].TokensForArtistLeftForRico = artistTokenSales[_artistAddress].TokensForArtist/2;
        artistTokenSales[_artistAddress].RicoInterval = 2630000; //1 month
        artistTokenSales[_artistAddress].RicoClaimPerInterval = artistTokenSales[_artistAddress].TokensForArtistLeftForRico/26;
        //tokens artist recieve
        //set false
        artistToken.transfer(address(this), _artistAddress, tokensForArtist, true, "0x");
        emit CreateSaleEvent(_artistAddress, _artistTokenAddress, _pricePerToken);
        address(this).delegatecall(abi.encodeWithSignature("StartSale()"));
    }

    function StartSale() public {
        require(artistTokenSales[msg.sender].ArtistTokenAddress != 0x0000000000000000000000000000000000000000, "Address does not have an artist token created");
        require(ArtistRightsToken(artistTokenSales[msg.sender].ArtistTokenAddress).balanceOf(address(this)) > 0, "This contract has no more supply left to sell this token");
        require(artistTokenSales[msg.sender].IsTokensForSale == false, "Artist Token must not be in sale");

        artistTokenSales[msg.sender].IsTokensForSale = true;
        emit StartSaleEvent(msg.sender);
    }

    function StopSale() public {
        require(artistTokenSales[msg.sender].ArtistTokenAddress != 0x0000000000000000000000000000000000000000, "Address does not have an artist token created");
        require(ArtistRightsToken(artistTokenSales[msg.sender].ArtistTokenAddress).balanceOf(address(this)) > 0, "This contract has no more supply left to sell this token");
        require(artistTokenSales[msg.sender].IsTokensForSale == true, "Artist Token must be in sale");

        artistTokenSales[msg.sender].IsTokensForSale = false;
        emit StopSaleEvent(msg.sender);
    }

    function BuyArtistTokens(address payable _artistAddress) public payable{
        require (artistTokenSales[_artistAddress].IsTokensForSale == true, "Token is currently not for sale");
        require (artistTokenSales[_artistAddress].PriceForTokens <= msg.value , "Token price is greater than native token that has been sent");
        
        ArtistRightsToken artistToken = ArtistRightsToken (artistTokenSales[_artistAddress].ArtistTokenAddress);
        uint buyAmount = artistTokenSales[_artistAddress].PriceForTokens * msg.value;
        require (buyAmount <= artistToken.balanceOf(address(this)), "Not enough tokens left to buy");

        artistTokenSales[_artistAddress].TokensForSale -= buyAmount;
        //set false
        artistToken.transfer(address(this), msg.sender, buyAmount, true, "0x");

       if (artistTokenSales[_artistAddress].TokensForSale == 0) {
           artistTokenSales[_artistAddress].IsTokensForSale = false;
           
           Exchange artistExchange = Exchange(artistTokenSales[_artistAddress].ExchangeAddress);
           artistToken.authorizeOperator(artistTokenSales[_artistAddress].ExchangeAddress, artistTokenSales[_artistAddress].TokensForLiquidity);
           artistExchange.addLiquidity{value: artistTokenSales[_artistAddress].NativeTokensForLiquidity}(artistTokenSales[_artistAddress].TokensForLiquidity);
       }
       emit BuyArtistTokensEvent(_artistAddress, buyAmount);
    }

    //rico
    function ArtistClaim() public {
       uint difference = block.timestamp - artistTokenSales[msg.sender].TimeStart;
       uint intervalsPassed = difference/artistTokenSales[msg.sender].RicoInterval;

        ArtistRightsToken artistToken = ArtistRightsToken(artistTokenSales[msg.sender].ArtistTokenAddress);
        //set false
        artistToken.transfer(address(this), msg.sender, artistTokenSales[msg.sender].RicoClaimPerInterval * intervalsPassed, true, "0x");
        artistTokenSales[msg.sender].TimeStart = block.timestamp;
    }

    function ReturnTokens(address _artistAddress, uint _amount) public {
        //user must approve this contract address with the artist token before calling this function
        ArtistRightsToken artistToken = ArtistRightsToken(artistTokenSales[_artistAddress].ArtistTokenAddress);

        artistTokenSales[_artistAddress].TokensForArtistLeftForRico -= _amount;
        //set false
        artistToken.transfer(msg.sender, address(this), _amount, true, "0x");
        artistToken.burn(address(this), _amount);
        //current native tokens for artist
        uint percentageOfTokensReturned = _amount * 10000 /artistToken.totalSupply();
        uint NativeTokensReturn = artistToken.totalSupply() * percentageOfTokensReturned / 10000;
        //uint PercentageOfTokensReturned = _amount / artistToken.totalSupply() * 100;
        //uint NativeTokenReturn = artistTokenSales[_artistAddress].NativeTokensForLiquidity * PercentageOfTokensReturned / 100;
        
        payable(msg.sender).transfer(NativeTokensReturn);
    }

    function getSaleInfo(address _artistAddress) public view returns(Sale memory) {
        return(artistTokenSales[_artistAddress]);
    }
}