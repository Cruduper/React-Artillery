import {useState} from 'react'

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









  return (
    <div className="artillery-container">
      <p>Hello Artillery World! </p>
    </div>
  );
}

export default Artillery;