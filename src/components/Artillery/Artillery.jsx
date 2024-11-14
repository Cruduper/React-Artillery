import {useState, useEffect} from 'react';
import './artillery.scss';



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
  const defaultCpuData = {
    degrees: 0,
    speed: 0,
    minDegreeBound: 25,
    maxDegreeOffset: 20,
    minSpeedBound: 55,
    maxSpeedOffset: 35
  };
  const [cpuData, setCpuData] = useState(defaultCpuData)
  const defaultPlyrData = { 
    degrees: 45, 
    speed: 50 
  };
  const [plyrData, setPlyrData] = useState(defaultPlyrData);
  const [gameLog, setGameLog] = useState([]);
  const defaultTurnLog = {
    msgNum: 0,
    msg: ""
  }
  const [turnLog, setTurnLog] = useState(defaultTurnLog);
  const [isEndgameScreen, setIsEndgameScreen] = useState(false);



  useEffect(() => {
    // console.log(gameConfig); //!DEBUG
  }, [gameConfig]);

  useEffect(() => {
    if (turnLog.msgNum === 2) {
      setGameLog(prev => [...prev, turnLog.msg]);
    }
  }, [turnLog]);



  const startGame = () => {
    setGameStats(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1, roundNum: 1 }));
    setGameConfig(prev => ({ 
      ...prev, 
      baseDistanceGap: getBaseDistance(),
      isCpuFirst: getPlayerOrder()
    }));
    setPlyrData(defaultPlyrData);
    setGameLog([]);
    setIsEndgameScreen(false);
  };

  const handleTurn = () => {
    setGameStats(prev => ({ ...prev, roundNum: prev.roundNum + 1 }));
    setTurnLog(defaultTurnLog);

    if (gameConfig.isCpuFirst) {
      if (!cpuTurn()) {
        humanTurn();
      } 
    } else {
      if (!humanTurn()) {
        cpuTurn();
      }
    }
  };

  const humanTurn = () => {
    var degrees = plyrData.degrees; 
    var speed = plyrData.speed;
    console.log(plyrData)
    const playerMissileDist = calculateMissileTravel(degrees, speed);
    if (isMissileHit(playerMissileDist)) {
      setTurnLog(prev => ({
        ...prev,
        msgNum: prev.msgNum + 1,
        msg: prev.msg + "player wins!\n"
      }));
      setGameStats(prev => ({ ...prev, gamesWon: prev.gamesWon + 1 }));
      setIsEndgameScreen(true);
      return true;
    } else {
      setTurnLog(prev => ({
        ...prev,
        msgNum: prev.msgNum + 1,
        msg: prev.msg + `Your missile missed the CPU's base by ${playerMissileDist - gameConfig.baseDistanceGap} meters.\n`
      }));
      return false;
    }
  };

  const cpuTurn = () => {
    const degrees = cpuData.minDegreeBound + Math.random() * cpuData.maxDegreeOffset;
    const speed = cpuData.minSpeedBound + Math.random() * cpuData.maxSpeedOffset;
    setCpuData(prev => ({ ...prev, degrees, speed }));
    const cpuMissileDist = calculateMissileTravel(degrees, speed);
    if (isMissileHit(cpuMissileDist)) {
      setTurnLog(prev => ({
        ...prev,
        msgNum: prev.msgNum + 1,
        msg: prev.msg + "CPU wins!\n"
      }));
      setIsEndgameScreen(true);
      return true;
    } else {
      setTurnLog(prev => ({
        ...prev,
        msgNum: prev.msgNum + 1,
        msg: prev.msg + `The CPU's missile missed your base by ${cpuMissileDist - gameConfig.baseDistanceGap} meters.\n`
      }));
      recalculateCpuBounds(cpuMissileDist)
      return false;
    }
  };

  const recalculateCpuBounds = (cpuMissileDist) => {
    if (cpuMissileDist - gameConfig.baseDistanceGap > 0) {
      setCpuData(prev => ({
        ...prev,
        maxDegreeOffset: prev.degrees - prev.minDegreeBound,
        maxSpeedOffset: prev.speed - prev.minSpeedBound
      }));
    } else {
      setCpuData(prev => ({
        ...prev,
        minDegreeBound: prev.degrees,
        minSpeedBound: prev.speed,
      }));
    }
  };

  const calculateMissileTravel = (degrees, speed) => {
    const radians = degrees * (Math.PI / 180);
    return Math.floor((speed * speed * Math.sin(2 * radians)) / 9.80665);
  };

  const isMissileHit = (playerMissileDist) => {
    return Math.abs(playerMissileDist - gameConfig.baseDistanceGap) <= settings.baseRadius;
  }

  const getBaseDistance = () => {
    return Math.floor(settings.baseDistanceMin + Math.random() * settings.baseDistanceMaxMod)
  } 

  const getPlayerOrder = () => {
    return Math.random() > 0.5
  }


  return (
    <div className="artillery-container">
        <h1>React Artillery</h1>
        { gameStats.gamesPlayed == 0 && (
          <button onClick={() => startGame()} >Start Game</button>
        )}
        { gameStats.gamesPlayed > 0 && (
          <div className="gameDisplay">
            <h2>Game #{gameStats.gamesPlayed}</h2>
            <h3>Round #{gameStats.roundNum}</h3>
            <p>The distance between you and your opponent's base is: {gameConfig.baseDistanceGap} meters away.</p>
            <p>{gameConfig.isCpuFirst ? "The CPU" : "YOU"} will fire first.</p>

            <div>
              <label>
                Angle:
                <input 
                  placeholder="Angle (degrees)" 
                  type="number"
                  value={plyrData.degrees}  
                  onChange={(e) => setPlyrData(prev => ({ ...prev, degrees: parseFloat(e.target.value) }))} 
                />
              </label>
              <label>
                Speed:
                <input 
                  placeholder="Speed (m/s)" 
                  type="number"
                  value={plyrData.speed}
                  onChange={(e) => setPlyrData(prev => ({ ...prev, speed: parseFloat(e.target.value) }))} 
                />
              </label>
              { !isEndgameScreen && <button onClick={() => handleTurn()} >Play Turn!</button> }
              { isEndgameScreen && <button onClick={() => startGame()} >New Game</button>}
            </div>

            <div className="artillery-log">
              {gameLog.map((log, index) => (
                <p key={index}dangerouslySetInnerHTML={{ __html: log.replace(/\n/g, '<br />') }} />
              ))}
            </div>

            <p>Your win percentage is: {((gameStats.gamesWon / gameStats.gamesPlayed) * 100).toFixed(2)}%</p>
          </div>
        )}
    </div>
  );
}

export default Artillery;