"""Quick live test of the confluence analysis service."""
import asyncio
import sys


async def main():
    from app.services.confluence_service import analyze

    result = await analyze("SPY", interval="1h", period="1mo")
    print(f"Symbol: {result['symbol']}")
    print(f"Interval: {result['interval']}")
    print(f"Direction: {result['direction']}")
    print(f"Grade: {result['grade']}")
    print(f"Aggregate Score: {result['score']}")
    print(f"Levels: {len(result['levels'])}")
    for lvl in result["levels"][:5]:
        print(
            f"  {lvl['level_type']:>12} @ {lvl['price']:>8.2f}  "
            f"score={lvl['confluence_score']:>5.1f}  "
            f"{lvl['strength']:>8}  dir={lvl['direction']}"
        )
    if result["narrative"]:
        print(f"Narrative (first 300): {result['narrative'][:300]}")
    sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
