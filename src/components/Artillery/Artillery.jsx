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
      isCpuFirst: getPlayerOrder()
    }));
  };

  const handleTurn = () => {
    console.log("in handleTurn..."); //!DEBUG
    setGameStats(prev => ({ ...prev, roundNum: prev.roundNum + 1 }));

    if (gameConfig.isCpuFirst) {
      if (!cpuTurn()) {
        playerTurn();
      } 
    } else {
      if (!playerTurn()) {
        cpuTurn();
      }
    }
  };

  const playerTurn = () => {
    console.log("in playerTurn..."); //!DEBUG
    return false
  };

  const cpuTurn = () => {
    console.log("in cpuTurn..."); //!DEBUG
    return false
  };

  const getBaseDistance = () => {
    return Math.floor(settings.baseDistanceMin + Math.random() * settings.baseDistanceMaxMod)
  } 

  const getPlayerOrder = () => {
    return Math.random() > 0.5
  }


  return (
    <div className="artillery-container">
        <h1>React Artillery</h1>
        <h2>Game #{gameStats.gamesPlayed}</h2>
        <h3>Round #{gameStats.roundNum}</h3>
        <p>The distance between you and your opponent's base is: {gameConfig.baseDistanceGap} meters away.</p>
        <p>{gameConfig.isCpuFirst ? "The CPU" : "YOU"} will fire first.</p>
        <button onClick={() => startGame()} >Start Game</button>
        <button onClick={() => handleTurn()} >Play Turn!</button>
    </div>
  );
}

export default Artillery;