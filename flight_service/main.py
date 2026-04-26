from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from fast_flights import FlightData, Passengers, Result, get_flights
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

class FlightSearch(BaseModel):
    from_airport: str
    to_airport: str
    date: str
    return_date: Optional[str] = None
    adults: int = 1
    children: int = 0
    seat: str = "economy"

class FlightResult(BaseModel):
    is_best: bool
    airline: str
    departure: str
    arrival: str
    duration: str
    stops: int
    price: str
    delay: Optional[str]

@app.post('/search')
def search_flights(req: FlightSearch):
    print("Incoming request:", req.model_dump())
    try:
        flight_data = [FlightData(
            date=req.date,
            from_airport=req.from_airport.upper(),
            to_airport=req.to_airport.upper(),
        )]

        trip = 'one-way'
        if req.return_date:
            flight_data.append(FlightData(
                date=req.return_date,
                from_airport=req.to_airport.upper(),
                to_airport=req.from_airport.upper(),
            ))
            trip = 'round-trip'
        
        # Query flight
        result: Result = get_flights(
            flight_data=flight_data,
            trip=trip,
            seat=req.seat,
            passengers=Passengers(
                adults=req.adults,
                children=req.children,
                infants_in_seat=0,
                infants_on_lap=0,
            ),
            fetch_mode='fallback',
        )

        # Return top 5 flights
        flights = []
        for f in result.flights[:5]:
            stops_value = f.stops
            if isinstance(stops_value, str):
                if stops_value.lower() == "unknown":
                    stops_value = -1   # or 0 if you prefer
                else:
                    try:
                        stops_value = int(stops_value)
                    except:
                        stops_value = -1

            flights.append(FlightResult(
                is_best=f.is_best,
                airline=f.name,
                departure=f.departure,
                arrival=f.arrival,
                duration=f.duration,
                stops=stops_value,
                price=f.price,
                delay=str(f.delay) if f.delay else None,
            ))

        return {'flights': [f.dict() for f in flights], 'trip': trip }

    except Exception as e:
        print('--API ERROR--')
        print("Error:", str(e))
        traceback.print_exc()

        raise HTTPException(status_code=500, detail=str(e))

@app.get('/health')
def health():
    return {'ok': True }