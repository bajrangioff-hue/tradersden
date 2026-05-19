"""Symbol validation with a comprehensive whitelist."""

import re

from app.exceptions.custom_exceptions import InvalidSymbolError

_SYMBOL_WHITELIST: set[str] = {
    "SPY", "QQQ", "IWM", "DIA", "XLF", "XLE", "XLK", "XLV", "XLI", "XLP",
    "XLU", "XLY", "XLB", "XLRE", "XLC", "AAPL", "TSLA", "NVDA", "MSFT",
    "AMZN", "META", "GOOGL", "GOOG", "AMD", "NFLX", "COIN", "INTC", "IBM",
    "ORCL", "CRM", "ADBE", "CSCO", "QCOM", "AVGO", "NKE", "DIS", "BA",
    "JPM", "GS", "V", "MA", "JNJ", "PG", "KO", "PEP", "WMT", "HD",
    "UNH", "VZ", "T", "CVX", "XOM", "MRK", "ABBV", "LLY", "MCD",
    "GSPC", "IXIC", "RUT", "DJI",
    "NQ=F", "ES=F", "YM=F", "RTY=F", "GC=F", "SI=F", "CL=F", "NG=F",
    "ZB=F", "ZN=F", "6E=F", "6J=F", "6B=F", "6A=F", "6S=F", "6C=F",
    "MNQ=F", "MES=F", "MYM=F", "M2K=F", "MGC=F", "MCL=F", "MSI=F",
    "EURUSD=X", "GBPUSD=X", "USDJPY=X", "AUDUSD=X", "USDCAD=X",
    "USDCHF=X", "NZDUSD=X", "USDMXN=X", "USDSGD=X", "USDHKD=X",
    "BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "XRP-USD", "ADA-USD",
    "DOGE-USD", "AVAX-USD", "LINK-USD", "DOT-USD", "MATIC-USD",
    "UNI7083-USD", "ATOM-USD", "LTC-USD", "BCH-USD",
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
    "NIFTY50=F", "HINDUNILVR.NS", "ITC.NS", "SBIN.NS", "BHARTIARTL.NS",
    "TITAN.NS", "ASIANPAINT.NS", "MARUTI.NS", "HCLTECH.NS", "SUNPHARMA.NS",
    "AXISBANK.NS", "KOTAKBANK.NS", "BAJFINANCE.NS", "WIPRO.NS", "LT.NS",
    "ULTRACEMCO.NS", "POWERGRID.NS", "NTPC.NS", "M&M.NS", "TRENT.NS",
    "ADANIPORTS.NS", "NESTLEIND.NS", "JSWSTEEL.NS", "COALINDIA.NS", "ONGC.NS",
    "BRITANNIA.NS", "EICHERMOT.NS", "GRASIM.NS", "TATAMOTORS.NS", "TCONSUM.NS",
    "BAJAJFINSV.NS", "DLF.NS", "TATASTEEL.NS", "HAL.NS", "BEL.NS",
    "VEDL.NS", "ZOMATO.NS", "PAYTM.NS", "NYCAA.NS", "POLICYBZR.NS",
    "CDSL.NS", "IEX.NS", "BANKNIFTY=F", "FINNIFTY=F", "SENSEX=F",
    "INDUSINDBK.NS", "HEROMOTOCO.NS", "BPCL.NS", "HINDALCO.NS", "DIVISLAB.NS",
    "TECHM.NS", "CIPLA.NS", "DRREDDY.NS", "PIDILITIND.NS", "ABFRL.NS",
    "DABUR.NS", "SBILIFE.NS", "ICICIPRULI.NS", "HDFCLIFE.NS", "COLPAL.NS",
    "GAIL.NS", "TORNTPHARM.NS", "CADILAHC.NS", "MARICO.NS", "BERGEPAINT.NS",
    "HAVELLS.NS", "AMBUJACEM.NS", "ACC.NS", "SHREECEM.NS", "BANKBARODA.NS",
    "PUNJAB_NATIONAL_BANK.NS", "CANBK.NS", "IDBI.NS", "IOC.NS", "HINDCOPPER.NS",
    "NATIONALUM.NS", "IDEA.NS", "YESBANK.NS", "AUROPHARMA.NS", "LUPIN.NS",
    "BIOCON.NS", "ALKEM.NS", "GLAND.NS", "MANKIND.NS", "TORNTPOWER.NS",
    "JSWENERGY.NS", "TATAPOWER.NS", "ADANIGREEN.NS", "ADANITRANS.NS",
    "ADANIENSOL.NS", "SOLARINDS.NS", "SUZLON.NS", "IRCTC.NS", "IRFC.NS",
    "RVNL.NS", "VBL.NS", "DMART.NS", "MCDOWELL-N.NS", "MOTHERSON.NS",
    "TVSMOTOR.NS", "ASHOKLEY.NS", "BALKRISIND.NS", "MRF.NS", "APOLLOTYRE.NS",
    "INDIAMART.NS", "NAUKRI.NS", "INFOEDGE.NS", "JUBLFOOD.NS", "DELHIVERY.NS",
    "GODREJCP.NS", "GODREJPROP.NS", "OBEROIRLTY.NS", "PHOENIXLTD.NS",
    "COFORGE.NS", "PERSISTENT.NS", "LTIM.NS", "MINDTREE.NS",
}

_SYMBOL_PATTERN = re.compile(r"^[A-Za-z0-9=.^_\-]{2,15}$")





def validate_format(symbol: str) -> bool:
    """Check symbol matches the allowed character pattern.

    Args:
        symbol: The symbol string to validate.

    Returns:
        True if the format is valid.
    """
    return bool(_SYMBOL_PATTERN.match(symbol))


def is_whitelisted(symbol: str) -> bool:
    """Check if a symbol is in the whitelist (case-insensitive lookup).

    Args:
        symbol: The symbol string to check.

    Returns:
        True if the symbol is whitelisted.
    """
    return symbol.upper() in _SYMBOL_WHITELIST or symbol in _SYMBOL_WHITELIST


def validate_symbol(symbol: str) -> bool:
    """Full validation: format + whitelist.

    Args:
        symbol: The symbol string to validate.

    Returns:
        True if the symbol is valid and supported.

    Raises:
        InvalidSymbolError: If validation fails.
    """
    if not validate_format(symbol):
        raise InvalidSymbolError(symbol)
    if not is_whitelisted(symbol):
        raise InvalidSymbolError(symbol)
    return True
