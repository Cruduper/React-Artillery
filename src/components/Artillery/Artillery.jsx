import { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import './artillery.scss';



function Artillery() {
    //refs for canvas graphics
  const plyrBase = useRef(null);
  const cpuBase = useRef(null);
  const plyrMissile = useRef(null);
  const cpuMissile = useRef(null);

    //config vars
  const baseRadius = 10;
  const baseSize = baseRadius * 2;
  const conf = {
    baseRadius: baseRadius,
    baseSize: baseSize,
    missileSize: 10,
    baseDistanceMin: 350,
    baseDistanceMaxMod: 600,
    stageWidth: 1000 + baseSize,
    stageHeight: 400,
  }

      //state
  const [gameSettings, setGameSettings] = useState()
  const [gameStats, setGameStats] = useState({ 
    gamesWon: 0, 
    gamesPlayed: 0, 
    roundNum: 0, 
    winPercentage: 0 
  })
  const [cpuData, setCpuData] = useState()
  const [plyrData, setPlyrData] = useState();
  const [gameLog, setGameLog] = useState([]);
  const [turnLog, setTurnLog] = useState();
  const [isEndgameScreen, setIsEndgameScreen] = useState(false);



  useEffect(() => {
    setGameSettings(populateDefaultGameSettings());
  }, []);

  useEffect(() => {
    console.log(cpuData?.choices); //!DEBUG
  }, [cpuData]);

  useEffect(() => {
    if (turnLog?.msgNum === 2) {
      setGameLog(prev => [...prev, turnLog.msg]);
    }
  }, [turnLog]);



  const startGame = () => {
    setGameStats(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1, roundNum: 1 }));
    resetGame();
  };

  const resetGame = () => {
    setGameSettings(populateDefaultGameSettings());
    setPlyrData(populateDefaultPlyrData());
    setCpuData(populateDefaultCpuData());
    setTurnLog(populateDefaultTurnLog());
    setGameLog([]);
    setGameSettings(populateDefaultGameSettings());
    setIsEndgameScreen(false);
  }

  const handleTurn = () => {
    setGameStats(prev => ({ ...prev, roundNum: prev.roundNum + 1 }));
    setTurnLog(populateDefaultTurnLog());

    if (gameSettings.isCpuFirst) {
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
    var degrees = plyrData.choices.degrees; 
    var speed = plyrData.choices.speed;
    console.log(plyrData)
    const playerMissileDist = calculateMissileTravel(degrees, speed);
    if (isMissileHit(playerMissileDist)) {
      setTurnLog(prev => ({
        ...prev,
        msgNum: 2,
        msg: prev.msg + "player wins!\n"
      }));
      setGameStats(prev => ({ ...prev, gamesWon: prev.gamesWon + 1 }));
      setIsEndgameScreen(true);
      return true;
    } else {
      setTurnLog(prev => ({
        ...prev,
        msgNum: prev.msgNum + 1,
        msg: prev.msg + `Your missile missed the CPU's base by ${playerMissileDist - gameSettings.baseDistanceGap} meters.\n`
      }));
      return false;
    }
  };

  const cpuTurn = () => {
    const degrees = cpuData.choices.minDegreeBound + Math.random() * cpuData.choices.maxDegreeOffset;
    const speed = cpuData.choices.minSpeedBound + Math.random() * cpuData.choices.maxSpeedOffset;
    setCpuData(prev => ({ 
      ...prev, 
      choices: {
        ...prev.choices,
        degrees: degrees, 
        speed: speed 
      }
    }));
    const cpuMissileDist = calculateMissileTravel(degrees, speed);
    if (isMissileHit(cpuMissileDist)) {
      setTurnLog(prev => ({
        ...prev,
        msgNum: 2,
        msg: prev.msg + "CPU wins!\n"
      }));
      setIsEndgameScreen(true);
      return true;
    } else {
      setTurnLog(prev => ({
        ...prev,
        msgNum: prev.msgNum + 1,
        msg: prev.msg + `The CPU's missile missed your base by ${cpuMissileDist - gameSettings.baseDistanceGap} meters.\n`
      }));
      recalculateCpuBounds(cpuMissileDist)
      return false;
    }
  };

  const recalculateCpuBounds = (cpuMissileDist) => {
    if (cpuMissileDist - gameSettings.baseDistanceGap > 0) {
      setCpuData(prev => ({
        ...prev,
        choices: {
          ...prev.choices,
          maxDegreeOffset: prev.choices.degrees - prev.choices.minDegreeBound,
          maxSpeedOffset: prev.choices.speed - prev.choices.minSpeedBound,
        }
      }));
    } else {
      setCpuData(prev => ({
        ...prev,
        choices: {
          ...prev.choices,
          minDegreeBound: prev.choices.degrees,
          minSpeedBound: prev.choices.speed,
        }
      }));
    }
  };

  const calculateMissileTravel = (degrees, speed) => {
    const radians = degrees * (Math.PI / 180);
    return Math.floor((speed * speed * Math.sin(2 * radians)) / 9.80665);
  };

  const isMissileHit = (playerMissileDist) => {
    return Math.abs(playerMissileDist - gameSettings.baseDistanceGap) <= conf.baseRadius;
  }

  const getBaseDistance = () => {
    return Math.floor(conf.baseDistanceMin + Math.random() * conf.baseDistanceMaxMod)
  } 

  const getPlayerOrder = () => {
    return Math.random() > 0.5
  }

    const getBaseOffset = () => {
    return (conf.stageWidth - gameSettings.baseDistanceGap) / 2;
  }

  const populateDefaultPlyrData = () => {
    return {
      type: "human",
      missileRef: plyrMissile,
      missileDirection: 1,
      firing: false,
      choices: {
        degrees: 45,
        speed: 50,
      },
      missileCoords: {
        initX: 0 + getBaseOffset() - conf.missileSize/2,
        initY: conf.stageHeight - conf.missileSize,
      },
      baseCoords: {
        x: 0 - baseRadius + getBaseOffset(),
        y: conf.stageHeight - conf.baseSize
      }
    }
  };

    const populateDefaultCpuData = () => {
    return {
      type: "cpu",
      missileRef: cpuMissile,
      missileDirection: -1, //moves left instead of right
      firing: false,
      choices: {
        degrees: 0,
        speed: 0,
        minDegreeBound: 25,
        maxDegreeOffset: 20,
        minSpeedBound: 55,
        maxSpeedOffset: 35
      },
      missileCoords: {
        initX: conf.stageWidth - conf.missileSize/2 - getBaseOffset(),
        initY: conf.stageHeight - conf.missileSize,
      },
      baseCoords: {
        x: conf.stageWidth - conf.baseSize/2 - getBaseOffset(),
        y: conf.stageHeight - conf.baseSize
      }
    }
  };

  const populateDefaultTurnLog = () => {
    return {
      msgNum: 0,
      msg: ""
    }
  }

  const populateDefaultGameSettings = () => {
    return {
      isCpuFirst: getPlayerOrder(),
      baseDistanceGap: getBaseDistance(),
    }
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
            <div className="artillery-animation">
              <Stage width={conf.stageWidth} height={conf.stageHeight}>
                <Layer>
                  <Rect
                    ref={cpuData.missileRef}
                    x={cpuData.missileCoords.initX}
                    y={cpuData.missileCoords.initY}
                    width={conf.missileSize}
                    height={conf.missileSize}
                    fill="blue"
                  />
                </Layer>
                <Layer>
                  <Rect
                    ref={plyrData.missileRef}
                    x={plyrData.missileCoords.initX}
                    y={plyrData.missileCoords.initY}
                    width={conf.missileSize}
                    height={conf.missileSize}
                    fill="red"
                  />
                </Layer>
                <Layer>
                  <Rect
                    ref={plyrBase}
                    x={plyrData.baseCoords.x}
                    y={plyrData.baseCoords.y}
                    width={conf.baseSize}
                    height={conf.baseSize}
                    fill="rgba(0, 0, 0, 0.35)"
                  />
                </Layer>

                <Layer>
                  <Rect
                    ref={cpuBase}
                    x={cpuData.baseCoords.x}
                    y={cpuData.baseCoords.y}
                    width={conf.baseSize}
                    height={conf.baseSize}
                    fill="rgba(0, 0, 0, 0.35)"
                  />
                </Layer>
              </Stage>
            </div>

            <p>The distance between you and your opponent's base is: {gameSettings.baseDistanceGap} meters away.</p>
            <p>{gameSettings.isCpuFirst ? "The CPU" : "YOU"} will fire first.</p>

            <div>
              <label>
                Angle:
                <input 
                  placeholder="Angle (degrees)" 
                  type="number"
                  value={plyrData.choices.degrees}  
                  onChange={(e) => setPlyrData(prev => ({ 
                  ...prev, 
                    choices: {
                      ...prev.choices,
                      degrees: parseFloat(e.target.value) 
                    }
                  }))} 
                />
              </label>
              <label>
                Speed:
                <input 
                  placeholder="Speed (m/s)" 
                  type="number"
                  value={plyrData.choices.speed}
                  onChange={(e) => setPlyrData(prev => ({ 
                    ...prev, 
                    choices: {
                      ...prev.choices,
                      speed: parseFloat(e.target.value) 
                    }
                  }))}  
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