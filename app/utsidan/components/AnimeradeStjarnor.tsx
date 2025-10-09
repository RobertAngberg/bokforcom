export default function AnimatedStars() {
  return (
    <>
      {/* Animated Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(75)].map((_, i) => {
          const directions = [
            "float-up-right",
            "float-up-left",
            "float-down-right",
            "float-down-left",
            "float-up",
            "float-down",
            "float-left",
            "float-right",
          ];
          const randomDirection = directions[Math.floor(Math.random() * directions.length)];
          const starSize = 1 + Math.random() * 2; // Size between 1px and 3px

          return (
            <div
              key={i}
              className="absolute bg-white rounded-full opacity-0"
              style={{
                width: `${starSize}px`,
                height: `${starSize}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `fade-in 2s ease-out forwards, twinkle ${2 + Math.random() * 3}s ease-in-out infinite alternate, ${randomDirection} ${8 + Math.random() * 12}s linear infinite, pulse ${4 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          );
        })}
      </div>
      <style>{`
        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 0.4;
          }
        }
        @keyframes twinkle {
          0% {
            opacity: 0.2;
            transform: scale(0.5);
          }
          100% {
            opacity: 0.8;
            transform: scale(1.3);
          }
        }
        @keyframes float-up-right {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(-24px) translateX(20px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(-48px) translateX(40px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(-72px) translateX(60px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(-96px) translateX(80px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(-120px) translateX(100px);
            opacity: 0;
          }
        }
        @keyframes float-up-left {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(-24px) translateX(-20px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(-48px) translateX(-40px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(-72px) translateX(-60px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(-96px) translateX(-80px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(-120px) translateX(-100px);
            opacity: 0;
          }
        }
        @keyframes float-down-right {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(24px) translateX(20px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(48px) translateX(40px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(72px) translateX(60px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(96px) translateX(80px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(120px) translateX(100px);
            opacity: 0;
          }
        }
        @keyframes float-down-left {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(24px) translateX(-20px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(48px) translateX(-40px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(72px) translateX(-60px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(96px) translateX(-80px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(120px) translateX(-100px);
            opacity: 0;
          }
        }
        @keyframes float-up {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(-24px) translateX(0px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(-48px) translateX(0px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(-72px) translateX(0px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(-96px) translateX(0px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(-120px) translateX(0px);
            opacity: 0;
          }
        }
        @keyframes float-down {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(24px) translateX(0px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(48px) translateX(0px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(72px) translateX(0px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(96px) translateX(0px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(120px) translateX(0px);
            opacity: 0;
          }
        }
        @keyframes float-left {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(0px) translateX(-20px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(0px) translateX(-40px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(0px) translateX(-60px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(0px) translateX(-80px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(0px) translateX(-100px);
            opacity: 0;
          }
        }
        @keyframes float-right {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.4;
          }
          20% {
            transform: translateY(0px) translateX(20px);
            opacity: 0.6;
          }
          40% {
            transform: translateY(0px) translateX(40px);
            opacity: 0.8;
          }
          60% {
            transform: translateY(0px) translateX(60px);
            opacity: 0.6;
          }
          80% {
            transform: translateY(0px) translateX(80px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(0px) translateX(100px);
            opacity: 0;
          }
        }
        @keyframes pulse {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(255, 255, 255, 0);
          }
          50% {
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
          }
        }
      `}</style>
    </>
  );
}
