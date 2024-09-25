import React, { useState, useRef, useEffect } from 'react';
import Countdown from 'react-countdown';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { FaSpotify, FaApple, FaPlay, FaPause, FaLock } from 'react-icons/fa'; // Import FaLock
import throttle from 'lodash.throttle';

const glow = keyframes`
  0% {
      filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0)) drop-shadow(0 0 50px rgba(255, 255, 255, 0.9));
  }
  50% {
      filter: drop-shadow(0 0 15px rgba(255, 255, 255, 1)) drop-shadow(0 0 50px rgba(255, 255, 255, 0.9));
  }
  100% {
      filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0)) drop-shadow(0 0 50px rgba(255, 255, 255, 0.9));
  }
`;

// Keyframe animation for the animated ellipsis
const ellipsis = keyframes`
  0% {
    content: '';
  }
  30% {
    content: '.';
  }
  60% {
    content: '..';
  }
  85% {
    content: '...';
  }
  100% {
    content: '...';
  }
`;

const PresaveButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  background-color: ${(props) => props.bgColor || '#1DB954'};
  border-radius: 30px;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, background-color 0.3s ease, color 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-5px);
    background-color: gray; /* Graying out the button */
    color: rgba(255, 255, 255, 0.5); /* Faded text color */
  }

  & svg.lock-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1rem; /* Smaller size */
    color: white;
    display: none;
  }

  &:hover svg.lock-icon {
    display: block; /* Show the lock icon on hover */
  }
`;

const GlowOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(71, 35, 150, 0.15);
  pointer-events: none;
  opacity: ${(props) => props.opacity};
  transition: opacity -5s ease; /* Faster transition for quicker fade out */
  z-index: 1;
`;

// Styled Components
const VideoBackground = styled.video`
  position: fixed;
  top: 50%;
  left: 50%;
  width: 105%;
  height: 105%;
  object-fit: cover;
  z-index: -1;
  filter: blur(5px);
  transform: translate(-50%, -50%);
`;

const PlayButton = styled.button`
  background-color: transparent;
  border: none;
  padding: 10px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.3s ease;
  position: relative;

  &:hover {
    transform: scale(1.1);
  }

  svg {
    color: white;
    font-size: 1.5rem;
    animation: ${glow} 2s infinite ease-in-out;
    transition: filter 0.3s ease-in-out;

    &:hover {
      filter: drop-shadow(0 0 30px rgba(255, 255, 255, 1)) drop-shadow(0 0 50px rgba(255, 255, 255, 0.9));
    }
  }
`;

const LoopButton = styled.button`
  background-color: rgba(0, 0, 0, 0.2); /* Dark transparent background */
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  margin-top: 30px;
  font-weight: bold;
  padding: 10px 20px; /* Add padding for better appearance */
  border-radius: 12px; /* Rounded edges */
  transition: background-color 0.3s ease; /* Smooth transition on hover */

  &:hover {
    background-color: rgba(0, 0, 0, 0.8); /* Darker background on hover */
  }
`;



const Ellipsis = styled.span`
  display: inline-block;
  &:after {
    content: '';
    animation: ${ellipsis} 3s steps(3, end) infinite;
  }
`;

const CountdownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #fff;
`;


const Title = styled.h1`
  font-size: 40px;
  color: #fffff;
  margin-bottom: -10px;
  font-weight: bold;
`;

const Artists = styled.h2`
  font-size: 20px;
  color: #ffffff;
  margin-bottom: 20px;
  font-weight: normal;
`;

const Divider = styled.hr`
  width: 180px;
  border: 0;
  height: 1px;
  background: white;
  margin: 20px 0;
`;

const TimerText = styled.h1`
  font-size: 48px;
  color: #fffff;
  margin-bottom: 10px;
  margin-top: 0px;
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
`;

const PresaveContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 50px;
  // transform: translateY(50px);
`;


const CompletionMessage = () => <TimerText>It's out now!</TimerText>;

const App = () => {
    const [isLooping, setIsLooping] = useState(false);
    const videoRef = useRef(null);


    const [isPlaying, setIsPlaying] = useState(false);
    const [audioContext, setAudioContext] = useState(null);
    const [analyser, setAnalyser] = useState(null);
    const [overlayOpacity, setOverlayOpacity] = useState(0);
    const audioRef = useRef(null);

    const targetTime = new Date();
    targetTime.setFullYear(2024);    // Set the year to 2024
    targetTime.setMonth(8);          // Set the month to September (0 = January, 8 = September)
    targetTime.setDate(27);          // Set the day to 26th
    targetTime.setHours(0, 0, 0, 0); // Set the time to 12 AM (midnight) in the user's local timezone
    

  
  useEffect(() => {
    if (isPlaying) {
      // Setup the audio context and analyser if it's not set
      if (!audioContext) {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const source = context.createMediaElementSource(audioRef.current);
        const analyserNode = context.createAnalyser();

        analyserNode.fftSize = 256;
        source.connect(analyserNode);
        analyserNode.connect(context.destination);

        setAudioContext(context);
        setAnalyser(analyserNode);
      }

      // Function to update the glow based on the waveform
      const updateGlow = () => {
        if (analyser) {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);

          // Calculate average volume from frequency data
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const newOpacity = Math.min((average / 255) * 2, 1); // Amplified by 2 for stronger effect
          setOverlayOpacity(newOpacity);

          requestAnimationFrame(updateGlow); // Keep updating
        }
      };

      updateGlow(); // Start the glow update loop
    }
  }, [isPlaying, audioContext, analyser]);

  useEffect(() => {
    const handleMouseMove = throttle((e) => {
      const video = videoRef.current;
      if (video) {
        const screenWidth = window.innerWidth;
        const mouseX = e.clientX;
        const percentage = mouseX / screenWidth;
        video.currentTime = percentage * video.duration;
      }
    }, 50);

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    const handleAudioEnded = () => {
      setIsPlaying(false);
      audio.currentTime = 0; // Reset audio to the start when it ends
    };

    audio.addEventListener('ended', handleAudioEnded);
    return () => {
      audio.removeEventListener('ended', handleAudioEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      if(isLooping) {
        setIsLooping(!isLooping);
      }
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleLoop = () => {
    const audio = audioRef.current;
    // Toggle loop on/off
    audio.loop = !audio.loop;
    setIsLooping(!isLooping);
  
    // If audio is not already playing, play it
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  };
  

  return (
    <>
      <VideoBackground ref={videoRef} src="/media/loop.mp4" type="video/mp4" muted loop />
      <GlowOverlay opacity={overlayOpacity} />

      <audio ref={audioRef} src="/media/audio.mp3" />

      <CountdownWrapper>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Title>OTHER HALF</Title>
          <Artists>SUPXR, WYDROB & QKREIGN</Artists>
        </motion.div>

        <Divider />

        <Countdown
            date={targetTime}
            renderer={({ days, hours, minutes, seconds, completed }) => {
                if (completed) {
                return <CompletionMessage />;
                }
                return (
                <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >
                    <TimerText>
                    {days}d {hours}h {minutes}m {seconds}s
                    </TimerText>
                </motion.div>
                );
            }}
        />

        <ButtonsContainer>
          <PlayButton onClick={togglePlay}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </PlayButton>
        </ButtonsContainer>

        <LoopButton onClick={toggleLoop}>
          {isLooping ? (
            <>
              Looping<Ellipsis />
            </>
          ) : (
            'Loop?'
          )}
        </LoopButton>

        <PresaveContainer>
          <PresaveButton
            bgColor="#1DB954"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaSpotify style={{ marginRight: '5px' }} /> Stream on Spotify
            <FaLock className="lock-icon" /> {/* Lock Icon that appears on hover */}

          </PresaveButton>
          <PresaveButton
            bgColor="#FA57C1"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaApple style={{ marginRight: '5px' }} /> Stream on Apple Music
            <FaLock className="lock-icon" /> {/* Lock Icon that appears on hover */}

          </PresaveButton>
      </PresaveContainer>
      </CountdownWrapper>

    </>
  );
};

export default App;
