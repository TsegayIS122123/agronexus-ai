import logging
import requests
import os
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.weather import WeatherData

logger = logging.getLogger(__name__)

# OpenWeather API Key (set in .env)
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")

# Ethiopian cities with coordinates
ETHIOPIAN_CITIES = {
    "addis_ababa": {"lat": 9.032, "lon": 38.742},
    "bahir_dar": {"lat": 11.574, "lon": 37.361},
    "adama": {"lat": 8.547, "lon": 39.270},
    "mekelle": {"lat": 13.497, "lon": 39.470},
    "hawassa": {"lat": 7.062, "lon": 38.476},
    "jimma": {"lat": 7.673, "lon": 36.834},
    "dire_dawa": {"lat": 9.600, "lon": 41.850},
    "dessie": {"lat": 11.134, "lon": 39.636},
    "gondar": {"lat": 12.600, "lon": 37.467},
    "harar": {"lat": 9.314, "lon": 42.118}
}

def get_current_weather(city: str) -> Dict:
    """Get current weather for a city"""
    if city not in ETHIOPIAN_CITIES:
        return {"error": f"City '{city}' not found"}
    
    if not OPENWEATHER_API_KEY:
        return {"error": "OpenWeather API key not configured"}
    
    try:
        coords = ETHIOPIAN_CITIES[city]
        url = f"https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": coords["lat"],
            "lon": coords["lon"],
            "appid": OPENWEATHER_API_KEY,
            "units": "metric"
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if response.status_code == 200:
            return {
                "success": True,
                "data": {
                    "city": city.capitalize(),
                    "temperature": data["main"]["temp"],
                    "feels_like": data["main"]["feels_like"],
                    "humidity": data["main"]["humidity"],
                    "pressure": data["main"]["pressure"],
                    "wind_speed": data["wind"]["speed"],
                    "wind_deg": data["wind"].get("deg", 0),
                    "weather": data["weather"][0]["description"],
                    "icon": data["weather"][0]["icon"],
                    "clouds": data["clouds"]["all"],
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
        else:
            logger.error(f"Weather API error: {data}")
            return {"error": "Failed to fetch weather data"}
            
    except Exception as e:
        logger.error(f"Weather service error: {e}")
        return {"error": str(e)}

def get_weather_forecast(city: str, days: int = 5) -> Dict:
    """Get weather forecast for a city"""
    if city not in ETHIOPIAN_CITIES:
        return {"error": f"City '{city}' not found"}
    
    if not OPENWEATHER_API_KEY:
        return {"error": "OpenWeather API key not configured"}
    
    try:
        coords = ETHIOPIAN_CITIES[city]
        url = f"https://api.openweathermap.org/data/2.5/forecast"
        params = {
            "lat": coords["lat"],
            "lon": coords["lon"],
            "appid": OPENWEATHER_API_KEY,
            "units": "metric"
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if response.status_code == 200:
            forecasts = []
            for item in data["list"][:days * 8]:  # 8 entries per day (3-hour intervals)
                forecasts.append({
                    "time": item["dt_txt"],
                    "temperature": item["main"]["temp"],
                    "feels_like": item["main"]["feels_like"],
                    "humidity": item["main"]["humidity"],
                    "pressure": item["main"]["pressure"],
                    "wind_speed": item["wind"]["speed"],
                    "weather": item["weather"][0]["description"],
                    "icon": item["weather"][0]["icon"],
                    "clouds": item["clouds"]["all"],
                    "rain": item.get("rain", {}).get("3h", 0),
                    "snow": item.get("snow", {}).get("3h", 0)
                })
            
            return {
                "success": True,
                "data": {
                    "city": city.capitalize(),
                    "forecast": forecasts[:days * 8]
                }
            }
        else:
            logger.error(f"Weather API error: {data}")
            return {"error": "Failed to fetch forecast"}
            
    except Exception as e:
        logger.error(f"Weather service error: {e}")
        return {"error": str(e)}

def get_weather_alerts(city: str) -> Dict:
    """Get severe weather alerts"""
    try:
        weather = get_current_weather(city)
        forecast = get_weather_forecast(city, 3)
        
        alerts = []
        
        if weather.get("success"):
            temp = weather["data"]["temperature"]
            if temp > 35:
                alerts.append({
                    "type": "heat_warning",
                    "severity": "high",
                    "message": f"Extreme heat alert: Temperature {temp}°C. Protect crops from heat stress.",
                    "action": "Provide shade and increase irrigation"
                })
            elif temp < 5:
                alerts.append({
                    "type": "frost_warning",
                    "severity": "medium",
                    "message": f"Frost alert: Temperature {temp}°C. Protect sensitive crops.",
                    "action": "Cover plants or use frost protection"
                })
        
        if forecast.get("success"):
            for item in forecast["data"]["forecast"][:8]:
                if item.get("rain", 0) > 10:
                    alerts.append({
                        "type": "heavy_rain_warning",
                        "severity": "high",
                        "message": f"Heavy rain predicted: {item['rain']}mm. Risk of flooding.",
                        "action": "Check drainage systems"
                    })
                if item.get("wind_speed", 0) > 15:
                    alerts.append({
                        "type": "wind_warning",
                        "severity": "medium",
                        "message": f"High wind alert: {item['wind_speed']} km/h. Risk of crop damage.",
                        "action": "Secure structures and staking"
                    })
        
        return {
            "success": True,
            "data": {
                "city": city.capitalize(),
                "alerts": alerts[:5],
                "total_alerts": len(alerts)
            }
        }
        
    except Exception as e:
        logger.error(f"Alert service error: {e}")
        return {"error": str(e)}

def get_agricultural_advice(weather_data: Dict) -> List[str]:
    """Generate agricultural advice based on weather"""
    advice = []
    
    try:
        if weather_data.get("success"):
            temp = weather_data["data"]["temperature"]
            
            if temp > 30:
                advice.append("🌡️ High temperature detected. Water crops early morning or evening.")
            elif temp < 10:
                advice.append("❄️ Cold conditions. Protect young plants and seedlings.")
            
            humidity = weather_data["data"].get("humidity", 0)
            if humidity > 80:
                advice.append("💧 High humidity. Watch for fungal diseases.")
            elif humidity < 30:
                advice.append("☀️ Low humidity. Ensure adequate irrigation.")
        
        return advice[:4]
        
    except Exception as e:
        logger.error(f"Agricultural advice error: {e}")
        return ["Check weather conditions and plan accordingly"]
