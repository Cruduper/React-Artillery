import {useState, useEffect} from 'react'

function Artillery() {
  const settings = {
    baseRadius: 10,
    baseDistanceMin: 350,
    baseDistanceMaxMod: 600
  }
  const [gameConfig, setGameConfig] = useState({
    isCpuFirst: false,
    baseDistanceGap: 500,
  })
  const [gameStats, setGameStats] = useState({ 
    gamesWon: 0, 
    gamesPlayed: 0, 
    roundNum: 0, 
    winPercentage: 0 
  })
  const [cpuData, setCpuData] = useState({
    degrees: 0,
    speed: 0,
    minDegreeBound: 25,
    maxDegreeOffset: 20,
    minSpeedBound: 55,
    maxSpeedOffset: 35
  })
  const [plyrData, setPlyrData] = useState({ 
    degrees: 0, 
    speed: 0 
  });

  useEffect(() => {
    console.log(gameConfig); //!DEBUG
  }, [gameConfig]);

  const startGame = () => {
    setGameStats(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1, roundNum: 1 }));
    setGameConfig(prev => ({ 
      ...prev, 
      baseDistanceGap: getBaseDistance(),
      isCpuFirst: true
    }));
  };

  const getBaseDistance = () => {
    return Math.floor(settings.baseDistanceMin + Math.random() * settings.baseDistanceMaxMod)
  } 


  return (
    <div className="artillery-container">
        <h1>React Artillery</h1>
        <button onClick={startGame} >start game</button>
    </div>
  );
}

export default Artillery;