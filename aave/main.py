from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters
from telegram import ForceReply, Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)
from telegram import ReplyKeyboardMarkup, ReplyKeyboardRemove, Update
from telegram import __version__ as TG_VER
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler
from telegram import Update
import logging
import requests
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ContextTypes
from typing import Dict
from telegram import ForceReply
import json
import re
from re import finditer
from copy import deepcopy
try:
    from telegram import __version_info__
except ImportError:
    __version_info__ = (0, 0, 0, 0, 0)  # type: ignore[assignment]

if __version_info__ < (20, 0, 0, "alpha", 1):
    raise RuntimeError(
        f"This example is not compatible with your current PTB version {TG_VER}. To view the "
        f"{TG_VER} version of this example, "
        f"visit https://docs.python-telegram-bot.org/en/v{TG_VER}/examples.html"
    )

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

BOT_TOKEN = None

AAVE_ENDPOINT = "https://aave-api-v2.aave.com"
MAX_ROW_LEN = 20


def camel_case_to_words(identifier):
    matches = finditer(
        '.+?(?:(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|$)', identifier)
    return ' '.join([m.group(0).title() for m in matches])


def _key_format(obj):
    if isinstance(obj, dict):
        return {camel_case_to_words(k): v for k, v in obj.items()}
    elif isinstance(obj, (list, set, tuple)):
        t = type(obj)
        return t(_key_format(o) for o in obj)
    elif isinstance(obj, str):
        return camel_case_to_words(obj)
    else:
        return obj


def _replace_characters(data):
    data = re.sub(r'\s{4,}$', '\n', data.replace('"', '')
                                        .replace(',', '')
                                        .replace('{', '')
                                        .replace('}', ''), flags=re.MULTILINE)
    data = re.sub(r'\s{4}\b', '', data)
    return data


class STREncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, str):
            return camel_case_to_words(obj)
        return json.JSONEncoder.default(self, obj)


async def tvl_request():
    data = await make_request(API_ENDPOINTS["tvl"])
    data = _key_format(data)
    formatted_data = _replace_characters(json.dumps(data, indent=4))
    return formatted_data


async def daily_request(parameters):
    token_symbol = parameters[0].upper().strip()
    data = await make_request(API_ENDPOINTS["daily"])

    all_data = []
    reserves = data.pop('reserves')
    all_data.append(_replace_characters(
        json.dumps(_key_format(data), indent=4)))

    v1_token = [x for x in reserves['v1'] if x['symbol'] == token_symbol]
    v2_token = [x for x in reserves['v2'] if x['symbol'] == token_symbol]
    stk_token = [x for x in reserves['stk'] if x['symbol'] == token_symbol]
    polygon_token = [x for x in reserves['polygon']
                     if x['symbol'] == token_symbol]

    if v1_token:
        all_data.append(_replace_characters(json.dumps(
            {"v1": _key_format(v1_token[0])}, indent=4)))
    if v2_token:
        all_data.append(_replace_characters(json.dumps(
            {"v2": _key_format(v2_token[0])}, indent=4)))
    if stk_token:
        all_data.append(_replace_characters(json.dumps(
            {"stk": _key_format(stk_token[0])}, indent=4)))
    if polygon_token:
        all_data.append(_replace_characters(json.dumps(
            {"polygon": _key_format(polygon_token[0])}, indent=4)))
    return all_data


async def market_request(parameters):
    token_symbol = parameters[0].upper().strip()
    data = await make_request(API_ENDPOINTS["market"])
    token_market = [x for x in data['reserves'] if x['symbol'] == token_symbol]
    if token_market:
        token_market = _replace_characters(
            json.dumps(_key_format(token_market[0]), indent=4))
    return token_market

TOTAL_AVG_KEYS = [
    "avg30DaysVariableBorrowRate",
    "avg30DaysLiquidityRate",
    "avg1DaysVariableBorrowRate",
    "avg1DaysLiquidityRate",
    "avg7DaysVariableBorrowRate",
    "avg7DaysLiquidityRate",
    "avg91DaysVariableBorrowRate",
    "avg91DaysLiquidityRate",
    "avg365DaysVariableBorrowRate",
    "avg365DaysLiquidityRate",
    "1DaysProtocolIncome",
    "1DaysDepositorsIncome",
    "7DaysProtocolIncome",
    "7DaysDepositorsIncome",
    "30DaysProtocolIncome",
    "30DaysDepositorsIncome",
    "91DaysProtocolIncome",
    "91DaysDepositorsIncome",
    "365DaysProtocolIncome",
    "365DaysDepositorsIncome",
    "totalLiquidityNormalized",
    "totalBorrowsNormalized",
    "totalBorrowsStableNormalized",
    "totalBorrowsVariableNormalized",
    "availableLiquidityNormalized",
    "totalLiquidityNormalized1DaysAgo",
    "totalBorrowsNormalized1DaysAgo",
    "totalBorrowsStableNormalized1DaysAgo",
    "totalBorrowsVariableNormalized1DaysAgo",
    "availableLiquidityNormalized1DaysAgo",
    "totalLiquidityNormalized7DaysAgo",
    "totalBorrowsNormalized7DaysAgo",
    "totalBorrowsStableNormalized7DaysAgo",
    "totalBorrowsVariableNormalized7DaysAgo",
    "availableLiquidityNormalized7DaysAgo",
    "totalLiquidityNormalized30DaysAgo",
    "totalBorrowsNormalized30DaysAgo",
    "totalBorrowsStableNormalized30DaysAgo",
    "totalBorrowsVariableNormalized30DaysAgo",
    "availableLiquidityNormalized30DaysAgo",
    "totalLiquidityNormalized91DaysAgo",
    "totalBorrowsNormalized91DaysAgo",
    "totalBorrowsStableNormalized91DaysAgo",
    "totalBorrowsVariableNormalized91DaysAgo",
    "availableLiquidityNormalized91DaysAgo",
    "totalLiquidityNormalized365DaysAgo",
    "totalBorrowsNormalized365DaysAgo",
    "totalBorrowsStableNormalized365DaysAgo",
    "totalBorrowsVariableNormalized365DaysAgo",
    "availableLiquidityNormalized365DaysAgo"]


async def liquidity_v1_request(parameters):
    pool_id, date, token_symbol = parameters
    token_symbol = token_symbol.upper().strip()
    full_endpoint = f'{API_ENDPOINTS["liquidity_v1"]}?poolId={pool_id}&date={date}'
    api_result = await make_request(full_endpoint)
    if api_result.get('error', None) is not None:
        return api_result['error']
    token_market = [x for x in api_result if x['symbol'] == token_symbol]
    data = []
    if token_market:
        avg_total = {}
        for key in TOTAL_AVG_KEYS:
            avg_total[key] = token_market[0].pop(key)

        reference_item = token_market[0].pop('referenceItem')
        data.extend([_replace_characters(json.dumps(_key_format(token_market[0]), indent=4)),
                     _replace_characters(json.dumps(
                         _key_format(avg_total), indent=4)),
                     _replace_characters(json.dumps(_key_format({"referenceItem": reference_item}), indent=4))])
    return data


async def liquidity_v2_request(parameters):
    pool_id, date, token_symbol = parameters
    token_symbol = token_symbol.upper().strip()
    full_endpoint = f'{API_ENDPOINTS["liquidity_v1"]}?poolId={pool_id}&date={date}'
    api_result = await make_request(full_endpoint)
    if api_result.get('error', None) is not None:
        return api_result['error']
    token_market = [x for x in api_result if x['symbol'] == token_symbol]
    data = []
    if token_market:
        avg_total = {}
        for key in TOTAL_AVG_KEYS:
            avg_total[key] = token_market[0].pop(key, "")

        reference_item = token_market[0].pop('referenceItem')
        data.extend([_replace_characters(json.dumps(_key_format(token_market[0]), indent=4)),
                     _replace_characters(json.dumps(
                         _key_format(avg_total), indent=4)),
                     _replace_characters(json.dumps(_key_format({"referenceItem": reference_item}), indent=4))])
    return data


async def rate_history_request(parameters):  #  needs to be looked into!
    reserve_id, from_num, resolution_in_hours = parameters
    full_endpoint = f'{API_ENDPOINTS["rate_history"]}?reserveId={reserve_id}&from={from_num}&resolutionInHours={resolution_in_hours}'
    data = await make_request(full_endpoint)
    formatted_data = [_replace_characters(
        json.dumps(_key_format(x), indent=4)) for x in data]
    return formatted_data


async def pools_request():
    endpoint = API_ENDPOINTS["pools"]
    data = await make_request(endpoint)
    formatted_data = []
    for data_item in data:
        formatted_data.extend([_replace_characters(
            json.dumps(_key_format(data_item), indent=4))])
    return formatted_data


async def governance_leaderboard_request(parameters):
    # will not be included in the final state of the project as it is unnecessary.
    power, first, min_val = parameters
    full_endpoint = f'{API_ENDPOINTS["governance_leaderboard"]}?power={power}&first={first}&min={min_val}'
    data = await make_request(full_endpoint)
    voting_history = data.pop('votingHistory')
    voting_history_formatted = [json.dumps(
        x, indent=4) for x in voting_history]
    formatted_data = [json.dumps(data, indent=4)].extend(
        voting_history_formatted)
    return formatted_data


async def proposal_top_voters_request(parameters):
    # will not be included in the final state of the project as it is unnecessary.
    proposal_id, address = parameters
    full_endpoint = f'{API_ENDPOINTS["proposal_top_voters"]}?proposal={proposal_id}'
    data = await make_request(full_endpoint)
    addressed_data = []
    for datum in data:
        addressed_data.extend([x for x in datum if x['address'] == address])
    formatted_data = []
    if addressed_data:
        for adata in addressed_data:
            voting_history = adata.pop('votingHistory')
            voting_history_formatted = json.dumps(
                {"votingHistory": voting_history}, indent=4)
            formatted_data.extend(
                [json.dumps(adata, indent=4), voting_history_formatted])
    return formatted_data


async def governance_user_search_request(parameters):
    address = parameters[0]
    full_endpoint = f'{API_ENDPOINTS["governance_user_search"]}?address={address}'
    data = await make_request(full_endpoint)
    formatted_data = []
    if data:
        voting_history = data.pop('votingHistory')
        proposal_history = data.pop('proposalHistory')
        voting_history_splitted = []
        voting_per_message = []
        count_voting = 0

        proposal_history_splitted = []
        proposal_per_message = []
        count_proposal = 0

        for voting_item in voting_history:
            voting_per_message.append([voting_item])
            if len(voting_per_message) == 3:
                voting_history_splitted.append(
                    {f"votingHistory {count_voting}": voting_per_message})
                voting_per_message = []
        if voting_per_message:
            voting_history_splitted.append(
                {f"votingHistory {count_voting}": voting_per_message})

        for proposal_item in proposal_history:
            proposal_per_message.append([proposal_item])
            if len(proposal_per_message) == 3:
                proposal_history_splitted.append(
                    {f"proposalHistory {count_proposal}": proposal_per_message})
                proposal_per_message = []
        if proposal_per_message:
            proposal_history_splitted.append(
                {f"proposalHistory {count_proposal}": proposal_per_message})

        voting_history_formatted = [_replace_characters(json.dumps(
            _key_format(x), indent=4)) for x in voting_history_splitted]
        proposal_history_formatted = [_replace_characters(json.dumps(
            _key_format(x), indent=4)) for x in proposal_history_splitted]

        formatted_data.extend([_replace_characters(
            json.dumps(_key_format(data), indent=4))])
        if voting_history_formatted:
            formatted_data.extend(voting_history_formatted)
        if proposal_history_formatted:
            formatted_data.extend(proposal_history_formatted)
    return formatted_data


API_COMMANDS = {
    "tvl": "Get the combined TVL of the Aave protocol, updated every 15 minutes",
    "daily": "Gets the combined volume of the protocol in the last 24 hours window",
    "market": "Fetches the current state of assets across all deployments of the Aave Protocol",
    "liquidity_v1": "Returns overall protocol liquidity at a certain date v1",
    "liquidity_v2": "Returns overall protocol liquidity at a certain date v2",
    # "rate_history": "Returns market rate history of a reserve over given time frames",
    "pools": "Returns staking pool(stkAAVE, stkABPT) stats",
    # "governance_leaderboard": "Get top governance participants",
    # "proposal_top_voters": "Get top voters for a given proposal",
    "governance_user_search": "Search for individual Aave governance user",
}

KEYBOARD_COMMANDS = [
    "TVL", "Daily", "Market",
    "Liquidity v1", "Liquidity v2",
    #"Rate history",
    "Pools", "Governance User Search",
    "Help",
    # "Cancel" # will be added in forming keyboard
]

KEYBOARD_API_MAPPING = {
    "tvl": "tvl",
    "daily": "daily",
    "market": "market",
    "liquidity v1": "liquidity_v1",
    "liquidity v2": "liquidity_v2",
    # "rate history": "rate_history",
    "pools": "pools",
    # "governance_leaderboard": "Get top governance participants""
    # "proposal_top_voters": "Get top voters for a given proposal""
    "governance user search": "governance_user_search",
    "help": "help",
    "cancel": "cancel"
}

COMMAND_API_MAPPING = {
    "/tvl": "tvl",
    "/daily": "daily",
    "/market": "market",
    "/liquidity_v1": "liquidity_v1",
    "/liquidity_v2": "liquidity_v2",
    # "rate history": "rate_history",
    "/pools": "pools",
    # "governance_leaderboard": "Get top governance participants""
    # "proposal_top_voters": "Get top voters for a given proposal""
    "/governance_user_search": "governance_user_search",
    "/help": "help",
    "/cancel": "cancel"
}

API_FUNCTIONS = {
    "tvl": tvl_request,
    "daily": daily_request,
    "market": market_request,
    "liquidity_v1": liquidity_v1_request,
    "liquidity_v2": liquidity_v2_request,
    # "rate_history": rate_history_request,
    "pools": pools_request,
    # "governance_leaderboard": governance_leaderboard_request,
    # "proposal_top_voters": proposal_top_voters_request,
    "governance_user_search": governance_user_search_request,
}

API_ENDPOINTS = {
    "tvl": f"{AAVE_ENDPOINT}/data/tvl",
    "daily": f"{AAVE_ENDPOINT}/data/daily-volume-24-hours",
    "market": f"{AAVE_ENDPOINT}/data/markets-data",
    "liquidity_v1": f"{AAVE_ENDPOINT}/data/liquidity/v1",
    "liquidity_v2": f"{AAVE_ENDPOINT}/data/liquidity/v2",
    # "rate_history": f"{AAVE_ENDPOINT}/data/rates-history",
    "pools": f"{AAVE_ENDPOINT}/data/pools",
    # "governance_leaderboard": f"{AAVE_ENDPOINT}/data/governance-leaderboard",
    # "proposal_top_voters": f"{AAVE_ENDPOINT}/data/proposal-top-voters",
    "governance_user_search": f"{AAVE_ENDPOINT}/data/governance-user-search",
}


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    keyboard = []
    inline = ['/start']
    total_len = len('/start')
    for command in KEYBOARD_COMMANDS:
        command_str = str(command)
        if total_len + len(command_str) >= MAX_ROW_LEN:
            keyboard.append(inline)
            inline = []
            total_len = 0
        else:
            total_len += len(command_str)

        inline.append(command)

    if inline:
        keyboard.append(inline)

    keyboard.append(['Cancel'])
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True)

    await update.message.reply_text("Welcome to the Aave Bot!", reply_markup=reply_markup)
    return PARSE_CHOICE


async def make_request(endpoint):
    try:
        headers = {"Content-Type": "application/json; charset=utf-8"}
        response = requests.get(endpoint, timeout=5, headers=headers)
        response.raise_for_status()
        # Code here will only run if the request is successful
    except requests.exceptions.HTTPError as errh:
        # print(errh)
        pass
    except requests.exceptions.ConnectionError as errc:
        # print(errc)
        pass
    except requests.exceptions.Timeout as errt:
        # print(errt)
        pass
    except requests.exceptions.RequestException as err:
        # print(err)
        pass
    return response.json()


async def parse_choose(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    try:
        user_input = update.message.text.lower()
        text = KEYBOARD_API_MAPPING.get(user_input, None)
        if text is None:
            text = COMMAND_API_MAPPING.get(user_input, None)

        context.user_data["type"] = text
        context.user_data[context.user_data["type"]] = {}
        context.user_data[context.user_data["type"]]["data"] = []
        context.user_data[context.user_data["type"]]["queue"] = []
        if text == "tvl" or text == "/tvl":
            pass  # no parameters

        elif text == "daily" or text == "/daily":
            context.user_data[context.user_data["type"]]["queue"].extend([
                "What is token symbol?\nExample: Aave",
            ])

        elif text == "market" or text == "/market":
            context.user_data[context.user_data["type"]]["queue"].extend([
                "What is token symbol?\nExample: Aave",
            ])

        elif text == "liquidity_v1" or text == "/liquidity_v1":
            context.user_data[context.user_data["type"]]["queue"].extend([
                "What is the id of the Aave Lending Pool Addresses Provider?\nExample: 0x24a42fd28c976a61df5d00d0599c34c4f90748c8",
                "What is the date for where we want to get the data from?\nExample: MM-DD-YYYY",
                "What is token symbol?\nExample: Aave",
            ])

        elif text == "liquidity_v2" or text == "/liquidity_v2":
            context.user_data[context.user_data["type"]]["queue"].extend([
                "What is the id of the Aave Lending Pool Addresses Provider?\nExample: 0xb53c1a33016b2dc2ff3653530bff1848a515c8c5",
                "What is the date for where we want to get the data from?\nExample: 01-01-2020",
                "What is token symbol?\nExample: Aave",
            ])
        elif text == "rate_history" or text == "/rate_history":  # will not be included
            context.user_data[context.user_data["type"]]["queue"].extend([
                "What is the id of the Aave reserve you want to query?\nExample: 0x6b175474e89094c44da98b954eedeac495271d0f0x24a42fd28c976a61df5d00d0599c34c4f90748c8",
                "what is the date for where you want to start from?\nExample: 1627317635",
                "What is the resolution in hours?\nExample: 1627317635"
            ])
        elif text == "pools" or text == "/pools":
            pass  # no parameters

        elif text == "governance_leaderboard" or text == "governance_leaderboard":  # will not be included
            context.user_data[context.user_data["type"]]["queue"].extend([
                "What is the type of power to rank users?\n(Options are {vote, proposition})?",
                "What is the number of users to return?",
                "What is the minimum number of votes or proposals a user must have participated in?"
            ])
        elif text == "proposal_top_voters" or text == "proposal_top_voters":  # will not be included
            context.user_data[context.user_data["type"]]["queue"].extend([
                "What is the proposal id?",
                "What is the address?",
            ])
        elif text == "governance_user_search" or text == "governance_user_search":
            context.user_data[context.user_data["type"]]["queue"].extend([
                "What is the user wallet address?\nExample: 0x9fc1ca176d6ddea94c4b9bfe8af6d28f5795b305"
            ])

        elif text == "cancel" or text == "/cancel":
            return PARSE_CHOICE

        elif text == "help" or text == "/help":
            await update.message.reply_text("You can type /start to get started.")
            return PARSE_CHOICE

        if len(context.user_data[context.user_data["type"]]["queue"]) > 1:
            await update.message.reply_text(context.user_data[context.user_data["type"]]["queue"][0])
            return GET_FUNCTION

        elif len(context.user_data[context.user_data["type"]]["queue"]) == 1:
            await update.message.reply_text(context.user_data[context.user_data["type"]]["queue"][0])
            return END_FUNCTION

        elif context.user_data.get("type", None) is not None:
            request_result = await API_FUNCTIONS[context.user_data["type"]]()
            if isinstance(request_result, list):
                for i in request_result:
                    await update.message.reply_text(i)
            else:
                await update.message.reply_text(request_result)
            context.user_data.clear()
            return PARSE_CHOICE

        else:
            context.user_data.clear()
            return PARSE_CHOICE
    except Exception as ex:
        await update.message.reply_text("Something went wrong. Please try again later...")
        context.user_data.clear()
        return PARSE_CHOICE


async def get_param(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    try:
        text = update.message.text
        if text and text.lower() == "cancel":
            await update.message.reply_text("Request is cancelled.")
            context.user_data.clear()
            return PARSE_CHOICE

        context.user_data[context.user_data["type"]]["data"].append(text)
        context.user_data[context.user_data["type"]]["queue"].pop(0)
        await update.message.reply_text(context.user_data[context.user_data["type"]]["queue"][0])
        if len(context.user_data[context.user_data["type"]]["queue"]) > 1:
            return GET_FUNCTION
        return END_FUNCTION
    except Exception as ex:
        await update.message.reply_text("Something went wrong. Please try again later...")
        context.user_data.clear()
        return PARSE_CHOICE


async def end_getting_param(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    try:
        text = update.message.text
        if text and text.lower() == "cancel":
            await update.message.reply_text("Request is cancelled.")
            context.user_data.clear()
            return PARSE_CHOICE

        context.user_data[context.user_data["type"]]["data"].append(text)
        context.user_data[context.user_data["type"]]["queue"].pop(0)
        parameters = context.user_data[context.user_data["type"]]["data"]
        request_result = await API_FUNCTIONS[context.user_data["type"]](parameters)

        if request_result is None or not request_result:
            await update.message.reply_text("No results found.")

        elif isinstance(request_result, dict) and request_result.get("error", None) is not None:
            await update.message.reply_text(request_result["error"])

        elif isinstance(request_result, list):
            for i in request_result:
                await update.message.reply_text(i)
        else:
            await update.message.reply_text(request_result)
        context.user_data.clear()
        return PARSE_CHOICE
    except Exception as ex:
        await update.message.reply_text("Something went wrong. Please try again later...")
        context.user_data.clear()
        return PARSE_CHOICE


async def done(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Sends a message when the conversation ends."""
    await update.message.reply_text("Conversation ended.")
    return None


async def cancel_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Request is cancelled.")
    context.user_data.clear()
    return PARSE_CHOICE


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("You can type /start to get started.")
    context.user_data.clear()
    return PARSE_CHOICE

PARSE_CHOICE, GET_FUNCTION, END_FUNCTION, HELP = range(4)


def main() -> None:
    """Start the bot."""
    # Create the Application and pass it your bot's token.
    application = Application.builder().token(BOT_TOKEN).build()

    parse_choice_handler_list = [
        MessageHandler(
            filters.TEXT & ~(filters.COMMAND), parse_choose)]

    get_function_handler_list = [
        MessageHandler(
            filters.TEXT & ~(filters.COMMAND), get_param)]

    end_function_handler_list = [
        MessageHandler(
            filters.TEXT & ~(filters.COMMAND), end_getting_param)]

    for api_func in API_FUNCTIONS.keys():
        parse_choice_handler_list.append(
            CommandHandler(api_func, parse_choose))
    parse_choice_handler_list.extend(
        [CommandHandler('help', help_command), CommandHandler('cancel', cancel_command)])

    for api_func in API_FUNCTIONS.keys():
        get_function_handler_list.append(
            CommandHandler(api_func, parse_choose))
    get_function_handler_list.extend(
        [CommandHandler('help', help_command), CommandHandler('cancel', cancel_command)])

    for api_func in API_FUNCTIONS.keys():
        end_function_handler_list.append(
            CommandHandler(api_func, parse_choose))
    end_function_handler_list.extend(
        [CommandHandler('help', help_command), CommandHandler('cancel', cancel_command)])

    # Add conversation handler with the states CHOOSING, TYPING_CHOICE and TYPING_REPLY
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        allow_reentry=True,
        states={
            PARSE_CHOICE:  parse_choice_handler_list,
            GET_FUNCTION: get_function_handler_list,
            END_FUNCTION: end_function_handler_list,
        },
        fallbacks=[MessageHandler(filters.Regex("^Done$"), done)],
    )

    application.add_handler(conv_handler)
    application.run_polling()


if __name__ == "__main__":
    main()
