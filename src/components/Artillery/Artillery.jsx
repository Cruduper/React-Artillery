import { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image } from 'react-konva';
import useImage from 'use-image';
import './artillery.scss';
import baseImage from '../../assets/base_graphic.png';
import missileImage from '../../assets/missile_graphic.png';
import winScrollImage from '../../assets/win_scroll.png';



function Artillery() {

/*******       Vars       *******/
  var seconds = 0; //time elapsed
  const scrollableContainerRef = useRef(null);
    //refs for canvas
  const plyrBase = useRef(null);
  const cpuBase = useRef(null);
  const plyrMissile = useRef(null);
  const cpuMissile = useRef(null);
  const winScroll = useRef(null);

    //config vars
  const baseRadius = 10;
  const baseSize = baseRadius * 2;
  const conf = {
    baseRadius: baseRadius,
    baseSize: baseSize,
    missileSize: 5,
    missileRotationAngleOffset: -16, //more negative values make missile appear more "self-propelled"
    baseDistanceMin: 400,
    baseDistanceMaxMod: 400, //min and maxMod should equal stageWidth
    stageWidth: 780 + baseSize,
    stageHeight: 350,
    animationFrameDelay: 1,
    timeScale: .1
  }

      //state
  const [gameSettings, setGameSettings] = useState()
  const [gameStats, setGameStats] = useState({ 
    gamesWon: 0, 
    gamesPlayed: 0, 
    roundNum: 0, 
    winPercentage: 0, 
  })
  const [cpuData, setCpuData] = useState()
  const [plyrData, setPlyrData] = useState();
  const [gameLog, setGameLog] = useState([]);
  const [turnLog, setTurnLog] = useState();
  const [isEndgameScreen, setIsEndgameScreen] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [winner, setWinner] = useState();

      //other hooks
  const [baseImg] = useImage(baseImage);
  const [missileImg] = useImage(missileImage);
  const [winScrollImg] = useImage(winScrollImage);



/*******       useEffects       *******/
  useEffect(() => {
    if (gameSettings) {
      setTurnLog(populateDefaultTurnLog());
      setGameLog([]);
      setIsEndgameScreen(false);
      setPlyrData(populateDefaultPlyrData());
      setCpuData(populateDefaultCpuData());
      setWinner(null);
    }
  }, [gameSettings]);

  useEffect(() => {
    const missileAnimation = (data) => {
      const missile = data.missileRef.current;
      const speed = data.choices.speed;
      const degrees = data.choices.degrees;
      
      var xDisplacement = missilePath(degrees, speed, seconds, "horizontal");
      var yDisplacement = missilePath(degrees, speed, seconds, "vertical");

      if (missile.y() <= data.missileCoords.initY) {
        missile.x(data.missileCoords.initX + (xDisplacement * data.missileDirection));
        missile.y(data.missileCoords.initY - yDisplacement);
        seconds += 1 * conf.timeScale; 
        const angleChange = conf.timeScale * getRotationRate(data);

        missile.rotate(angleChange);
        missile.getLayer().batchDraw();


      } else {
        if (data.type === "human") {
          setPlyrData(prev => ({...prev, firing: false, missileOpacity: 0}));
        } else if (data.type === "cpu") {
          setCpuData(prev => ({...prev, firing: false, missileOpacity: 0}));
        }
        resetMissile(data);
      }
    };

    function handleMissileAnimation(data) {
      const frameId = setInterval(() => missileAnimation(data), conf.animationFrameDelay);
      return () => clearInterval(frameId);
    };

    if (!gameSettings?.isCpuFirst) {
      if (plyrData?.firing) {
        setPlyrData(prev => ({...prev, missileOpacity: 1}));
        plyrData.missileRef.current.rotation(-1 * plyrData.choices.degrees + 90 + conf.missileRotationAngleOffset);
        return handleMissileAnimation(plyrData)
      } else if (cpuData?.firing) {
        setCpuData(prev => ({...prev, missileOpacity: 1}));
        cpuData.missileRef.current.rotation(cpuData.choices.degrees - 90 - conf.missileRotationAngleOffset);
        return handleMissileAnimation(cpuData)
      } else if (gameStats.roundNum > 1) {
        setAnimationComplete(true);
      }
    } else {
      if (cpuData?.firing) {
        setCpuData(prev => ({...prev, missileOpacity: 1}));
        cpuData.missileRef.current.rotation(cpuData.choices.degrees - 90 - conf.missileRotationAngleOffset);
        return handleMissileAnimation(cpuData)
      } else if (plyrData?.firing) {
        setPlyrData(prev => ({...prev, missileOpacity: 1}));
        plyrData.missileRef.current.rotation(-1 * plyrData.choices.degrees + 90 + conf.missileRotationAngleOffset);
        return handleMissileAnimation(plyrData)
      } else if (gameStats.roundNum > 1) {
        setAnimationComplete(true);
      }
    } 
  }, [plyrData?.firing, cpuData?.firing]);

  useEffect(() => {
    const scrollableContainer = scrollableContainerRef.current;
    if (scrollableContainer) {
      scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
    }
  }, [gameLog]);

  useEffect(() => {
    if (turnLog?.msgNum === 2 && animationComplete) {
      setGameLog(prev => [...prev, turnLog.msg]);
    }
  }, [turnLog, animationComplete]);

  useEffect(() => {
    if (winner && animationComplete) {
        setIsEndgameScreen(true);
    }
  },[animationComplete, winner]);



/*******       Functions       *******/
  const startGame = () => {
    setGameStats(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1, roundNum: 1 }));
    setGameSettings(populateDefaultGameSettings());
  };

  const resetMissile = (data) => {
    data.missileRef.current.x(data.missileCoords.initX);
    data.missileRef.current.y(data.missileCoords.initY);
  }

  const handleTurn = () => {
    setAnimationComplete(false);
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
    const playerMissileDist = calculateMissileTravel(degrees, speed);
    setPlyrData(prevState => ({...prevState, firing: true }));

    if (isMissileHit(playerMissileDist)) {
      setTurnLog(prev => ({
        ...prev,
        msgNum: 2,
        msg: prev.msg + "player wins!\n"
      }));
      setGameStats(prev => ({ ...prev, gamesWon: prev.gamesWon + 1 }));
      setWinner("human");
      return true;
    } else {
      setTurnLog(prev => ({
        ...prev,
        msgNum: prev.msgNum + 1,
        msg: prev.msg + `YOUR missile (${playerMissileDist}m) missed the CPU's base by ${playerMissileDist - gameSettings.baseDistanceGap} meters.\n`
      }));
      return false;
    }
  };

  const cpuTurn = () => {
    const degrees = cpuData.choices.minDegreeBound + Math.random() * cpuData.choices.maxDegreeOffset;
    const speed = cpuData.choices.minSpeedBound + Math.random() * cpuData.choices.maxSpeedOffset;
    const cpuMissileDist = calculateMissileTravel(degrees, speed);
    setCpuData(prev => ({ 
      ...prev, 
      firing: true,
      choices: {
        ...prev.choices,
        degrees: degrees, 
        speed: speed 
      }
    }));
    if (isMissileHit(cpuMissileDist)) {
      setTurnLog(prev => ({
        ...prev,
        msgNum: 2,
        msg: prev.msg + "CPU wins!\n"
      }));
      setWinner("cpu");
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
    const angleRad = degreesToRadians(degrees);
    return Math.floor((speed * speed * Math.sin(2 * angleRad)) / 9.80665);
  };

  const missilePath = (degrees, launchSpeed, timeElapsed, direction) => {
    const angleRad = degreesToRadians(degrees);

    if (direction === "horizontal") {
      return launchSpeed*Math.cos(angleRad)*timeElapsed;
    } else if (direction === "vertical") {
      return launchSpeed*Math.sin(angleRad)*timeElapsed - (0.5 * 9.80665 * timeElapsed * timeElapsed);
    }
  }

  const isMissileHit = (playerMissileDist) => {
    return Math.abs(playerMissileDist - gameSettings.baseDistanceGap) <= (conf.baseRadius/1.3);
  }

  const degreesToRadians = (degrees) => { 
    return degrees * Math.PI / 180;
  }

  const radiansToDegrees = (radians) => {
    return radians * 180 /Math.PI;
  }

  const getRotationRate = (data) => {
      const speed = data.choices.speed;
      const degrees = data.choices.degrees;
      const angleRad = degreesToRadians(degrees);
      const animationTotalSecs = (2 * speed * Math.sin(angleRad))/ 9.80665; //time elapsed from y=0 to y=0 again on parabola
      const radiansPerSec = (2 * angleRad * data.missileDirection) / animationTotalSecs; //total rotation is double the starting angle
      const degreesPerSec = radiansToDegrees(radiansPerSec);
      return degreesPerSec;
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



/*******       Populate Data Functions       *******/
  const populateDefaultPlyrData = () => {
    return {
      type: "human",
      missileRef: plyrMissile,
      missileDirection: 1,
      missileOpacity: 0,
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
      missileOpacity: 0,
      firing: false,
      choices: {
        degrees: 0,
        speed: 0,
        minDegreeBound: 30,
        maxDegreeOffset: 25,
        minSpeedBound: 50,
        maxSpeedOffset: 50
      },
      missileCoords: {
        initX: conf.stageWidth - conf.missileSize/2 - getBaseOffset(),
        initY: conf.stageHeight - conf.missileSize,
      },
      baseCoords: {
        x: conf.stageWidth - baseRadius - getBaseOffset(),
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


/*******       JSX      *******/
  return (
    <div className="artillery-container">
        <h1 className="artillery-main-header">React Artillery</h1>
        { gameStats.gamesPlayed == 0 && (
          <button className="artillery-button" onClick={() => startGame()} >Start Game</button>
        )}
        { gameStats.gamesPlayed > 0 && plyrData && cpuData && conf && (
          <div className="gameDisplay" style={{width: conf.stageWidth}}>
            <div className="game-and-round-container">
              <h3 className="game-number">Game #{gameStats.gamesPlayed}</h3>
              <h3 className="round-number">Round #{gameStats.roundNum}</h3>
            </div>
            <div className="artillery-animation">
              <Stage width={conf.stageWidth} height={conf.stageHeight}>
                <Layer>
                  <Image
                    image={missileImg}
                    ref={cpuData.missileRef}
                    x={cpuData.missileCoords.initX}
                    y={cpuData.missileCoords.initY}
                    opacity={cpuData.missileOpacity}
                    // offsetY={30}
                  />
                </Layer>
                <Layer>
                  <Image
                    image={missileImg}
                    ref={plyrData.missileRef}
                    x={plyrData.missileCoords.initX}
                    y={plyrData.missileCoords.initY}
                    opacity={plyrData.missileOpacity}
                    // offsetY={30}
                  />
                </Layer>
                <Layer>
                  <Image
                    image={baseImg}
                    ref={plyrBase}
                    x={plyrData.baseCoords.x}
                    y={plyrData.baseCoords.y}
                    width={conf.baseSize}
                    height={conf.baseSize}
                  />
                </Layer>
                <Layer>
                  <Image
                    image={baseImg}
                    ref={cpuBase}
                    x={cpuData.baseCoords.x}
                    y={cpuData.baseCoords.y}
                    width={conf.baseSize}
                    height={conf.baseSize}
                  />
                </Layer>
                <Layer>
                  <Image
                    image={winScrollImg}
                    ref={winScroll}
                    x={conf.stageWidth / 2}
                    y={conf.stageHeight / 2}
                    opacity={isEndgameScreen ? (winner === "human" ? 1 : 0) : 0}
                    offsetX={winScrollImg.width / 2}
                    offsetY={winScrollImg.height / 2}
                  />
                </Layer>
              </Stage>
            </div>

            <p>The distance between you and your opponent's base is: {gameSettings.baseDistanceGap} meters away.</p>
            { !isEndgameScreen && <p>{gameSettings.isCpuFirst ? "The CPU" : "YOU"} will fire first.</p> }
            { isEndgameScreen && winner === "human" && animationComplete && <p style={{color: "#6F6"}}>YOU win!!!</p> }
            { isEndgameScreen && winner === "cpu" && animationComplete && <p style={{color: "#F66"}}>The CPU wins...</p> }

            <div>
              <label className="artillery-input-label">
                Angle:
                <input 
                  className="artillery-input"
                  type="number"
                  value={plyrData.choices.degrees}  
                  onChange={(e) => setPlyrData(prev => ({ 
                  ...prev, 
                    choices: {
                      ...prev.choices,
                      degrees: parseFloat(e.target.value) 
                    }
                  }))}
                  disabled={cpuData.firing || plyrData.firing} 
                />
              </label>
              <label className="artillery-input-label">
                Speed:
                <input 
                  className="artillery-input" 
                  type="number"
                  value={plyrData.choices.speed}
                  onChange={(e) => setPlyrData(prev => ({ 
                    ...prev, 
                    choices: {
                      ...prev.choices,
                      speed: parseFloat(e.target.value) 
                    }
                  }))} 
                  disabled={cpuData.firing || plyrData.firing} 
                />
              </label>
              { !isEndgameScreen && 
                <button 
                  className="artillery-button" 
                  onClick={() => handleTurn()} 
                  disabled={cpuData.firing || plyrData.firing}
                >
                  Play Turn
                </button> 
              }
              { isEndgameScreen && 
                <button className="artillery-button" onClick={() => startGame()} >New Game</button>}
            </div>

            <div className="artillery-log" ref={scrollableContainerRef}>
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