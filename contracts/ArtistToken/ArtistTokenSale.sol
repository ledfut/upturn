pragma solidity 0.8.15;
import "../LiquidityPools/Exchange.sol";
import "./ArtistToken.sol";
contract ArtistTokenSale {
    mapping (address => Sale) artistTokenSales;

    struct Sale {
        address ArtistTokenAddress;
        address payable ExchangeAddress;
        uint PricePerToken;

        uint PercentageForLiquidity;
        uint TokensForSale;

        //RICO
        uint InitialCommitedNativeTokens;
        uint InitialUnlockedNativeTokens;
        uint InitialReturnPricePerCoin;
        uint ReturnPriceReducePerInterval;
        uint LockedPerInterval;
        uint IntervalLength;
        uint IntervalTotalLength;

        uint TimeStart;
        uint ArtistLastClaimTime;
        uint maxTime;
        uint amountClaimed;

        uint TokenSupplyMultiplied;
    }

    mapping (address => address) createdExchangeAddresses;

    address admin;

    event CreateSaleEvent(address indexed artistAddress, address indexed artistTokenAddress, uint indexed pricePerToken);
    event StartSaleEvent(address indexed artistAddress);
    event StopSaleEvent(address indexed artistAddress);
    event BuyArtistTokensEvent(address indexed artistAddress, uint indexed buyAmount);

    constructor(address _admin) {
        admin = _admin;
    }
    
    function CreateExchange(address _tokenAddress, address _artistAddress) public {
        Exchange newExchange = new Exchange(_tokenAddress, _artistAddress);
        createdExchangeAddresses[msg.sender] = address(newExchange);
        artistTokenSales[_artistAddress].ExchangeAddress = payable (address(newExchange));
    }


    function CreateSale(address _artistAddress, address _artistTokenAddress, address payable _exchangeAddress, uint _pricePerToken, uint _percentageForArtist, uint _percentageForLiquidity, uint _percentageOfCommitedFunds,uint _intervalLength ,uint _intervalTotalLength) public {
        //user must approve this contract address to transfer tokens from artist token address before calling this function
        require(msg.sender == admin, "Only contract deployer can call this function");
        require(artistTokenSales[_artistAddress].ArtistTokenAddress == 0x0000000000000000000000000000000000000000, "Artist token sale is already created");
        require(_percentageForLiquidity <= 100, "Percentage for liquidity cannot be higher than 100");
        require(_percentageForArtist <= 100, "Percentage for Artist cannot be higher than 100");
//
        ArtistToken artistToken = ArtistToken(_artistTokenAddress);

         
        setupSale1(_artistAddress, _artistTokenAddress, _exchangeAddress, _pricePerToken, _percentageForLiquidity);
        setupSale2(_artistAddress, _artistTokenAddress, _pricePerToken, _percentageOfCommitedFunds, _intervalLength, _intervalTotalLength);
    }

    function percentage(address _artistAddress, address _artistTokenAddress, uint _percentageForArtist, uint _percentageForLiquidity, uint _pricePerToken) public {
        ArtistToken artistToken = ArtistToken(_artistTokenAddress);
        uint PercentageForSale = 100 - (_percentageForArtist + _percentageForLiquidity);
        
        //calculate and apply percentage of token supply for sale
        uint TokenSupplyMultiplied = artistToken.totalSupply() * 100;
        artistTokenSales[_artistAddress].TokensForSale = PercentageForSale * TokenSupplyMultiplied / 10000;
        artistTokenSales[_artistAddress].TokenSupplyMultiplied = TokenSupplyMultiplied;
        //artistToken.transfer(address(this), _artistAddress, _percentageForArtist * TokenSupplyMultiplied / 10000, true, "0x");
//
        
        //address(this).delegatecall(abi.encodeWithSignature("StartSale()"));
    }

    function transferFunds(address _artistAddress, address _artistTokenAddress, uint _percentageForArtist, uint _percentageForLiquidity, uint _pricePerToken) public {
        ArtistToken artistToken = ArtistToken(_artistTokenAddress);

        uint sendAmount = _percentageForArtist * artistTokenSales[_artistAddress].TokenSupplyMultiplied / 10000;
        
        artistToken.transfer(address(this), _artistAddress,sendAmount , true, "0x");
        //emit CreateSaleEvent(_artistAddress, _artistTokenAddress, _pricePerToken);
    }
    //function CreateSaleCalculatePercentages(address _artistAddress, address _artistTokenAddress, address payable _exchangeAddress, uint _pricePerToken, uint _percentageForArtist, uint _percentageForLiquidity, uint _percentageOfCommitedFunds,uint _intervalLength ,uint _intervalTotalLength) public {
    //    require(msg.sender == admin, "Only contract deployer can call this function");
    //    require(artistTokenSales[_artistAddress].ArtistTokenAddress != 0x0000000000000000000000000000000000000000, "Artist token sale is already created");
    //    require(_percentageForLiquidity <= 100, "Percentage for liquidity cannot be higher than 100");
    //    require(_percentageForArtist <= 100, "Percentage for Artist cannot be higher than 100");
////
    //    ArtistToken artistToken = ArtistToken(_artistTokenAddress);
//
    //    
    //    artistToken.transfer(address(this), _artistAddress, _percentageForArtist * TokenSupplyMultiplied / 10000, false, "0x");
    //    
    //    emit CreateSaleEvent(_artistAddress, _artistTokenAddress, _pricePerToken);
    //    address(this).delegatecall(abi.encodeWithSignature("StartSale()"));
    //}

    function setupSale1(address _artistAddress, address _artistTokenAddress, address payable _exchangeAddress, uint _pricePerToken, uint _percentageForLiquidity) internal {
        ArtistToken artistToken = ArtistToken(_artistTokenAddress);

        artistTokenSales[_artistAddress].ArtistTokenAddress = _artistTokenAddress;
        artistTokenSales[_artistAddress].ExchangeAddress = _exchangeAddress;
        artistTokenSales[_artistAddress].PricePerToken = _pricePerToken;
        
        artistTokenSales[_artistAddress].PercentageForLiquidity = _percentageForLiquidity;
    }

    function setupSale2(address _artistAddress, address _artistTokenAddress, uint _pricePerToken, uint _percentageOfCommitedFunds, uint _intervalLength, uint _intervalTotalLength) internal {
        //calculate and apply percentage of funds that will be commited

        ArtistToken artistToken = ArtistToken(_artistTokenAddress);
        uint TotalFundsFromSale = artistToken.totalSupply() * _pricePerToken;
        uint TotalFundsMultiplied = TotalFundsFromSale * 100;
        artistTokenSales[_artistAddress].InitialCommitedNativeTokens = _percentageOfCommitedFunds * TotalFundsMultiplied / 10000;

        artistTokenSales[_artistAddress].InitialUnlockedNativeTokens = TotalFundsFromSale - artistTokenSales[_artistAddress].InitialCommitedNativeTokens;
        artistTokenSales[_artistAddress].InitialUnlockedNativeTokens = artistTokenSales[_artistAddress].InitialCommitedNativeTokens ;
        //calculate and apply percentage of funds that will be commited
        uint PercentageForReturnPrice = 100 - _percentageOfCommitedFunds;
        uint PricePerTokenMultipled = _pricePerToken * 100;
        artistTokenSales[_artistAddress].InitialReturnPricePerCoin = PercentageForReturnPrice * PricePerTokenMultipled / 10000;
        artistTokenSales[_artistAddress].InitialReturnPricePerCoin = PercentageForReturnPrice;

        artistTokenSales[_artistAddress].ReturnPriceReducePerInterval = artistTokenSales[_artistAddress].InitialReturnPricePerCoin/_intervalTotalLength;
        //artistTokenSales[_artistAddress].ReturnPriceReducePerInterval = artistTokenSales[_artistAddress].InitialReturnPricePerCoin;

        artistTokenSales[_artistAddress].LockedPerInterval = artistTokenSales[_artistAddress].ReturnPriceReducePerInterval;

        artistTokenSales[_artistAddress].IntervalLength = _intervalLength;
        artistTokenSales[_artistAddress].IntervalTotalLength = _intervalTotalLength;

        artistTokenSales[_artistAddress].TimeStart = block.timestamp;
        artistTokenSales[_artistAddress].ArtistLastClaimTime = artistTokenSales[_artistAddress].TimeStart;

        artistTokenSales[_artistAddress].maxTime = (_intervalLength * _intervalTotalLength) + artistTokenSales[_artistAddress].TimeStart;
        artistTokenSales[_artistAddress].amountClaimed = 0;
    }

    function BuyArtistTokens(address _artistAddress) public payable{
        require(artistTokenSales[_artistAddress].ArtistTokenAddress != 0x0000000000000000000000000000000000000000, "Artist does not have token address set");
        require(artistTokenSales[_artistAddress].PricePerToken <= msg.value , "Token price is greater than native token that has been sent");
        require(artistTokenSales[_artistAddress].TokensForSale > 0, "No artist tokens for sale right now");

        //has account sent enough native tokens
        ArtistToken artistToken = ArtistToken (artistTokenSales[_artistAddress].ArtistTokenAddress);

        uint buyAmount = msg.value / artistTokenSales[_artistAddress].PricePerToken;
        require (buyAmount <= artistToken.balanceOf(address(this)), "Not enough tokens left to buy");

        artistTokenSales[_artistAddress].TokensForSale -= buyAmount;
        artistToken.transfer(address(this), msg.sender, buyAmount, false, "0x");

        if (artistTokenSales[_artistAddress].TokensForSale == 0) {

            Exchange artistExchange = Exchange(artistTokenSales[_artistAddress].ExchangeAddress);
            //work out token %
            uint tokenAmount = artistToken.balanceOf(address(this)) * 100;
            uint tokensForLiquidity = artistTokenSales[_artistAddress].PercentageForLiquidity * tokenAmount / 10000;

            //work out native token %
            uint nativeTokenAmount = address(this).balance * 100;
            uint nativeTokensForLiquidity = artistTokenSales[_artistAddress].PercentageForLiquidity * nativeTokenAmount / 10000;
            //send those
            
            artistToken.authorizeOperator(address(artistExchange), tokensForLiquidity);
            artistExchange.addLockedLiquidity{value: nativeTokensForLiquidity}(tokensForLiquidity, 63120000); //24 months
        }
        emit BuyArtistTokensEvent(_artistAddress, buyAmount);
    }

    function UnlockLiquidity(uint _depositId) public {
        Exchange exchange = Exchange(artistTokenSales[msg.sender].ExchangeAddress);
        
        exchange.unlockLockedLiquidity(_depositId);
        exchange.withdrawLiquidity(exchange.getDepositInfo(address(this), _depositId).tokenAmount,
                                   exchange.getDepositInfo(address(this), _depositId).nativeTokenAmount);

        ArtistToken artistToken = ArtistToken(artistTokenSales[msg.sender].ArtistTokenAddress);

        artistToken.transfer(address(this), msg.sender, exchange.getDepositInfo(address(this), _depositId).tokenAmount, true, "0x");
        payable (msg.sender).transfer(exchange.getDepositInfo(address(this), _depositId).nativeTokenAmount);
    }       

    //rico
    function ArtistClaim() public {
        uint intervalsFromStart = (block.timestamp - artistTokenSales[msg.sender].TimeStart) / artistTokenSales[msg.sender].IntervalLength;
        uint intervalsFromLastClaim = (artistTokenSales[msg.sender].ArtistLastClaimTime - artistTokenSales[msg.sender].TimeStart) / artistTokenSales[msg.sender].IntervalLength;
        uint result = intervalsFromStart - intervalsFromLastClaim;
        
        require(result > 0,"not enough time has passed for artist to claim");
        require(intervalsFromLastClaim < artistTokenSales[msg.sender].IntervalTotalLength, "no more claims avaliable for artist");
            ArtistToken artistToken = ArtistToken(artistTokenSales[msg.sender].ArtistTokenAddress);
            uint sendToArtist = artistTokenSales[msg.sender].LockedPerInterval * result;

            artistTokenSales[msg.sender].ArtistLastClaimTime += result * artistTokenSales[msg.sender].IntervalLength;
            artistToken.transfer(address(this), msg.sender, sendToArtist, false, "0x");
        
    }

    function ReturnTokens(address _artistAddress, uint _amount) public {
        //user must approve this contract address with the artist token before calling this function
        
        uint difference = block.timestamp - artistTokenSales[_artistAddress].TimeStart;
        uint intervalsPassed = difference/artistTokenSales[_artistAddress].IntervalLength;
        
        require (intervalsPassed < artistTokenSales[_artistAddress].IntervalTotalLength, "Reversible ICO has finished with this token");

        ArtistToken artistToken = ArtistToken(artistTokenSales[_artistAddress].ArtistTokenAddress);

        uint priceRemovePerToken = intervalsPassed * artistTokenSales[_artistAddress].ReturnPriceReducePerInterval;
        uint pricePerToken = artistTokenSales[_artistAddress].InitialReturnPricePerCoin - priceRemovePerToken;
        uint nativeReturnAmount = _amount * pricePerToken;

        artistToken.transfer(msg.sender, address(this), _amount, false, "0x");
        artistTokenSales[_artistAddress].TokensForSale += _amount;
        payable(msg.sender).transfer(nativeReturnAmount);
    }

    function getSaleInfo(address _artistAddress) public view returns(Sale memory) {
        return(artistTokenSales[_artistAddress]);
    }

    function getExchangeAddress(address _artistAddress) public view returns(address) {
        return(artistTokenSales[_artistAddress].ExchangeAddress);
    }
}