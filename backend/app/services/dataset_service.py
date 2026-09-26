try:
    import duckdb
except ImportError:
    duckdb = None
import os
import json
import httpx

DUCKDB_PATH = r'd:\Projects\Integration\Pillai\places.duckdb'

def query_local_places(city: str, category: str, limit: int = 10):
    try:
        if duckdb is None: return _get_fallback_spots()
        conn = duckdb.connect(DUCKDB_PATH, read_only=True)
        query = f"""
            SELECT 
                names.primary as name,
                addresses[1].region as state,
                bbox.ymin as lat,
                bbox.xmin as lon,
                basic_category as category
            FROM places
            WHERE 
                (addresses[1].locality ILIKE '%{city}%' OR addresses[1].region ILIKE '%{city}%')
                AND basic_category ILIKE '%{category}%'
            LIMIT {limit}
        """
        results = conn.sql(query).fetchall()
        
        spots = []
        for r in results:
            spots.append({
                "name": r[0],
                "state": r[1],
                "lat": r[2],
                "lon": r[3],
                "category": r[4]
            })
        conn.close()
        
        if not spots:
            return _get_fallback_spots()
            
        return spots
    except Exception as e:
        print(f"[LocalDB] Error querying duckdb: {e}")
        return _get_fallback_spots()

def _get_fallback_spots():
    return [
        { "name": "Yosemite National Park", "lat": 37.8651, "lon": -119.5383, "category": "nature" },
        { "name": "Joshua Tree National Park", "lat": 33.8734, "lon": -115.9010, "category": "nature" },
        { "name": "Muir Woods National Monument", "lat": 37.8912, "lon": -122.5801, "category": "nature" },
        { "name": "Death Valley National Park", "lat": 36.5054, "lon": -117.0794, "category": "nature" },
        { "name": "Redwood National and State Parks", "lat": 41.2132, "lon": -124.0046, "category": "nature" }
    ]

async def ai_recommend_spots(spots, budget, days):
    prompt = f"""
You are the DTO-P3 AI Planner Agent. 
The user wants a {days}-day trip on a {budget} budget.
Here are raw tourist spots pulled from our local offline database:
{json.dumps(spots)}

Your task:
1. Rely on your pre-trained LLM knowledge to deduce which {days * 2} of these spots are the best fit for a {budget} budget.
2. Estimate exactly how many hours a tourist should spend at each spot.
3. Format the result strictly as a JSON array of objects with estimated duration (in hours).

Example Output Format:
[
  {{ "name": "Yosemite", "lat": 37.8, "lon": -119.5, "estimated_hours": 8, "reason": "World-class natural beauty, cheap entrance fee." }}
]

Output ONLY valid JSON.
"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post('https://4zxl3477-11434.inc1.devtunnels.ms/api/generate', json={
                "model": "llama3.1",
                "prompt": prompt,
                "stream": False,
                "format": "json"
            })
            resp.raise_for_status()
            data = resp.json()
            result = json.loads(data['response'])
            if isinstance(result, dict):
                return [result]
            return result
    except Exception as e:
        print(f"Ollama connection error: {e}")
        # Fallback: Just return the spots formatted appropriately
        return [{
            "name": s["name"],
            "lat": s["lat"],
            "lon": s["lon"],
            "estimated_hours": 2,
            "reason": "Top rated local spot"
        } for s in spots[:days*2]]
