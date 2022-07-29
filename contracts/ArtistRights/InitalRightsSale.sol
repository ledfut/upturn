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

    function CreateSale(address _artistAddress, address _artistTokenAddress, address payable _exchangeAddress, uint _royaltyPercentage, uint _pricePerToken) public {
        require(msg.sender == _artistAddress, "You must be the artist to call this function");
        require(artistTokenSales[_artistAddress].ArtistTokenAddress == 0x0000000000000000000000000000000000000000, "Artist token sale is already created");

        Sale memory newSale;

        newSale.ArtistTokenAddress = _artistTokenAddress;
        newSale.ExchangeAddress = _exchangeAddress;
        newSale.PriceForTokens = _pricePerToken;
        newSale.IsTokensForSale = false;

        artistTokenSales[_artistAddress] = newSale;
    }

    function StartSale(address _artistAddress, uint _percentageArtistKeeps, uint _percentageForLiquidity) public {
        require (msg.sender == _artistAddress, "only the artist can call this function");
        require(artistTokenSales[_artistAddress].IsTokensForSale == false, "Artist Token must not be in sale");

        ArtistRightsToken artistToken = ArtistRightsToken(artistTokenSales[_artistAddress].ArtistTokenAddress);
        artistToken.mintForTokenSale();

        uint tokensArtistReceives = artistToken.totalSupply() * _percentageArtistKeeps / 100;
        artistToken.transfer(_artistAddress, tokensArtistReceives, false);

        //contract holds liquidity tokens until sale is complete
        artistTokenSales[_artistAddress].TokensForLiquidity = artistToken.totalSupply() * _percentageForLiquidity / 100;
        artistTokenSales[_artistAddress].NativeTokensForLiquidity = artistTokenSales[_artistAddress].TokensForSale * artistTokenSales[_artistAddress].PriceForTokens;
        artistTokenSales[_artistAddress].TokensForLiquidity = artistTokenSales[_artistAddress].TokensForLiquidity;
        artistTokenSales[_artistAddress].TokensForSale = artistToken.balanceOf(address(this)) - artistTokenSales[_artistAddress].TokensForLiquidity;
        artistTokenSales[_artistAddress].IsTokensForSale = true;
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
            Exchange artistExchange = Exchange(_artistAddress);
            artistExchange.addLiquidity{value: artistTokenSales[_artistAddress].NativeTokensForLiquidity}(artistTokenSales[_artistAddress].TokensForLiquidity);
        }
    }
}