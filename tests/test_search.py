"""Tests for flight search orchestrator."""

from datetime import date, datetime
from decimal import Decimal
from unittest.mock import MagicMock

from scalo.itinerary import ItineraryBuilder
from scalo.models import Flight
from scalo.search import FlightSearcher, SearchProgress, _date_range


class FakeClient:
    """Answers each route with the given flights that depart inside the requested dates."""

    def __init__(self, *flights: Flight) -> None:
        self.flights = flights
        self.requests: list[tuple[str, str, date, date]] = []

    def get_flights(
        self, origin: str, destination: str, date_from: date, date_to: date
    ) -> list[Flight]:
        self.requests.append((origin, destination, date_from, date_to))
        return [
            f
            for f in self.flights
            if (f.origin, f.destination) == (origin, destination)
            and date_from <= f.departure_datetime.date() <= date_to
        ]


def _flight(origin: str, destination: str, departure: datetime, arrival: datetime) -> Flight:
    return Flight(
        origin=origin,
        destination=destination,
        flight_number="FR1",
        departure_datetime=departure,
        arrival_datetime=arrival,
        price=Decimal("10"),
        currency="EUR",
    )


EVENING_FIRST_LEG = _flight(
    "SVQ", "BGY", datetime(2026, 12, 20, 19, 0), datetime(2026, 12, 20, 21, 30)
)
MORNING_SECOND_LEG = _flight(
    "BGY", "CRV", datetime(2026, 12, 21, 7, 0), datetime(2026, 12, 21, 8, 30)
)


class TestDateRange:
    def test_single_day(self):
        dates = list(_date_range(date(2026, 3, 10), date(2026, 3, 10)))
        assert dates == [date(2026, 3, 10)]

    def test_multiple_days(self):
        dates = list(_date_range(date(2026, 3, 10), date(2026, 3, 12)))
        assert len(dates) == 3
        assert dates[0] == date(2026, 3, 10)
        assert dates[-1] == date(2026, 3, 12)

    def test_empty_when_start_after_end(self):
        dates = list(_date_range(date(2026, 3, 12), date(2026, 3, 10)))
        assert dates == []


class TestFlightSearcher:
    def test_search_combines_connections(self, sample_flight_a, sample_flight_b):
        mock_client = MagicMock()
        mock_client.get_flights.side_effect = [
            [sample_flight_a],  # CRV -> BGY
            [sample_flight_b],  # BGY -> SVQ
        ]

        builder = ItineraryBuilder()
        searcher = FlightSearcher(client=mock_client, builder=builder)

        results = searcher.search(
            origin="CRV",
            connections=["BGY"],
            destination="SVQ",
            start_date=date(2026, 3, 10),
            end_date=date(2026, 3, 10),
        )

        assert len(results) == 1
        assert results[0].connection_airport == "BGY"

    def test_search_no_flights_returns_empty(self):
        mock_client = MagicMock()
        mock_client.get_flights.return_value = []

        builder = ItineraryBuilder()
        searcher = FlightSearcher(client=mock_client, builder=builder)

        results = searcher.search(
            origin="CRV",
            connections=["BGY"],
            destination="SVQ",
            start_date=date(2026, 3, 10),
            end_date=date(2026, 3, 10),
        )

        assert results == []

    def test_on_progress_callback(self, sample_flight_a, sample_flight_b):
        mock_client = MagicMock()
        mock_client.get_flights.side_effect = [
            [sample_flight_a],
            [sample_flight_b],
            [sample_flight_a],
            [sample_flight_b],
        ]

        builder = ItineraryBuilder()
        searcher = FlightSearcher(client=mock_client, builder=builder)

        progress_events: list[SearchProgress] = []
        searcher.search(
            origin="CRV",
            connections=["BGY", "CRL"],
            destination="SVQ",
            start_date=date(2026, 3, 10),
            end_date=date(2026, 3, 10),
            on_progress=progress_events.append,
        )

        assert len(progress_events) == 2

        assert progress_events[0].connection == "BGY"
        assert progress_events[0].current == 1
        assert progress_events[0].total == 2
        assert "BGY" in progress_events[0].message
        assert "1/2" in progress_events[0].message

        assert progress_events[1].connection == "CRL"
        assert progress_events[1].current == 2
        assert progress_events[1].total == 2

    def test_overnight_connection_from_last_day(self):
        client = FakeClient(EVENING_FIRST_LEG, MORNING_SECOND_LEG)
        searcher = FlightSearcher(client=client, builder=ItineraryBuilder(allow_overnight=True))

        results = searcher.search(
            origin="SVQ",
            connections=["BGY"],
            destination="CRV",
            start_date=date(2026, 12, 10),
            end_date=date(2026, 12, 20),
        )

        assert [(r.first_leg, r.second_leg) for r in results] == [
            (EVENING_FIRST_LEG, MORNING_SECOND_LEG)
        ]

    def test_same_day_search_fetches_only_the_requested_dates(self):
        client = FakeClient()
        searcher = FlightSearcher(client=client, builder=ItineraryBuilder())

        searcher.search(
            origin="SVQ",
            connections=["BGY"],
            destination="CRV",
            start_date=date(2026, 12, 10),
            end_date=date(2026, 12, 20),
        )

        assert client.requests == [
            ("SVQ", "BGY", date(2026, 12, 10), date(2026, 12, 20)),
            ("BGY", "CRV", date(2026, 12, 10), date(2026, 12, 20)),
        ]
