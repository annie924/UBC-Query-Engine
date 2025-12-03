# InsightUBC Query Engine & Dataset Manager

This project is an extension of the UBC CPSC 310 "InsightUBC" system. It allows users to upload, manage, and query datasets about UBC course sections and campus rooms through a REST API and a frontend interface.

## 🚀 Features

- Upload and remove datasets (Sections and Rooms) via API
- Execute powerful queries on datasets with filtering, grouping, sorting, and aggregation
- Persist datasets to disk between server restarts
- User-friendly frontend to visualize and interact with data
- Support for geolocation-based room mapping (via provided API)

---

## 📁 Dataset Types

### 1. Sections Dataset
Standard dataset in JSON format that contains UBC course section data.

### 2. Rooms Dataset
HTML-based dataset with building and room details. Geolocation is fetched using:
See full [Room Specification](https://sites.google.com/view/ubccpsc310-24w2/project/room-specification) :contentReference[oaicite:0]{index=0}.

---

## 📦 API Endpoints

| Method | Endpoint                     | Description                          |
|--------|------------------------------|--------------------------------------|
| PUT    | `/dataset/:id/:kind`         | Add a dataset (`sections` or `rooms`) |
| DELETE | `/dataset/:id`               | Remove a dataset                     |
| GET    | `/datasets`                  | List all datasets                    |
| POST   | `/query`                     | Perform a query                      |

Responses follow the specification defined in `IInsightFacade.ts`.

---

## 🔍 Query Language

Queries follow a custom EBNF format with support for:

- `WHERE` filters (e.g., GT, EQ, IS)
- `TRANSFORMATIONS`:
  - `GROUP`: Define keys to group results
  - `APPLY`: Aggregations (AVG, SUM, MIN, MAX, COUNT)
- `OPTIONS`:
  - `COLUMNS`: Select fields or apply keys
  - `ORDER`: Single or multi-key directional sorting

**Example aggregation query:**
```json
{
  "WHERE": {
    "GT": {
      "rooms_seats": 300
    }
  },
  "OPTIONS": {
    "COLUMNS": ["rooms_shortname", "maxSeats"],
    "ORDER": { "dir": "DOWN", "keys": ["maxSeats"] }
  },
  "TRANSFORMATIONS": {
    "GROUP": ["rooms_shortname"],
    "APPLY": [
      { "maxSeats": { "MAX": "rooms_seats" } }
    ]
  }
}
