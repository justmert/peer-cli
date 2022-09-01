# Aave API Telegram Bot 

You can use this Telegram bot to get Aave data from the Aave API.
You can interact with the bot by sending `/start` to get the list of commands to the `@aave_api_bot`.
<br>
If you want to deploy yourself, please change the `BOT_TOKEN` variable in the `main.py` file.

## Bot Interactions

* `/tvl`: Get the combined TVL of the Aave protocol, updated every 15 minutes
* `/daily`: Gets the combined volume of the protocol in the last 24 hours window
* `/market`: Fetches the current state of assets across all deployments of the Aave Protocol
* `/liquidity_v1`: Returns overall protocol liquidity at a certain date v1
* `/liquidity_v2`: Returns overall protocol liquidity at a certain date v2
* `/rate_history`: Returns market rate history of a reserve over given time frames
* `/pools`: Returns staking pool(stkAAVE, stkABPT) stats
* `/governance_user_search`: Search for individual Aave governance user

### /tvl

`/tvl` Returns the combined total volume of the Aave protocol, updated every 15 minutes.

### /daily

`/daily` Returns the combined volume of the Aave protocol in the last 24 hours window.

Parameters:
* What is token symbol?
    >*Example:* Aave


### /market

`/market` Returns the current state of assets across all deployments of the Aave Protocol.

Parameters:
* What is token symbol?
    >*Example:* Aave

### /liquidity_v1

`/liquidity_v1` Returns overall protocol liquidity at a certain date v1.

Parameters:
* What is the id of the Aave Lending Pool Addresses Provider?
    >*Example:* 0x24a42fd28c976a61df5d00d0599c34c4f90748c8
* What is the date for where we want to get the data from?
    >*Example:* MM-DD-YYYY
* What is token symbol?
    >*Example:* Aave

### /liquidity_v2

`/liquidity_v2` Returns overall protocol liquidity at a certain date v2.

Parameters:
* What is the id of the Aave Lending Pool Addresses Provider?
    >*Example:* 0xb53c1a33016b2dc2ff3653530bff1848a515c8c5
* What is the date for where we want to get the data from?
    >*Example:* 01-01-2020
* What is token symbol?
    >*Example:* Aave


### /rate_history

`/rate_history` Returns market rate history of a reserve over given time frames.

* What is the id of the Aave reserve you want to query?
   > *Example:* 0x6b175474e89094c44da98b954eedeac495271d0f0x24a42fd28c976a61df5d00d0599c34c4f90748c8
* what is the date for where you want to start from?
    >*Example:* 1627317635
* What is the resolution in hours?
    >*Example:* 162731763


### /pools

`/pools` Returns staking pool(stkAAVE, stkABPT) stats.

### /governance_user_search

`/governance_user_search` Search for individual Aave governance user.

* What is the user wallet address?
    >*Example:* 0x9fc1ca176d6ddea94c4b9bfe8af6d28f5795b305


## Install Requirements 
``pip install python-telegram-bot --pre --upgrade``	
