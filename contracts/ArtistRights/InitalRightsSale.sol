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

        uint tokensForLiquidity;
        uint nativeTokensForLiquidity;
        uint tokensForSale;
    }

    function CreateSale(address _artistAddress, address _artistTokenAddress, address payable _exchangeAddress, uint _royaltyPercentage, uint _pricePerToken) public onlyContractDeployer {
        require(msg.sender == _artistAddress, "You must be the artist to call this function");
        require(artistTokenSales[_artistAddress].ArtistAddress == 0x0000000000000000000000000000000000000000, "Artist token sale is already created");

        Sale memory newSale;

        newSale.ArtistTokenAddress = _artistTokenAddress;
        newSale.ExchangeAddress = _exchangeAddress;
        newSale.PriceForTokens = _pricePerToken;
        newSale.IsTokensForSale = false;

        artistTokenSales[_artistAddress] = newSale;
    }

    function StartSale(address _artistAddress, uint _percentageArtistKeeps, uint _percentageForLiquidity) public {
        require (msg.sender == _artistAddress, "only the artist can call this function");
        require(artistTokenSales[_artistAddress].isTokenInSale == false, "Artist Token must not be in sale");

        ArtistRightsToken artistToken = ArtistRightsToken(artistTokenSales[_artistAddress].artistTokenAddress);
        artistToken.mintForTokenSale();

        uint tokensArtistReceives = artistToken.totalSupply() * _percentageArtistKeeps / 100;
        artistToken.transfer(_artistAddress, tokensArtistReceives, false);

        //contract holds liquidity tokens until sale is complete
        artistTokenSales[_artistAddress].tokenAmountForLiquidity = artistToken.totalSupply() * _percentageForLiquidity / 100;
        artistTokenSales[_artistAddress].nativeTokensForLiquidity = tokensForSale[artistTokenAddress] * pricePerToken[artistTokenAddress];
        artistTokenSales[_artistAddress].tokensForLiquidity = tokenAmountForLiquidity;
        artistTokenSales[_artistAddress].tokensForSale = artistToken.balanceOf(address(this)) - tokenAmountForLiquidity;
        artistTokenSales[_artistAddress].isTokenInSale = true;
    }

    function BuyArtistTokens(address _artistAddress) public payable{
        require (artistTokenSale[_artistAddress].isTokenInSale == true, "Token is currently not for sale");
        require (artistTokenSale[_artistAddress].tokenPrice <= msg.value , "Token price is greater than native token that has been sent");
        
        ArtistRightsToken artistToken = ArtistRightsToken (artistTokenSales[_artistAddress]);
        uint buyAmount = artistTokenSale[_artistAddress].tokenPrice * msg.value;
        require (amount <= artistToken.balanceOf(address(this)), "Not enough tokens left to buy");

        artistTokenSale[_artistAddress].tokensForSale -= buyAmount;
        artistToken.transfer(msg.sender, buyAmount, false);

        if (artistTokenSale[_artistAddress].tokensForSale == 0) {
            Exchange artistExchange = Exchange(_artistAddress);
            artistExchange.addLiquidity{value: artistTokenSales[_artistAddress].nativeTokensForLiquidity}(artistTokenSales[_artistAddress].tokensForLiquidity);
        }
    }
}