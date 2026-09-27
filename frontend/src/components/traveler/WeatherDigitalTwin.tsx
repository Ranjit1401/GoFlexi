import React, { useEffect, useMemo, useState } from 'react';
import { CloudRain, Gauge, Thermometer, Wind, RefreshCw, MessageSquareText } from 'lucide-react';
import { TripPlan, DigitalTwinResponse } from '../../types/trip-planner';
import { getDigitalTwinSimulation } from '../../services/trip-wizard';

interface WeatherDigitalTwinProps {
  plan: TripPlan;
}

export const WeatherDigitalTwin: React.FC<WeatherDigitalTwinProps> = ({ plan }) => {
  const destinationLocation = useMemo(
    () => plan.locations.find((location) => location.type === 'destination') || plan.locations[0],
    [plan.locations],
  );
  const [data, setData] = useState<DigitalTwinResponse | null>(null);
  const [rainfall, setRainfall] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [stormHours, setStormHours] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (scenario?: { rainfall: number; temperature: number; storm: number }) => {
    if (!destinationLocation || !plan.start_date || !plan.end_date) return;
    try {
      setError(null);
      if (scenario) setSimulating(true); else setLoading(true);
      const result = await getDigitalTwinSimulation({
        latitude: destinationLocation.latitude,
        longitude: destinationLocation.longitude,
        destination: plan.destination,
        startDate: plan.start_date,
        endDate: plan.end_date,
        rainfallMm: scenario?.rainfall,
        temperatureC: scenario?.temperature,
        stormDurationHours: scenario?.storm,
      });
      setData(result);
      window.dispatchEvent(new CustomEvent('goflexi:weather-twin', { detail: result }));
      if (!scenario) {
        setRainfall(result.scenario.rainfall_mm);
        setTemperature(result.scenario.temperature_c);
        setStormHours(result.scenario.storm_duration_hours);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Digital Twin data could not be loaded.');
    } finally {
      setLoading(false);
      setSimulating(false);
    }
  };

  useEffect(() => {
    setData(null);
    setRainfall(null);
    setTemperature(null);
    setStormHours(null);
    void load();
    // The plan identity changes only when a new itinerary is created.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id]);

  if (!destinationLocation || !plan.start_date || !plan.end_date) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-[10px] text-slate-500">
        Digital Twin will activate once the trip has a mapped destination and dates.
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#071225]"><RefreshCw className="h-4 w-4 animate-spin text-[#1683F7]" /> Loading live weather twin…</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[10px] text-amber-800">
        <p className="font-semibold">Weather Twin unavailable</p>
        <p className="mt-1">{error}</p>
        <button type="button" onClick={() => void load()} className="mt-2 font-semibold underline">Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const runScenario = () => {
    if (rainfall === null || temperature === null || stormHours === null) return;
    void load({ rainfall, temperature, storm: stormHours });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#1683F7]">Weather Digital Twin</p>
            <h4 className="mt-1 text-sm font-semibold text-[#071225]">What happens if weather changes?</h4>
            <p className="mt-1 text-[9px] text-slate-500">Live weather is the baseline; sliders simulate an isolated future state without changing the real trip.</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">Live baseline</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#F7F9FC] p-2.5"><CloudRain className="h-4 w-4 text-[#1683F7]" /><p className="mt-1 text-[9px] text-slate-500">Rain chance</p><p className="text-xs font-semibold">{data.live_weather.precipitation_probability}%</p></div>
          <div className="rounded-xl bg-[#F7F9FC] p-2.5"><Thermometer className="h-4 w-4 text-[#1683F7]" /><p className="mt-1 text-[9px] text-slate-500">Temperature</p><p className="text-xs font-semibold">{data.live_weather.temp_min}–{data.live_weather.temp_max}°C</p></div>
          <div className="rounded-xl bg-[#F7F9FC] p-2.5"><Gauge className="h-4 w-4 text-[#1683F7]" /><p className="mt-1 text-[9px] text-slate-500">System risk</p><p className="text-xs font-semibold">{data.system_risk_probability}% ± {data.system_risk_uncertainty}%</p></div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block text-[10px] font-semibold text-[#071225]">Rainfall: {rainfall ?? data.scenario.rainfall_mm} mm
            <input className="mt-1 w-full accent-[#1683F7]" type="range" min="0" max="200" step="5" value={rainfall ?? data.scenario.rainfall_mm} onChange={(e) => setRainfall(Number(e.target.value))} />
          </label>
          <label className="block text-[10px] font-semibold text-[#071225]">Temperature: {temperature ?? data.scenario.temperature_c}°C
            <input className="mt-1 w-full accent-[#1683F7]" type="range" min="0" max="50" step="1" value={temperature ?? data.scenario.temperature_c} onChange={(e) => setTemperature(Number(e.target.value))} />
          </label>
          <label className="block text-[10px] font-semibold text-[#071225]">Storm duration: {stormHours ?? data.scenario.storm_duration_hours} h
            <input className="mt-1 w-full accent-[#1683F7]" type="range" min="0" max="48" step="1" value={stormHours ?? data.scenario.storm_duration_hours} onChange={(e) => setStormHours(Number(e.target.value))} />
          </label>
          <button type="button" onClick={runScenario} disabled={simulating} className="inline-flex items-center gap-2 rounded-xl bg-[#1683F7] px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-50">
            {simulating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Wind className="h-3.5 w-3.5" />}
            Simulate what-if
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2"><Gauge className="h-4 w-4 text-[#1683F7]" /><h4 className="text-xs font-semibold">Propagated system impact</h4></div>
        <div className="space-y-2.5">
          {data.impacts.map((impact) => (
            <div key={impact.name}>
              <div className="flex items-center justify-between gap-2 text-[9px]"><span className="font-semibold text-[#071225]">{impact.name}</span><span className="text-slate-500">{impact.change_pct > 0 ? '+' : ''}{impact.change_pct}% ± {impact.uncertainty_pct}%</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#1683F7]" style={{ width: `${Math.min(100, Math.abs(impact.change_pct))}%` }} /></div>
              <p className="mt-1 text-[9px] leading-relaxed text-slate-500">{impact.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-[#1683F7]" /><h4 className="text-xs font-semibold">Real-world traveler signals</h4></div>
        <p className="mt-1 text-[9px] text-slate-500">{data.social_signal_status}</p>
        {data.social_signals.length ? (
          <div className="mt-2 space-y-2">{data.social_signals.map((signal) => <a key={`${signal.title}-${signal.created_at}`} href={signal.url} target="_blank" rel="noreferrer" className="block rounded-xl bg-[#F7F9FC] p-2 text-[9px] text-slate-600 hover:text-[#1683F7]"><span className="font-semibold text-[#071225]">{signal.title}</span><span className="mt-1 block text-slate-400">{signal.source} · score {signal.score ?? 0}</span></a>)}</div>
        ) : <p className="mt-2 text-[9px] text-slate-400">No matching public traveler reports were returned for this update.</p>}
      </div>
    </div>
  );
};

export default WeatherDigitalTwin;
