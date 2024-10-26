import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Timer, Zap, ArrowUpCircle, Scale } from 'lucide-react';

const calculateXSteal = (pitcherTime, runnerSpeed, jumpQuality, popTime, throwVelo) => {
  // Normalize metrics to 0-1 scale
  const timeComponent = Math.max(0, Math.min(1, (2.0 - pitcherTime) / 0.5)); // 1.5s is excellent, 2.0s is poor
  const speedComponent = Math.max(0, Math.min(1, (runnerSpeed - 25) / 5)); // 25-30 ft/s range
  const jumpComponent = jumpQuality / 100; // Already 0-100 scale
  const popTimeComponent = Math.max(0, Math.min(1, (2.0 - popTime) / 0.3)); // 1.7s is excellent, 2.0s is poor
  const throwComponent = Math.max(0, Math.min(1, (throwVelo - 75) / 15)); // 75-90 mph range

  // Weighted combination - adjusted weights to include catcher metrics
  const xSteal = (
    timeComponent * 0.25 + // Pitcher's time to plate
    speedComponent * 0.2 + // Runner's speed
    jumpComponent * 0.15 + // Runner's jump quality
    popTimeComponent * 0.25 + // Catcher's pop time
    throwComponent * 0.15    // Catcher's throw velocity
  );
  
  return Math.max(0, Math.min(1, xSteal));
};

const calculateTokens = (xSteal, wasSuccessful) => {
  if (wasSuccessful) {
    return 1 - xSteal; // Higher reward for throwing out fast runners
  } else {
    return -xSteal; // Higher penalty for failing to throw out likely successful stealers
  }
};

const XStealCalculator = () => {
  const [throwData, setThrowData] = useState({
    pitcherTime: 1.8,
    runnerSpeed: 27.5,
    jumpQuality: 75,
    popTime: 1.9,    // Added: Catcher's pop time
    throwVelo: 82    // Added: Catcher's throw velocity
  });
  
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setThrowData({
      ...throwData,
      [e.target.name]: parseFloat(e.target.value),
    });
  };

  const handleCalculate = (wasSuccessful) => {
    setLoading(true);
    setError(null);
    
    try {
      const xSteal = calculateXSteal(
        throwData.pitcherTime,
        throwData.runnerSpeed,
        throwData.jumpQuality,
        throwData.popTime,
        throwData.throwVelo
      );
      
      const tokens = calculateTokens(xSteal, wasSuccessful);
      
      const newAttempt = {
        ...throwData,
        xSteal,
        tokens,
        wasSuccessful,
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setAttempts(prev => [...prev.slice(-9), newAttempt]);
    } catch (err) {
      setError('Error calculating xSteal. Please verify input values.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mlb-cream p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="font-baseball text-4xl text-mlb-navy">xSTEAL</h1>
          <p className="font-baseball text-mlb-red mt-2">Catcher Throwing Metrics Calculator</p>
        </div>

        <div className="mlb-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pitcher Metrics */}
            <div>
              <label className="stat-label flex items-center gap-2">
                <Timer size={16} className="text-mlb-red" />
                Pitcher Time to Plate (s)
              </label>
              <Input
                type="number"
                name="pitcherTime"
                value={throwData.pitcherTime}
                onChange={handleInputChange}
                step="0.1"
                min="1.2"
                max="2.5"
                className="mlb-input"
              />
            </div>
            
            {/* Runner Metrics */}
            <div>
              <label className="stat-label flex items-center gap-2">
                <Zap size={16} className="text-mlb-red" />
                Runner Speed (ft/s)
              </label>
              <Input
                type="number"
                name="runnerSpeed"
                value={throwData.runnerSpeed}
                onChange={handleInputChange}
                step="0.1"
                min="23"
                max="32"
                className="mlb-input"
              />
            </div>
            
            <div>
              <label className="stat-label flex items-center gap-2">
                <ArrowUpCircle size={16} className="text-mlb-red" />
                Jump Quality (0-100)
              </label>
              <Input
                type="number"
                name="jumpQuality"
                value={throwData.jumpQuality}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="mlb-input"
              />
            </div>
            
            {/* Catcher Metrics */}
            <div>
              <label className="stat-label flex items-center gap-2">
                <Timer size={16} className="text-mlb-red" />
                Pop Time (s)
              </label>
              <Input
                type="number"
                name="popTime"
                value={throwData.popTime}
                onChange={handleInputChange}
                step="0.01"
                min="1.7"
                max="2.2"
                className="mlb-input"
              />
            </div>

            <div>
              <label className="stat-label flex items-center gap-2">
                <Zap size={16} className="text-mlb-red" />
                Throw Velocity (mph)
              </label>
              <Input
                type="number"
                name="throwVelo"
                value={throwData.throwVelo}
                onChange={handleInputChange}
                step="0.1"
                min="75"
                max="90"
                className="mlb-input"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => handleCalculate(true)} 
                className="mlb-button flex-1"
                disabled={loading}
              >
                Successful Throw
              </Button>
              <Button 
                onClick={() => handleCalculate(false)} 
                className="mlb-button bg-mlb-red hover:bg-mlb-navy flex-1"
                disabled={loading}
              >
                Failed Attempt
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {attempts.length > 0 && (
          <div className="mlb-card p-6">
            <h2 className="font-baseball text-2xl text-mlb-navy mb-4">Throwing History</h2>
            
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attempts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cccccc" />
                  <XAxis 
                    dataKey="timestamp"
                    tick={{ fill: '#002D72', fontFamily: 'Roboto Mono' }}
                  />
                  <YAxis 
                    domain={[-1, 1]}
                    tick={{ fill: '#002D72', fontFamily: 'Roboto Mono' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#F4F1E9',
                      border: '2px solid #002D72',
                      fontFamily: 'Roboto Mono'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tokens"
                    stroke="#CC0000"
                    strokeWidth={2}
                    name="Tokens Earned"
                    dot={{ fill: '#002D72' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3">
              {attempts.slice().reverse().map((attempt, idx) => (
                <div 
                  key={idx} 
                  className="flex justify-between items-center p-3 bg-mlb-cream rounded-md border-2 border-mlb-navy"
                >
                  <div>
                    <span className="font-stats text-mlb-navy">{attempt.timestamp}</span>
                    <span className="ml-4 text-sm">
                      {attempt.wasSuccessful ? '✅ Out' : '❌ Safe'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="stat-value">
                      {attempt.tokens > 0 ? '+' : ''}{attempt.tokens.toFixed(3)}
                    </div>
                    <div className="text-sm text-mlb-gray">
                      xSteal: {(attempt.xSteal * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default XStealCalculator;
