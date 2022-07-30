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
        uint NativeTokensForLiquidity;
        uint TokensForSale;
    }

    address contractDeployer;

    event CreateSaleEvent(address indexed artistAddress, address indexed artistTokenAddress, uint indexed pricePerToken);
    event StartSaleEvent(address indexed artistAddress);
    event StopSaleEvent(address indexed artistAddress);
    event BuyArtistTokensEvent(address payable indexed artistAddress, uint indexed buyAmount);

    constructor() {
        contractDeployer = msg.sender;
    }
    function CreateSale(address _artistAddress, address _artistTokenAddress, address payable _exchangeAddress, uint _pricePerToken, uint _percentageArtistKeeps, uint _percentageForLiquidity) public {
        require(msg.sender == _artistAddress, "You must be the artist to call this function");
        require(artistTokenSales[_artistAddress].ArtistTokenAddress == 0x0000000000000000000000000000000000000000, "Artist token sale is already created");

        ArtistRightsToken artistToken = ArtistRightsToken(_artistTokenAddress);

        artistTokenSales[_artistAddress].TokensForLiquidity = artistToken.totalSupply() * _percentageForLiquidity / 100;
        artistTokenSales[_artistAddress].NativeTokensForLiquidity = artistTokenSales[_artistAddress].TokensForSale * artistTokenSales[_artistAddress].PriceForTokens;
        artistTokenSales[_artistAddress].TokensForLiquidity = artistTokenSales[_artistAddress].TokensForLiquidity;
        artistTokenSales[_artistAddress].TokensForSale = artistToken.balanceOf(address(this)) - artistTokenSales[_artistAddress].TokensForLiquidity;

        artistTokenSales[_artistAddress].ArtistTokenAddress = _artistTokenAddress;
        artistTokenSales[_artistAddress].ExchangeAddress = _exchangeAddress;
        artistTokenSales[_artistAddress].PriceForTokens = _pricePerToken;
        artistTokenSales[_artistAddress].IsTokensForSale = false;

        artistToken.mint();
        //tokens artist recieve
        artistToken.transfer(_artistAddress, artistToken.totalSupply() * _percentageArtistKeeps / 100, false);
        emit CreateSaleEvent(_artistAddress, _artistTokenAddress, _pricePerToken);
    }

    function StartSale(address _artistAddress) public {
        require (msg.sender == _artistAddress, "only the artist can call this function");
        require(artistTokenSales[_artistAddress].IsTokensForSale == false, "Artist Token must not be in sale");

        artistTokenSales[_artistAddress].IsTokensForSale = true;
        emit StartSaleEvent(_artistAddress);
    }

    function StopSale(address _artistAddress) public {
        require (msg.sender == _artistAddress, "only the artist can call this function");
        require(artistTokenSales[_artistAddress].IsTokensForSale == true, "Artist Token must not be in sale");

        artistTokenSales[_artistAddress].IsTokensForSale = false;
        emit StopSaleEvent(_artistAddress);
    }

    function BuyArtistTokens(address payable _artistAddress) public payable{
        require (artistTokenSales[_artistAddress].IsTokensForSale == true, "Token is currently not for sale");
        require (artistTokenSales[_artistAddress].PriceForTokens <= msg.value , "Token price is greater than native token that has been sent");
        
        ArtistRightsToken artistToken = ArtistRightsToken (_artistAddress);
        uint buyAmount = artistTokenSales[_artistAddress].PriceForTokens * msg.value;
        require (buyAmount <= artistToken.balanceOf(address(this)), "Not enough tokens left to buy");

        artistTokenSales[_artistAddress].TokensForSale -= buyAmount;
        artistToken.transfer(msg.sender, buyAmount, false);

        if (artistTokenSales[_artistAddress].TokensForSale == 0) {
            artistTokenSales[_artistAddress].IsTokensForSale = false;
            
            Exchange artistExchange = Exchange(_artistAddress);
            artistExchange.addLiquidity{value: artistTokenSales[_artistAddress].NativeTokensForLiquidity}(artistTokenSales[_artistAddress].TokensForLiquidity);
        }

        emit BuyArtistTokensEvent(_artistAddress, buyAmount);
    }
}